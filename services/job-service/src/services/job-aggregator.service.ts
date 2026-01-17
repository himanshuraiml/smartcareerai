import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';
import { ScraperService } from './scraper.service';

// JSearch API from RapidAPI (free tier: 200 requests/month)
const JSEARCH_API_KEY = process.env.JSEARCH_API_KEY || '';
const JSEARCH_HOST = 'jsearch.p.rapidapi.com';

// RemoteOK API (completely free, no auth required)
const REMOTEOK_API = 'https://remoteok.com/api';

interface JobSearchParams {
    query: string;
    location?: string;
    remote?: boolean;
    page?: number;
    limit?: number;
}

export class JobAggregatorService {
    private scraper = new ScraperService();

    // Fetch jobs from multiple sources
    async aggregateJobs(params: JobSearchParams) {
        // Initialize scraper
        await this.scraper.init();

        const results = await Promise.allSettled([
            this.fetchFromRemoteOK(params),
            JSEARCH_API_KEY ? this.fetchFromJSearch(params) : Promise.resolve([]),
            // Add LinkedIn Scraper
            this.scraper.scrapeLinkedIn(params.query, params.location || 'India'),
            // Add Naukri Scraper
            this.scraper.scrapeNaukri(params.query, params.location || 'India'),
            // Add IBM Scraper
            this.scraper.scrapeIBM(params.query)
        ]);

        const jobs: any[] = [];

        for (const result of results) {
            if (result.status === 'fulfilled') {
                jobs.push(...result.value);
            } else {
                logger.error('Job source failed:', result.reason);
            }
        }

        // Deduplicate by title + company
        const seen = new Set();
        const uniqueJobs = jobs.filter(job => {
            const key = `${job.title}-${job.company}`.toLowerCase();
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });

        // Save to database
        await this.saveJobsToDB(uniqueJobs);

        return uniqueJobs.slice(0, params.limit || 20);
    }

    // RemoteOK API - Free, no auth needed
    async fetchFromRemoteOK(params: JobSearchParams): Promise<any[]> {
        try {
            const response = await fetch(REMOTEOK_API, {
                headers: { 'User-Agent': 'SmartCareerAI/1.0' },
            });

            if (!response.ok) {
                throw new Error(`RemoteOK API error: ${response.status}`);
            }

            const data = await response.json();

            // First item is metadata, skip it
            const jobs = Array.isArray(data) ? data.slice(1) : [];

            // Filter by query if provided
            const query = params.query?.toLowerCase() || '';
            const filtered = jobs.filter((job: any) => {
                if (!query) return true;
                const text = `${job.position} ${job.company} ${job.tags?.join(' ')}`.toLowerCase();
                return text.includes(query);
            });

            // Map to our format
            return filtered.slice(0, 50).map((job: any) => ({
                title: job.position,
                company: job.company,
                location: job.location || 'Remote',
                locationType: 'remote',
                description: job.description || '',
                requirements: [],
                requiredSkills: job.tags || [],
                salaryMin: job.salary_min || null,
                salaryMax: job.salary_max || null,
                salaryCurrency: 'USD',
                source: 'remoteok',
                sourceUrl: job.url,
                externalId: job.id?.toString(),
                postedAt: job.date ? new Date(job.date) : new Date(),
            }));
        } catch (error) {
            logger.error('RemoteOK fetch failed:', error);
            return [];
        }
    }

    // JSearch API (RapidAPI) - Free tier available
    async fetchFromJSearch(params: JobSearchParams): Promise<any[]> {
        if (!JSEARCH_API_KEY) {
            logger.warn('JSearch API key not configured');
            return [];
        }

        try {
            const url = new URL('https://jsearch.p.rapidapi.com/search');
            url.searchParams.set('query', params.query);
            if (params.location) {
                url.searchParams.set('query', `${params.query} in ${params.location}`);
            }
            url.searchParams.set('page', String(params.page || 1));
            url.searchParams.set('num_pages', '1');
            if (params.remote) {
                url.searchParams.set('remote_jobs_only', 'true');
            }

            const response = await fetch(url.toString(), {
                headers: {
                    'X-RapidAPI-Key': JSEARCH_API_KEY,
                    'X-RapidAPI-Host': JSEARCH_HOST,
                },
            });

            if (!response.ok) {
                throw new Error(`JSearch API error: ${response.status}`);
            }

            const data: any = await response.json();
            const jobs: any[] = data.data || [];

            return jobs.map((job: any) => ({
                title: job.job_title,
                company: job.employer_name,
                location: job.job_city ? `${job.job_city}, ${job.job_country}` : job.job_country,
                locationType: job.job_is_remote ? 'remote' : 'onsite',
                description: job.job_description || '',
                requirements: job.job_required_skills || [],
                requiredSkills: job.job_required_skills || [],
                salaryMin: job.job_min_salary || null,
                salaryMax: job.job_max_salary || null,
                salaryCurrency: job.job_salary_currency || 'USD',
                experienceMin: job.job_required_experience?.required_experience_in_months
                    ? Math.floor(job.job_required_experience.required_experience_in_months / 12)
                    : null,
                source: 'jsearch',
                sourceUrl: job.job_apply_link,
                externalId: job.job_id,
                postedAt: job.job_posted_at_datetime_utc ? new Date(job.job_posted_at_datetime_utc) : new Date(),
            }));
        } catch (error) {
            logger.error('JSearch fetch failed:', error);
            return [];
        }
    }

    // Save aggregated jobs to database
    async saveJobsToDB(jobs: any[]) {
        for (const job of jobs) {
            try {
                await prisma.jobListing.upsert({
                    where: {
                        source_externalId: {
                            source: job.source,
                            externalId: job.externalId || `${job.source}-${Date.now()}`,
                        },
                    },
                    create: {
                        ...job,
                        externalId: job.externalId || `${job.source}-${Date.now()}`,
                    },
                    update: {
                        title: job.title,
                        description: job.description,
                        requiredSkills: job.requiredSkills,
                        salaryMin: job.salaryMin,
                        salaryMax: job.salaryMax,
                    },
                });
            } catch (error) {
                // Skip duplicates or errors silently
                logger.debug(`Skip job save: ${job.title}`);
            }
        }
    }

    // Sync jobs from all sources (scheduled job)
    async syncAllJobs() {
        const queries = [
            'software developer',
            'frontend developer',
            'backend developer',
            'full stack developer',
            'data scientist',
            'devops engineer',
            'product manager',
        ];

        let totalSynced = 0;

        for (const query of queries) {
            const jobs = await this.aggregateJobs({ query, limit: 30 });
            totalSynced += jobs.length;

            // Rate limiting - wait between queries
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        logger.info(`Job sync complete: ${totalSynced} jobs aggregated`);
        return { synced: totalSynced };
    }
}

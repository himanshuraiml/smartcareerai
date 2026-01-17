import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import * as cheerio from 'cheerio';
import { logger } from '../utils/logger';

// Add stealth plugin
puppeteer.use(StealthPlugin());

export interface ScrapedJob {
    title: string;
    company: string;
    location: string;
    locationType: 'remote' | 'onsite' | 'hybrid';
    description: string;
    source: string;
    sourceUrl: string;
    externalId: string;
    postedAt: Date;
    salaryMin?: number | null;
    salaryMax?: number | null;
}

export class ScraperService {
    private browser: any = null;

    async init() {
        if (!this.browser) {
            this.browser = await puppeteer.launch({
                headless: true, // Set to false for debugging
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--no-first-run',
                    '--no-zygote',
                ],
            });
        }
    }

    async close() {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
        }
    }

    /**
     * Scrape LinkedIn Public Job Search
     * Uses Guest API/Page which doesn't require login
     */
    async scrapeLinkedIn(query: string, location: string = 'India'): Promise<ScrapedJob[]> {
        await this.init();
        const page = await this.browser.newPage();
        const jobs: ScrapedJob[] = [];

        try {
            // Random User Agent
            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

            // Construct URL
            const url = `https://www.linkedin.com/jobs/search?keywords=${encodeURIComponent(query)}&location=${encodeURIComponent(location)}`;
            logger.info(`Scraping LinkedIn: ${url}`);

            await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

            // Random scroll to trigger lazy loading
            await this.autoScroll(page);

            // Get HTML using Cheerio for fast parsing
            const content = await page.content();
            const $ = cheerio.load(content);

            // LinkedIn Public Search Selectors (Subject to change)
            // Strategy: Look for the main job card list
            const jobCards = $('li');

            jobCards.each((_, element) => {
                const card = $(element);

                // Extract basics
                const title = card.find('.base-search-card__title').text().trim();
                const company = card.find('.base-search-card__subtitle').text().trim();
                const locationRaw = card.find('.job-search-card__location').text().trim();
                const link = card.find('a.base-card__full-link').attr('href');
                const dateRaw = card.find('time').attr('datetime');

                // Basic validation
                if (!title || !company || !link) return;

                // ID extraction
                // Link format: https://www.linkedin.com/jobs/view/38090909090...
                const idMatch = link.match(/view\/(\d+)/);
                const externalId = idMatch ? idMatch[1] : `li-${Date.now()}-${Math.random()}`;

                // Location Type
                let locationType: 'remote' | 'onsite' | 'hybrid' = 'onsite';
                if (title.toLowerCase().includes('remote') || locationRaw.toLowerCase().includes('remote')) {
                    locationType = 'remote';
                } else if (title.toLowerCase().includes('hybrid') || locationRaw.toLowerCase().includes('hybrid')) {
                    locationType = 'hybrid';
                }

                jobs.push({
                    title,
                    company,
                    location: locationRaw,
                    locationType,
                    description: '',
                    source: 'linkedin',
                    sourceUrl: link.split('?')[0],
                    externalId,
                    postedAt: dateRaw ? new Date(dateRaw) : new Date(),
                    salaryMin: null,
                    salaryMax: null
                });
            });

            logger.info(`Found ${jobs.length} jobs on LinkedIn. Fetching details...`);

            // Visit each job page to get description (limited to first 5 for safety/speed in this demo)
            for (let i = 0; i < Math.min(jobs.length, 5); i++) {
                const job = jobs[i];
                try {
                    logger.info(`Fetching details for: ${job.title} at ${job.company}`);
                    await page.goto(job.sourceUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });

                    // Human delay
                    await new Promise(r => setTimeout(r, 2000 + Math.random() * 2000));

                    const detailsContent = await page.content();
                    const $details = cheerio.load(detailsContent);

                    // Selectors for description
                    // 1. User provided selector
                    // 2. Common public page selector
                    // 3. Fallback
                    const desc = $details('[data-testid="expandable-text-box"]').html() ||
                        $details('.show-more-less-html__markup').html() ||
                        $details('.description__text').html() || '';

                    job.description = this.cleanHtml(desc);

                } catch (err) {
                    logger.warn(`Failed to fetch details for ${job.title}:`, err);
                }
            }

            logger.info(`Scraping complete.`);

        } catch (error) {
            logger.error('LinkedIn Scrape Failed:', error);
        } finally {
            await page.close();
        }

        return jobs;
    }



    private cleanTitle(title: string): string {
        if (!title) return '';
        return title
            .replace(/(\.st\d+\{.*?\})/g, '') // Remove CSS like .st0{fill:none;}
            .replace(/\{.*?\}/g, '') // Remove generic braces content
            .replace(/\s+/g, ' ')
            .trim();
    }

    private cleanHtml(html: string): string {
        if (!html) return '';
        // Remove tags but keep logical spacing
        return html
            .replace(/<br\s*\/?>/gi, '\n')
            .replace(/<p>/gi, '\n')
            .replace(/<[^>]+>/g, '') // Strip remaining tags
            .replace(/&nbsp;/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    // Helper to scroll page
    private async autoScroll(page: any) {
        await page.evaluate(async () => {
            await new Promise<void>((resolve) => {
                let totalHeight = 0;
                const distance = 100;
                const timer = setInterval(() => {
                    const scrollHeight = document.body.scrollHeight;
                    window.scrollBy(0, distance);
                    totalHeight += distance;

                    if (totalHeight >= scrollHeight || totalHeight > 5000) { // Limit scroll
                        clearInterval(timer);
                        resolve();
                    }
                }, 100);
            });
        });
    }

    /**
     * Scrape Naukri Public Search
     */
    async scrapeNaukri(query: string, location: string = ''): Promise<ScrapedJob[]> {
        await this.init();
        const page = await this.browser.newPage();
        const jobs: ScrapedJob[] = [];

        try {
            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

            // Naukri URL format
            const url = `https://www.naukri.com/${query}-jobs?k=${encodeURIComponent(query)}&l=${encodeURIComponent(location)}`;
            logger.info(`Scraping Naukri: ${url}`);

            await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
            await this.autoScroll(page);

            const content = await page.content();
            const $ = cheerio.load(content);

            // Naukri Selectors
            const jobCards = $('.srp-jobtuple-wrapper');

            jobCards.each((_, element) => {
                const card = $(element);

                const title = card.find('.title').text().trim();
                const company = card.find('.comp-name').text().trim();
                const locationRaw = card.find('.loc').text().trim();
                const link = card.find('.title').attr('href');
                const exp = card.find('.exp').text().trim();
                const salary = card.find('.sal').text().trim(); // "3-5 Lacs PA"

                if (!title || !company || !link) return;

                // ID from link
                const externalId = `naukri-${Date.now()}-${Math.random()}`;

                // Location Type detection
                let locationType: 'remote' | 'onsite' | 'hybrid' = 'onsite';
                if (title.toLowerCase().includes('remote') || locationRaw.toLowerCase().includes('remote')) {
                    locationType = 'remote';
                }

                // Simple salary parsing (e.g., "3-5 Lacs PA")
                let minSal: number | null = null;
                let maxSal: number | null = null;
                if (salary && salary.includes('Lacs')) {
                    const matches = salary.match(/(\d+)-(\d+)/);
                    if (matches) {
                        minSal = parseInt(matches[1]) * 100000;
                        maxSal = parseInt(matches[2]) * 100000;
                    }
                }

                jobs.push({
                    title,
                    company,
                    location: locationRaw,
                    locationType,
                    description: `Experience: ${exp}`, // Partial desc
                    source: 'naukri',
                    sourceUrl: link,
                    externalId,
                    postedAt: new Date(),
                    salaryMin: minSal,
                    salaryMax: maxSal
                });
            });

            logger.info(`Found ${jobs.length} jobs on Naukri for ${query}`);

        } catch (error) {
            logger.error('Naukri Scrape Failed:', error);
        } finally {
            await page.close();
        }

        return jobs;
    }

    /**
     * Scrape IBM Careers
     */

    /**
     * Scrape IBM Careers
     */
    async scrapeIBM(query: string): Promise<ScrapedJob[]> {
        await this.init();
        const page = await this.browser.newPage();
        const jobs: ScrapedJob[] = [];

        try {
            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

            // IBM Careers Search URL
            const url = `https://www.ibm.com/careers/search?q=${encodeURIComponent(query)}`;
            logger.info(`Scraping IBM: ${url}`);

            await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
            await new Promise(r => setTimeout(r, 5000)); // IBM site is heavy

            // IBM usually renders a list of links
            const content = await page.content();
            const $ = cheerio.load(content);

            // IBM Link Logic
            $('a').each((_, element) => {
                const link = $(element);
                const href = link.attr('href');

                // Extract text from specific headers to avoid CSS garbage
                let rawTitle = link.find('h3, h2, h4').text().trim();
                // Fallback to full text if no headers
                if (!rawTitle) rawTitle = link.text();

                const title = this.cleanTitle(rawTitle);

                // IBM often uses 'careers.ibm.com' or 'ibm.com/careers'
                // We look for job ID patterns or specific paths
                if (href && (href.includes('/job/') || href.includes('JobDetail') || href.includes('jobId=')) && title.length > 5) {
                    let fullUrl = href;
                    if (href.startsWith('/')) {
                        fullUrl = `https://www.ibm.com${href}`;
                    }

                    jobs.push({
                        title: title,
                        company: 'IBM',
                        location: 'Unknown',
                        locationType: 'onsite',
                        description: '',
                        source: 'ibm',
                        sourceUrl: fullUrl,
                        externalId: `ibm-${Math.random().toString(36).substr(2, 9)}`,
                        postedAt: new Date(),
                        salaryMin: null,
                        salaryMax: null
                    });
                }
            });

            logger.info(`Found ${jobs.length} potential jobs on IBM. Fetching details...`);

            // Fetch details for top 5
            for (let i = 0; i < Math.min(jobs.length, 5); i++) {
                const job = jobs[i];
                try {
                    await page.goto(job.sourceUrl, { waitUntil: 'domcontentloaded' });
                    await new Promise(r => setTimeout(r, 2000));

                    const detailHtml = await page.content();
                    const $d = cheerio.load(detailHtml);

                    const locationText = $d('main').text().match(/Location:?\s*([^\n]+)/i)?.[1]?.trim();
                    job.location = locationText || 'Multilocation';

                    // Improved description selector
                    const desc = $d('main').find('div[class*="description"], div[class*="content"]').html() || $d('main').html() || '';
                    job.description = this.cleanHtml(desc);

                } catch (e) {
                    logger.warn(`Failed IBM detail: ${job.sourceUrl}`);
                }
            }

        } catch (error) {
            logger.error('IBM Scrape Failed:', error);
        } finally {
            await page.close();
        }

        return jobs;
    }

    // Sanitize data
    public cleanData(jobs: ScrapedJob[]): ScrapedJob[] {
        // Remove duplicates in current batch
        const unique = new Map();
        for (const job of jobs) {
            job.title = this.cleanTitle(job.title);
            unique.set(job.sourceUrl, job);
        }

        return Array.from(unique.values());
    }
}

import { ScraperService } from './services/scraper.service';


async function main() {
    console.log('Starting Scraper Test...');
    const scraper = new ScraperService();

    try {
        await scraper.init();

        console.log('Scraping LinkedIn...');
        const liJobs = await scraper.scrapeLinkedIn('software engineer', 'India');

        console.log('Scraping IBM...');
        const ibmJobs = await scraper.scrapeIBM('software engineer');

        const jobs = [...liJobs, ...ibmJobs];

        console.log(`Found ${jobs.length} jobs`);
        if (jobs.length > 0) {
            console.log('Sample Job:', JSON.stringify(jobs[0], null, 2));
        }

    } catch (error) {
        console.error('Test Failed:', error);
    } finally {
        await scraper.close();
    }
}

main();

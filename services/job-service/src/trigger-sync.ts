import { JobAggregatorService } from './services/job-aggregator.service';


async function main() {
    console.log('Starting Immediate Job Sync...');
    const aggregator = new JobAggregatorService();

    try {
        await aggregator.syncAllJobs();
        console.log('Job Sync Completed Successfully. Jobs saved to database.');
    } catch (error) {
        console.error('Job Sync Failed:', error);
    }
}

main();

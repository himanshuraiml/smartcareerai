import * as mediasoup from 'mediasoup';
import { mediasoupConfig } from '../config/mediasoup.config';
import { logger } from '../utils/logger';

class WorkerManager {
    private workers: mediasoup.types.Worker[] = [];
    private nextWorkerIndex = 0;

    async init(): Promise<void> {
        const { numWorkers, worker: workerSettings } = mediasoupConfig;

        for (let i = 0; i < numWorkers; i++) {
            const worker = await mediasoup.createWorker({
                logLevel: workerSettings.logLevel,
                logTags: workerSettings.logTags,
                rtcMinPort: workerSettings.rtcMinPort,
                rtcMaxPort: workerSettings.rtcMaxPort,
            });

            worker.on('died', (error) => {
                logger.error(`MediaSoup Worker died [pid:${worker.pid}]`, error);
                setTimeout(async () => {
                    const idx = this.workers.indexOf(worker);
                    if (idx !== -1) {
                        const replacement = await mediasoup.createWorker({
                            logLevel: workerSettings.logLevel,
                            logTags: workerSettings.logTags,
                            rtcMinPort: workerSettings.rtcMinPort,
                            rtcMaxPort: workerSettings.rtcMaxPort,
                        });
                        this.workers[idx] = replacement;
                        logger.info(`MediaSoup Worker replaced [pid:${replacement.pid}]`);
                    }
                }, 2000);
            });

            this.workers.push(worker);
            logger.info(`MediaSoup Worker created [pid:${worker.pid}]`);
        }
    }

    getNextWorker(): mediasoup.types.Worker {
        if (this.workers.length === 0) {
            throw new Error('No MediaSoup workers available');
        }
        const worker = this.workers[this.nextWorkerIndex];
        this.nextWorkerIndex = (this.nextWorkerIndex + 1) % this.workers.length;
        return worker;
    }

    async close(): Promise<void> {
        for (const worker of this.workers) {
            worker.close();
        }
        this.workers = [];
    }
}

export const workerManager = new WorkerManager();

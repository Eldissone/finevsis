import { Worker } from 'bullmq';
import { redisConnection } from '../connection.js';
import { collectNewsData, collectPublicApiData } from '../../collectors/marketCollector.js';
import { upsertTrendsFromMarketData } from '../../services/etlService.js';
import { logger } from '../../services/logger.js';

export const marketWorker = new Worker(
  'marketCollection',
  async (job) => {
    logger.info(`🔄 Processing job ${job.id} of type ${job.name}`);
    
    switch (job.name) {
      case 'collectNews':
        await collectNewsData();
        break;
      case 'collectEconomics':
        await collectPublicApiData();
        break;
      case 'etlTrends':
        await upsertTrendsFromMarketData({ limit: 60 });
        break;
      default:
        throw new Error(`Unknown job type: ${job.name}`);
    }
  },
  { connection: redisConnection }
);

marketWorker.on('completed', (job) => {
  logger.info(`✅ Job ${job.id} completed successfully`);
});

marketWorker.on('failed', (job, err) => {
  logger.error(`❌ Job ${job.id} failed with error: ${err.message}`);
});

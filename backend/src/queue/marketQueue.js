import { Queue } from 'bullmq';
import { redisConnection } from './connection.js';

export const marketQueue = redisConnection
  ? new Queue('marketCollection', {
      connection: redisConnection,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
        removeOnComplete: true,
        removeOnFail: false,
      },
    })
  : {
      // Fallback shim para ambientes sem Redis
      add: async (_name, _data) => {
        throw new Error('Queue is disabled (REDIS_URL not set)');
      },
    };

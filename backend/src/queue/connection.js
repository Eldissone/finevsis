import Redis from 'ioredis';

export const redisConnection = process.env.REDIS_URL
  ? new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: null,
      lazyConnect: true,
      retryStrategy: (times) => {
        if (times > 3) return null;
        return Math.min(times * 50, 2000);
      },
    })
  : null;

if (redisConnection) {
  redisConnection.on('error', (err) => {
    if (err.code !== 'ECONNREFUSED') {
      console.error('Redis Error:', err.message);
    }
  });
}

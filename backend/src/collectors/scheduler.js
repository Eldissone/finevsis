// src/collectors/scheduler.js
// Agendador de coleta de dados com node-cron

import '../config/env.js';
import cron from 'node-cron';
import Redis from 'ioredis';
import { logger } from '../services/logger.js';
import { marketQueue } from '../queue/marketQueue.js';
import { collectNewsData, collectPublicApiData } from './marketCollector.js';
import { upsertTrendsFromMarketData } from '../services/etlService.js';// Só carrega o worker quando Redis estiver configurado
if (process.env.REDIS_URL) {
  await import('../queue/workers/marketWorker.js').catch(() => {});
}

logger.info('📅 FINEVSIS Scheduler iniciado');

// Coleta de notícias a cada 6 horas
cron.schedule('0 */6 * * *', async () => {
  if (process.env.REDIS_URL) {
    logger.info('⏰ [CRON] Adicionando job de coleta de notícias na fila...');
    await marketQueue.add('collectNews', {}).catch(async () => {
         logger.info('⏰ [CRON] Redis inacessível! Executando coleta de notícias inline...');
         await collectNewsData();
    });
  } else {
    logger.info('⏰ [CRON] Executando coleta de notícias inline (sem Redis)...');
    await collectNewsData();
  }
});

// Dados económicos — uma vez por dia às 02:00
cron.schedule('0 2 * * *', async () => {
  if (process.env.REDIS_URL) {
    logger.info('⏰ [CRON] Adicionando job de coleta económica na fila...');
    await marketQueue.add('collectEconomics', {}).catch(async () => {
        logger.info('⏰ [CRON] Redis inacessível! Executando coleta económica inline...');
        await collectPublicApiData();
    });
  } else {
    logger.info('⏰ [CRON] Executando coleta económica inline (sem Redis)...');
    await collectPublicApiData();
  }
});

// ETL de sinais → tendências — diariamente às 03:00
cron.schedule('0 3 * * *', async () => {
  if (process.env.REDIS_URL) {
    logger.info('⏰ [CRON] Adicionando job de ETL de MarketData para Trends...');
    await marketQueue.add('etlTrends', {}).catch(async () => {
        logger.info('⏰ [CRON] Redis inacessível! Executando ETL Trends inline...');
        await upsertTrendsFromMarketData({ limit: 60 });
    });
  } else {
    logger.info('⏰ [CRON] Executando ETL Trends inline (sem Redis)...');
    await upsertTrendsFromMarketData({ limit: 60 });
  }
});

// Mantém o processo ativo
process.on('SIGTERM', () => {
  logger.info('Scheduler encerrado graciosamente');
  process.exit(0);
});

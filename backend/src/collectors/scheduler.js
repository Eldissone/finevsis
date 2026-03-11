// src/collectors/scheduler.js
// Agendador de coleta de dados com node-cron

import '../config/env.js';
import cron from 'node-cron';
import { collectNewsData, collectPublicApiData } from './marketCollector.js';
import { logger } from '../services/logger.js';
import { upsertTrendsFromMarketData } from '../services/etlService.js';

logger.info('📅 FINEVSIS Scheduler iniciado');

// Coleta de notícias a cada 6 horas
cron.schedule('0 */6 * * *', async () => {
  logger.info('⏰ [CRON] Iniciando coleta de notícias...');
  await collectNewsData();
});

// Dados económicos — uma vez por dia às 02:00
cron.schedule('0 2 * * *', async () => {
  logger.info('⏰ [CRON] Iniciando coleta de dados económicos...');
  await collectPublicApiData();
});

// ETL de sinais → tendências — diariamente às 03:00
cron.schedule('0 3 * * *', async () => {
  logger.info('⏰ [CRON] Iniciando ETL de MarketData para Trends...');
  const result = await upsertTrendsFromMarketData({ limit: 60 });
  logger.info(`ETL concluído: ${JSON.stringify(result)}`);
});

// Mantém o processo ativo
process.on('SIGTERM', () => {
  logger.info('Scheduler encerrado graciosamente');
  process.exit(0);
});

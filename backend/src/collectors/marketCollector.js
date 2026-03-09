// src/collectors/marketCollector.js
// Coleta automática de dados de mercado

import axios from 'axios';
import puppeteer from 'puppeteer';
import { PrismaClient } from '@prisma/client';
import { logger } from '../services/logger.js';

const prisma = new PrismaClient();

/**
 * Coleta de notícias via NewsAPI
 */
export async function collectNewsData(keywords = ['startup Angola', 'tecnologia Africa', 'fintech Angola']) {
  if (!process.env.NEWSAPI_KEY) {
    logger.warn('NEWSAPI_KEY não configurada — coleta de notícias ignorada');
    return [];
  }

  const results = [];
  for (const keyword of keywords) {
    try {
      const { data } = await axios.get('https://newsapi.org/v2/everything', {
        params: { q: keyword, language: 'pt', sortBy: 'publishedAt', pageSize: 10 },
        headers: { 'X-Api-Key': process.env.NEWSAPI_KEY },
      });

      for (const article of data.articles || []) {
        await prisma.marketData.create({
          data: {
            source: 'newsapi',
            dataType: 'news',
            keyword,
            rawPayload: article,
          },
        });
        results.push(article);
      }
      logger.info(`Coletados ${data.articles?.length || 0} artigos para: ${keyword}`);
    } catch (err) {
      logger.error(`Erro coletando notícias para "${keyword}": ${err.message}`);
    }
  }
  return results;
}

/**
 * Scraping de tendências com Puppeteer
 */
export async function scrapeTrendsPage(url, selector = 'body') {
  let browser;
  try {
    browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    const text = await page.$eval(selector, el => el.innerText);

    await prisma.marketData.create({
      data: {
        source: 'puppeteer',
        dataType: 'scraping',
        keyword: url,
        rawPayload: { url, text: text.substring(0, 5000) },
      },
    });

    logger.info(`Scraping concluído: ${url}`);
    return text;
  } catch (err) {
    logger.error(`Erro no scraping de ${url}: ${err.message}`);
    return null;
  } finally {
    if (browser) await browser.close();
  }
}

/**
 * Coleta dados de APIs públicas (exemplo: dados económicos)
 */
export async function collectPublicApiData() {
  try {
    // Exemplo: World Bank API (dados Angola)
    const { data } = await axios.get(
      'https://api.worldbank.org/v2/country/AO/indicator/NY.GDP.MKTP.CD?format=json&mrv=5'
    );

    if (data?.[1]) {
      await prisma.marketData.create({
        data: {
          source: 'worldbank',
          dataType: 'economic',
          keyword: 'GDP Angola',
          region: 'AO',
          rawPayload: { records: data[1] },
        },
      });
      logger.info('Dados económicos do World Bank coletados');
    }
  } catch (err) {
    logger.error(`Erro coletando dados World Bank: ${err.message}`);
  }
}

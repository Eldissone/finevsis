import prisma from '../lib/prisma.js';
import { logger } from './logger.js';

function normalizeText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function guessTitleFromRecord(record) {
  const raw = record.rawPayload || {};
  const keyword = normalizeText(record.keyword);
  const source = normalizeText(record.source);
  const title = normalizeText(raw.title || raw.headline || keyword || source || 'Sinal de mercado');
  return title.split('\n').shift().slice(0, 100);
}

function deriveCountry(record, fallbackCountry) {
  if (normalizeText(record.region) && record.region.length <= 3) return fallbackCountry || null;
  const keyword = normalizeText(record.keyword);
  if (fallbackCountry && keyword.toLowerCase().includes(fallbackCountry.toLowerCase())) return fallbackCountry;
  return fallbackCountry || null;
}

function pickCategory(record) {
  const type = normalizeText(record.dataType);
  if (type === 'news') return 'Notícias';
  if (type === 'economic') return 'Economia';
  if (type === 'scraping') return 'Mercado';
  return 'Geral';
}

function heuristicGrowth(raw) {
  const base = 60 + ((normalizeText(raw.title || raw.text || '').length % 35));
  return Math.max(40, Math.min(95, base));
}

function heuristicRelevance(raw) {
  const base = 55 + ((normalizeText(raw.source?.name || '').length % 40));
  return Math.max(30, Math.min(92, base));
}

export async function upsertTrendsFromMarketData({ country, city, limit = 40 } = {}) {
  const where = {};
  if (country) where.OR = [{ region: country.slice(0, 2).toUpperCase() }, { keyword: { contains: country, mode: 'insensitive' } }];

  const records = await prisma.marketData.findMany({
    where,
    orderBy: { collectedAt: 'desc' },
    take: limit,
  });

  if (records.length === 0) {
    // Sem sinais: criar 3 tendências heurísticas para o país solicitado
    if (country) {
      const heuristics = [
        { title: `Digitalização em ${country}`, category: 'Mercado' },
        { title: `Eficiência Operacional em ${country}`, category: 'Economia' },
        { title: `Adoção de Pagamentos em ${country}`, category: 'Finanças' },
      ];
      for (const h of heuristics) {
        await prisma.trend.create({
          data: {
            title: h.title,
            category: h.category,
            sector: 'Geral',
            country,
            city: city || null,
            growthRate: 65,
            relevance: 70,
            source: 'heuristic',
            status: 'emerging',
          },
        });
      }
      return { created: heuristics.length, updated: 0, processed: 0, mode: 'heuristic' };
    }
    return { created: 0, updated: 0, processed: 0, mode: 'empty' };
  }

  let created = 0;
  let updated = 0;

  for (const record of records) {
    try {
      const title = guessTitleFromRecord(record);
      const countryFinal = country || deriveCountry(record, null);
      const raw = record.rawPayload || {};
      const growthRate = heuristicGrowth(raw);
      const relevance = heuristicRelevance(raw);

      const existing = await prisma.trend.findFirst({
        where: { title, country: countryFinal || undefined },
      });

      if (existing) {
        await prisma.trend.update({
          where: { id: existing.id },
          data: {
            relevance: Math.max(existing.relevance, relevance),
            growthRate: Math.max(existing.growthRate, growthRate),
            source: record.source,
            sector: existing.sector || 'Geral',
            city: existing.city || city || null,
          },
        });
        updated += 1;
      } else {
        await prisma.trend.create({
          data: {
            title,
            category: pickCategory(record),
            sector: 'Geral',
            country: countryFinal,
            city: city || null,
            growthRate,
            relevance,
            source: record.source,
            status: 'emerging',
            rawData: { ref: record.id },
          },
        });
        created += 1;
      }
    } catch (error) {
      logger.warn(`ETL trend skip: ${error.message}`);
    }
  }

  return { created, updated, processed: records.length, mode: 'records' };
}

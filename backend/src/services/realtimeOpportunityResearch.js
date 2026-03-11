import axios from 'axios';
import Anthropic from '@anthropic-ai/sdk';
import prisma from '../lib/prisma.js';
import { logger } from './logger.js';
import { calculateOpportunityScore, getPriority } from './scoringService.js';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function hasAnthropicKey() {
  return Boolean(process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_API_KEY.includes('...'));
}

function hasNewsApiKey() {
  return Boolean(process.env.NEWSAPI_KEY);
}

function normalizeText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function clampScore(value, fallback = 0) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.max(0, Math.min(100, Math.round(numeric)));
}

function buildLocationContext({ country, city }) {
  if (country && city) return `${city}, ${country}`;
  if (country) return country;
  if (city) return city;
  return 'mercado africano';
}

function buildSearchQueries({ sector, country, city }) {
  const safeSector = normalizeText(sector) || 'negocios';
  const safeCountry = normalizeText(country);
  const safeCity = normalizeText(city);
  const location = [safeCity, safeCountry].filter(Boolean).join(' ');
  const marketScope = safeCountry || 'Africa';
  const queries = [
    [safeSector, location || marketScope, 'startup'].filter(Boolean).join(' '),
    [safeSector, marketScope, 'market demand'].filter(Boolean).join(' '),
    [marketScope, safeSector, 'digital adoption'].filter(Boolean).join(' '),
    [marketScope, safeSector, 'consumer trends'].filter(Boolean).join(' '),
  ];

  return [...new Set(queries.map(normalizeText).filter(Boolean))];
}

function dedupeSignals(signals) {
  const seen = new Set();
  return signals.filter(signal => {
    const key = `${signal.title}|${signal.url}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function fetchNewsSignals({ sector, country, city }) {
  if (!hasNewsApiKey()) return [];

  const from = new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString();
  const queries = buildSearchQueries({ sector, country, city });
  const signals = [];

  for (const query of queries) {
    try {
      const response = await axios.get('https://newsapi.org/v2/everything', {
        params: {
          q: query,
          from,
          sortBy: 'publishedAt',
          pageSize: 6,
          searchIn: 'title,description',
        },
        headers: { 'X-Api-Key': process.env.NEWSAPI_KEY },
      });

      for (const article of response.data.articles || []) {
        signals.push({
          title: normalizeText(article.title),
          description: normalizeText(article.description) || normalizeText(article.content),
          sourceName: normalizeText(article.source?.name) || 'news',
          url: article.url,
          publishedAt: article.publishedAt,
        });
      }
    } catch (error) {
      logger.warn(`live news fetch failed for "${query}": ${error.message}`);
    }
  }

  return dedupeSignals(signals).filter(signal => signal.title);
}

function extractStoredSignal(record) {
  const raw = record.rawPayload || {};
  return {
    title: normalizeText(raw.title || raw.headline || record.keyword),
    description: normalizeText(raw.description || raw.text || raw.summary),
    sourceName: normalizeText(raw.source?.name || record.source),
    url: normalizeText(raw.url),
    publishedAt: raw.publishedAt || record.collectedAt?.toISOString?.() || null,
  };
}

async function fetchStoredSignals(limit = 12) {
  const records = await prisma.marketData.findMany({
    orderBy: { collectedAt: 'desc' },
    take: limit,
  });

  return dedupeSignals(records.map(extractStoredSignal)).filter(signal => signal.title);
}

function buildResearchMeta(mode, signals) {
  return {
    mode,
    signalsCount: signals.length,
    refreshedAt: new Date().toISOString(),
  };
}

function buildHeuristicOpportunities(signals, { sector, country, city, limit }) {
  const location = buildLocationContext({ country, city });

  return signals.slice(0, limit).map((signal, index) => {
    const marketDemand = clampScore(65 + (signal.title.length % 20));
    const competitionLevel = clampScore(28 + (index * 7) % 25);
    const technicalViability = clampScore(60 + (signal.sourceName.length % 18));
    const impactScore = clampScore(62 + (signal.description.length % 24));
    const scalability = clampScore(58 + (index * 6) % 28);
    const finalScore = calculateOpportunityScore({
      marketDemand,
      competitionLevel,
      technicalViability,
      impactScore,
      scalability,
    });

    return {
      id: `live-heuristic-${index}`,
      title: signal.title,
      description: signal.description || `Sinal recente detectado em ${location} com potencial de virar oportunidade comercial.`,
      sector: normalizeText(sector) || 'Geral',
      country: country || null,
      city: city || null,
      marketDemand,
      competitionLevel,
      technicalViability,
      impactScore,
      scalability,
      finalScore,
      priority: getPriority(finalScore),
      tags: ['ai-live', signal.sourceName].filter(Boolean),
      aiAnalysis: {
        liveResearch: true,
        whyNow: `O sinal foi capturado recentemente e sugere movimento de mercado relevante para ${location}.`,
        evidence: [signal.title, signal.description].filter(Boolean),
        sourceLinks: signal.url ? [signal.url] : [],
      },
    };
  });
}

function buildGenericSignals({ sector, country, city, limit }) {
  const location = buildLocationContext({ country, city });
  const base = normalizeText(sector) || 'Mercado';
  const templates = [
    `${base} — adoção digital acelera em ${location}`,
    `${base} — novas parcerias e canais em ${location}`,
    `${base} — procura por eficiência operacional em ${location}`,
    `${base} — soluções de baixo custo ganham tração em ${location}`,
    `${base} — consumidores migram para experiências mobile em ${location}`,
  ];
  return Array.from({ length: Math.max(3, Math.min(limit, 8)) }, (_, i) => ({
    title: templates[i % templates.length],
    description: `Sinal heurístico construído a partir de contexto local (${location}) e foco setorial (${base}).`,
    sourceName: 'heuristic',
    url: '',
  }));
}
function sanitizeAiOpportunity(raw, index, { sector, country, city }) {
  const marketDemand = clampScore(raw.market_demand ?? raw.marketDemand, 60);
  const competitionLevel = clampScore(raw.competition_level ?? raw.competitionLevel, 35);
  const technicalViability = clampScore(raw.technical_viability ?? raw.technicalViability, 62);
  const impactScore = clampScore(raw.impact_score ?? raw.impactScore, 64);
  const scalability = clampScore(raw.scalability, 58);
  const finalScore = calculateOpportunityScore({
    marketDemand,
    competitionLevel,
    technicalViability,
    impactScore,
    scalability,
  });

  return {
    id: `live-ai-${index}`,
    title: normalizeText(raw.title) || normalizeText(raw.opportunity_title) || `Oportunidade ${index + 1}`,
    description: normalizeText(raw.description) || normalizeText(raw.summary),
    sector: normalizeText(raw.sector) || normalizeText(sector) || 'Geral',
    country: country || null,
    city: city || null,
    marketDemand,
    competitionLevel,
    technicalViability,
    impactScore,
    scalability,
    finalScore,
    priority: getPriority(finalScore),
    tags: Array.isArray(raw.tags) ? raw.tags.filter(Boolean) : ['ai-live'],
    aiAnalysis: {
      liveResearch: true,
      whyNow: normalizeText(raw.why_now) || normalizeText(raw.whyNow),
      evidence: Array.isArray(raw.evidence) ? raw.evidence.filter(Boolean) : [],
      sourceLinks: Array.isArray(raw.source_links) ? raw.source_links.filter(Boolean) : [],
    },
  };
}

async function requestAiResearch(signals, { sector, country, city, limit }) {
  const location = buildLocationContext({ country, city });
  const prompt = `
Voce e o motor de pesquisa em tempo real do FINEVSIS.
Com base nestes sinais recentes de mercado, identifique as melhores oportunidades atuais.
Foco geografico: "${location}".
Setor preferencial: "${normalizeText(sector) || 'Geral'}".

SINAIS:
${signals.map((signal, index) => `${index + 1}. ${signal.title} | ${signal.description || 'sem descricao'} | fonte: ${signal.sourceName} | link: ${signal.url || 'n/a'}`).join('\n')}

Responda APENAS em JSON valido, sem markdown:
{
  "opportunities": [
    {
      "title": "titulo curto",
      "description": "descricao objetiva em 2 frases",
      "sector": "setor recomendado",
      "market_demand": <0-100>,
      "competition_level": <0-100>,
      "technical_viability": <0-100>,
      "impact_score": <0-100>,
      "scalability": <0-100>,
      "why_now": "porque agora",
      "evidence": ["evidencia 1", "evidencia 2"],
      "source_links": ["https://fonte1.com", "https://fonte2.com"],
      "tags": ["tag1", "tag2"]
    }
  ]
}

Limite a ${limit} oportunidades.
`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1600,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = response.content.map(block => block.text || '').join('');
  const clean = text.replace(/```json|```/g, '').trim();
  const parsed = JSON.parse(clean);
  const opportunities = Array.isArray(parsed.opportunities) ? parsed.opportunities : [];

  return opportunities.slice(0, limit).map((entry, index) => sanitizeAiOpportunity(entry, index, { sector, country, city }));
}

export async function researchRealtimeOpportunities({ sector, country, city, limit = 12 }) {
  const numericLimit = Math.max(1, Math.min(Number.parseInt(limit, 10) || 12, 24));
  const liveSignals = await fetchNewsSignals({ sector, country, city });
  const signals = liveSignals.length > 0 ? liveSignals : await fetchStoredSignals(Math.max(numericLimit * 2, 10));

  if (signals.length === 0) {
    const genericSignals = buildGenericSignals({ sector, country, city, limit: numericLimit });
    return {
      opportunities: buildHeuristicOpportunities(genericSignals, { sector, country, city, limit: numericLimit }),
      meta: buildResearchMeta('heuristic_empty', genericSignals),
    };
  }

  if (!hasAnthropicKey()) {
    return {
      opportunities: buildHeuristicOpportunities(signals, { sector, country, city, limit: numericLimit }),
      meta: buildResearchMeta(liveSignals.length > 0 ? 'heuristic_live' : 'heuristic_stored', signals),
    };
  }

  try {
    const opportunities = await requestAiResearch(signals, {
      sector,
      country,
      city,
      limit: numericLimit,
    });

    if (opportunities.length === 0) {
      return {
        opportunities: buildHeuristicOpportunities(signals, { sector, country, city, limit: numericLimit }),
        meta: buildResearchMeta(liveSignals.length > 0 ? 'heuristic_live' : 'heuristic_stored', signals),
      };
    }

    return {
      opportunities: opportunities.sort((left, right) => right.finalScore - left.finalScore),
      meta: buildResearchMeta(liveSignals.length > 0 ? 'ai_live' : 'ai_stored', signals),
    };
  } catch (error) {
    logger.warn(`live opportunity AI research failed: ${error.message}`);
    return {
      opportunities: buildHeuristicOpportunities(signals, { sector, country, city, limit: numericLimit }),
      meta: buildResearchMeta(liveSignals.length > 0 ? 'heuristic_live' : 'heuristic_stored', signals),
    };
  }
}

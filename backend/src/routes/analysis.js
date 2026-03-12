import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { generateProjectRecommendations } from '../services/analysisService.js';
import { marketQueue } from '../queue/marketQueue.js';
import { upsertTrendsFromMarketData } from '../services/etlService.js';

const router = Router();

router.get('/dashboard', async (req, res, next) => {
  try {
    const [trendsCount, problemsCount, opportunitiesCount, projectsCount, topOpps] = await Promise.all([
      prisma.trend.count(),
      prisma.problem.count(),
      prisma.opportunity.count(),
      prisma.project.count(),
      prisma.opportunity.findMany({ orderBy: { finalScore: 'desc' }, take: 5 }),
    ]);

    const highPriority = await prisma.opportunity.count({ where: { priority: 'high' } });

    res.json({
      stats: { trendsCount, problemsCount, opportunitiesCount, projectsCount, highPriority },
      topOpportunities: topOpps,
    });
  } catch (err) { next(err); }
});

router.post('/market-insights', async (req, res, next) => {
  try {
    const country = typeof req.body.country === 'string' ? req.body.country.trim() : '';
    const region = typeof req.body.region === 'string' ? req.body.region.trim() : '';
    const city = typeof req.body.city === 'string' ? req.body.city.trim() : '';
    const sector = typeof req.body.sector === 'string' ? req.body.sector.trim() : '';

    const where = {};
    if (sector) where.sector = sector;
    if (country) where.country = country;
    if (region || city) where.city = region || city;

    let trends = [];
    let problems = [];
    let opportunities = [];

    try {
      trends = await prisma.trend.findMany({
        where,
        orderBy: { growthRate: 'desc' },
        take: 5,
      });
      problems = await prisma.problem.findMany({
        where: sector ? { sector } : {},
        orderBy: { impact: 'desc' },
        take: 5,
      });
      opportunities = await prisma.opportunity.findMany({
        where,
        orderBy: { finalScore: 'desc' },
        take: 5,
      });
    } catch (_e) {
      trends = [];
      problems = [];
      opportunities = [];
    }

    const ctxSector = sector || 'Geral';
    const ctxRegion = region || city || country || 'Mercado local';

    const heurTrends = [
      `Adoção digital em ${ctxSector} em aceleração em ${ctxRegion}`,
      `Procura por soluções de eficiência operacional em ${ctxSector}`,
      `Integração de pagamentos e dados no ecossistema de ${ctxSector}`,
    ];

    const heurProblems = [
      `Falta de acesso a ferramentas acessíveis em ${ctxSector}`,
      `Baixa visibilidade e dados para decisões em ${ctxRegion}`,
      `Processos manuais com baixa produtividade em ${ctxSector}`,
    ];

    const trendsOut = trends.length
      ? trends.map(t => ({ id: t.id, title: t.title, growthRate: t.growthRate, relevance: t.relevance }))
      : heurTrends.map((t, i) => ({ id: `t-${i}`, title: t, growthRate: 65 - i * 5, relevance: 70 - i * 5 }));

    const problemsOut = problems.length
      ? problems.map(p => ({ id: p.id, description: p.description, sector: p.sector, impact: p.impact, frequency: p.frequency }))
      : heurProblems.map((p, i) => ({ id: `p-${i}`, description: p, sector: ctxSector, impact: 7.5 - i * 0.5, frequency: 7.5 - i * 0.5 }));

    const gaps = [];
    if ((trendsOut[0]?.growthRate || 0) >= 70 && problemsOut.length && opportunities.length === 0) {
      gaps.push(`Alta procura em ${ctxSector} sem soluções consolidadas em ${ctxRegion}`);
    }
    if (problemsOut.length >= 2) {
      gaps.push(`Necessidade de soluções plug-and-play para ${ctxSector} em ${ctxRegion}`);
    }
    if (!gaps.length) {
      gaps.push(`Oportunidade de diferenciação por execução local em ${ctxRegion}`);
    }

    const avgCompetition = opportunities.length
      ? Math.round(opportunities.reduce((s, o) => s + (o.competitionLevel || 50), 0) / opportunities.length)
      : 50;
    const maturityScore = Math.min(100, (trendsOut.length ? 10 : 0) + (opportunities.length * 15));
    const compLevel = avgCompetition >= 60 ? 'alto' : avgCompetition >= 40 ? 'médio' : 'baixo';
    const maturity = maturityScore >= 60 ? 'médio' : 'baixo';

    let recs = { projects: [] };
    try {
      recs = await generateProjectRecommendations(opportunities, { country, city: region || city || '' });
    } catch (_e) {
      recs = { projects: [] };
    }

    if (!recs.projects || recs.projects.length === 0) {
      const seedOpps = Array.from({ length: 3 }).map((_, i) => ({
        title: `${ctxSector} Idea ${i + 1}`,
        sector: ctxSector,
        country: country || null,
        city: region || city || null,
        marketDemand: 70 - i * 5,
        competitionLevel: 45 + i * 5,
        technicalViability: 70,
        impactScore: 72 - i * 3,
        scalability: 68 - i * 2,
      }));
      try {
        recs = await generateProjectRecommendations(seedOpps, { country, city: region || city || '' });
      } catch (_e) {
        recs = { projects: [] };
      }
    }

    const pickProblem = i => (problemsOut[i % Math.max(problemsOut.length, 1)]?.description || `Lacuna em ${ctxSector}`);
    const viabilityFrom = p => {
      const t = p.estimated_time_weeks || p.estimatedTime || 12;
      if (t <= 10 && compLevel !== 'alto') return 'alto';
      if (t <= 16) return 'médio';
      return 'médio';
    };
    const growthFrom = () => {
      const topG = trendsOut[0]?.growthRate || 60;
      if (topG >= 75) return 'alto';
      if (topG >= 55) return 'médio';
      return 'médio';
    };

    const suggestions = (recs.projects || []).slice(0, 5).map((p, i) => ({
      name: p.name,
      problem: pickProblem(i),
      publicoAlvo: p.target_audience || 'Segmento local',
      modeloNegocio: p.revenue_model || 'SaaS',
      viabilidade: viabilityFrom(p),
      potencialCrescimento: growthFrom(),
    }));

    res.json({
      context: { country: country || null, region: region || city || null, sector: sector || null },
      trends: trendsOut,
      problems: problemsOut,
      gaps,
      competition: { level: compLevel, maturity, metrics: { avgCompetition, opportunities: opportunities.length } },
      suggestions,
    });
  } catch (err) {
    next(err);
  }
});

router.post('/etl', async (req, res, next) => {
  try {
    const country = typeof req.body.country === 'string' ? req.body.country.trim() : '';
    const city = typeof req.body.city === 'string' ? req.body.city.trim() : '';
    const limit = Number.parseInt(req.body.limit, 10) || 40;
    if (process.env.REDIS_URL) {
      try {
        await marketQueue.add('etlTrends', { country, city, limit });
        return res.json({ ok: true, message: 'ETL job is processing in background' });
      } catch (_queueErr) {
        // Fallback inline
      }
    }
    const result = await upsertTrendsFromMarketData({ country, city, limit });
    res.json({ ok: true, message: 'ETL executed inline', result });
  } catch (err) {
    next(err);
  }
});

export default router;

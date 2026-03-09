import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { analyzeOpportunityWithAI } from '../services/analysisService.js';
import { researchRealtimeOpportunities } from '../services/realtimeOpportunityResearch.js';
import { calculateOpportunityScore, getPriority } from '../services/scoringService.js';
import { buildLocationWhere, getLocationFilters, normalizeOptionalString } from '../utils/locationFilters.js';

const router = Router();

router.get('/research-live', async (req, res, next) => {
  try {
    const { sector, limit = 12 } = req.query;
    const baseWhere = {};
    if (sector) baseWhere.sector = sector;

    const { country, where: locationWhere } = buildLocationWhere(req.query);
    const where = { ...baseWhere, ...locationWhere };
    const filters = await getLocationFilters(prisma.opportunity, baseWhere, country);
    const research = await researchRealtimeOpportunities({
      sector: normalizeOptionalString(sector),
      country: normalizeOptionalString(req.query.country),
      city: normalizeOptionalString(req.query.city),
      limit,
    });

    if (research.opportunities.length === 0) {
      const fallback = await prisma.opportunity.findMany({
        where,
        orderBy: { finalScore: 'desc' },
        take: Number.parseInt(limit, 10) || 12,
        include: { problem: true },
      });

      res.json({
        data: fallback,
        total: fallback.length,
        filters,
        meta: {
          mode: 'database_fallback',
          signalsCount: 0,
          refreshedAt: new Date().toISOString(),
        },
      });
      return;
    }

    res.json({
      data: research.opportunities,
      total: research.opportunities.length,
      filters,
      meta: research.meta,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/', async (req, res, next) => {
  try {
    const { sector, priority, limit = 20 } = req.query;
    const baseWhere = {};
    if (sector) baseWhere.sector = sector;
    if (priority) baseWhere.priority = priority;

    const { country, where: locationWhere } = buildLocationWhere(req.query);
    const where = { ...baseWhere, ...locationWhere };

    const [opportunities, filters] = await Promise.all([
      prisma.opportunity.findMany({
        where,
        orderBy: { finalScore: 'desc' },
        take: Number.parseInt(limit, 10) || 20,
        include: { problem: true },
      }),
      getLocationFilters(prisma.opportunity, baseWhere, country),
    ]);

    res.json({ data: opportunities, total: opportunities.length, filters });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const opportunity = await prisma.opportunity.findUniqueOrThrow({
      where: { id: req.params.id },
      include: { problem: true, projects: true },
    });
    res.json(opportunity);
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const finalScore = calculateOpportunityScore(req.body);
    const priority = getPriority(finalScore);
    const opportunity = await prisma.opportunity.create({
      data: {
        ...req.body,
        country: normalizeOptionalString(req.body.country),
        city: normalizeOptionalString(req.body.city),
        finalScore,
        priority,
      },
    });
    res.status(201).json(opportunity);
  } catch (error) {
    next(error);
  }
});

router.post('/analyze-ai', requireAuth, async (req, res, next) => {
  try {
    const { description, sector } = req.body;
    if (!description) {
      const error = new Error('description is required');
      error.status = 400;
      throw error;
    }

    const analysis = await analyzeOpportunityWithAI({
      description,
      sector,
      country: normalizeOptionalString(req.body.country) || req.user.country,
      city: normalizeOptionalString(req.body.city) || req.user.city,
    });
    const finalScore = calculateOpportunityScore({
      marketDemand: analysis.market_demand,
      competitionLevel: analysis.competition_level,
      technicalViability: analysis.technical_viability,
      impactScore: analysis.impact_score,
      scalability: analysis.scalability,
    });

    res.json({ ...analysis, final_score: finalScore });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await prisma.opportunity.delete({ where: { id: req.params.id } });
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

export default router;

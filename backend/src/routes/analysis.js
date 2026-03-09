// src/routes/analysis.js
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// GET /api/analysis/dashboard — métricas resumidas
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

export default router;

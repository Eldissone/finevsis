import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { buildLocationWhere, getLocationFilters } from '../utils/locationFilters.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const { category, sector, status, limit = 50 } = req.query;
    const baseWhere = {};
    if (category) baseWhere.category = category;
    if (sector) baseWhere.sector = sector;
    if (status) baseWhere.status = status;

    const { country, where: locationWhere } = buildLocationWhere(req.query);
    const where = { ...baseWhere, ...locationWhere };

    const [trends, filters] = await Promise.all([
      prisma.trend.findMany({
        where,
        orderBy: { growthRate: 'desc' },
        take: Number.parseInt(limit, 10) || 50,
      }),
      getLocationFilters(prisma.trend, baseWhere, country),
    ]);

    res.json({ data: trends, total: trends.length, filters });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const trend = await prisma.trend.findUniqueOrThrow({ where: { id: req.params.id } });
    res.json(trend);
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const trend = await prisma.trend.create({ data: req.body });
    res.status(201).json(trend);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const trend = await prisma.trend.update({ where: { id: req.params.id }, data: req.body });
    res.json(trend);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await prisma.trend.delete({ where: { id: req.params.id } });
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

export default router;

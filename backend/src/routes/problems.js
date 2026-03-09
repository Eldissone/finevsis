// src/routes/problems.js
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { rankProblems } from '../services/scoringService.js';

const router = Router();
const prisma = new PrismaClient();

router.get('/', async (req, res, next) => {
  try {
    const problems = await prisma.problem.findMany({ orderBy: { impact: 'desc' } });
    res.json({ data: rankProblems(problems), total: problems.length });
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const problem = await prisma.problem.create({ data: req.body });
    res.status(201).json(problem);
  } catch (err) { next(err); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const problem = await prisma.problem.update({ where: { id: req.params.id }, data: req.body });
    res.json(problem);
  } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await prisma.problem.delete({ where: { id: req.params.id } });
    res.status(204).end();
  } catch (err) { next(err); }
});

export default router;

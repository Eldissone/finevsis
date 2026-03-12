import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { generateProjectRecommendations } from '../services/analysisService.js';
import { buildLocationWhere, getLocationFilters, normalizeOptionalString } from '../utils/locationFilters.js';

const router = Router();

router.use(requireAuth);

router.get('/', async (req, res, next) => {
  try {
    const { status } = req.query;
    const baseWhere = {};
    if (status) baseWhere.status = status;

    const { country, where: locationWhere } = buildLocationWhere(req.query);
    const where = { ...baseWhere, ...locationWhere };

    const [projects, filters] = await Promise.all([
      prisma.project.findMany({
        where,
        include: { opportunity: true },
        orderBy: { createdAt: 'desc' },
      }),
      getLocationFilters(prisma.project, baseWhere, country),
    ]);

    res.json({ data: projects, total: projects.length, filters });
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const project = await prisma.project.create({
      data: {
        ...req.body,
        createdById: req.user.id,
        country: normalizeOptionalString(req.body.country),
        city: normalizeOptionalString(req.body.city),
      },
    });
    res.status(201).json(project);
  } catch (error) {
    next(error);
  }
});

router.post('/generate', async (req, res, next) => {
  try {
    const targetCountry = typeof req.body.country === 'string' ? req.body.country : req.user.country;
    const targetCity = typeof req.body.city === 'string' ? req.body.city : req.user.city;

    const preferredWhere = {};
    if (targetCountry) preferredWhere.country = targetCountry;
    if (targetCity) preferredWhere.city = targetCity;

    let topOpportunities = await prisma.opportunity.findMany({
      where: preferredWhere,
      orderBy: { finalScore: 'desc' },
      take: 5,
    });

    if (topOpportunities.length === 0) {
      topOpportunities = await prisma.opportunity.findMany({
        orderBy: { finalScore: 'desc' },
        take: 5,
      });
    }

    if (topOpportunities.length === 0) {
      const dummy = await prisma.opportunity.create({
        data: {
          title: `Oportunidade Inicial (${targetCity || targetCountry || 'Mercado Aberto'})`,
          description: 'Ponto de ignição heurístico gerado para inicializar a esteira de projetos.',
          sector: 'Geral',
          country: targetCountry || null,
          city: targetCity || null,
          marketDemand: 70,
          competitionLevel: 40,
          technicalViability: 65,
          impactScore: 68,
          scalability: 60,
          finalScore: 65,
          priority: 'medium',
        },
      });
      topOpportunities = [dummy];
    }

    const suggestions = await generateProjectRecommendations(topOpportunities, {
      country: targetCountry,
      city: targetCity,
    });

    const createdProjects = await Promise.all(
      (suggestions.projects || []).map((project, index) => {
        const referenceOpportunity = topOpportunities[index % Math.max(topOpportunities.length, 1)];
        return prisma.project.create({
          data: {
            opportunityId: referenceOpportunity?.id || null,
            name: project.name,
            description: project.description || null,
            type: project.type || null,
            country: referenceOpportunity?.country || targetCountry || null,
            city: referenceOpportunity?.city || targetCity || null,
            techStack: project.tech_stack || project.techStack || [],
            targetAudience: project.target_audience || project.targetAudience || null,
            revenueModel: project.revenue_model || project.revenueModel || null,
            estimatedTime: project.estimated_time_weeks || project.estimatedTime || null,
            status: 'suggested',
            createdById: req.user.id,
          },
        });
      })
    );

    res.json({ data: createdProjects, total: createdProjects.length });
  } catch (error) {
    next(error);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const project = await prisma.project.update({
      where: { id: req.params.id },
      data: {
        ...req.body,
        country: Object.prototype.hasOwnProperty.call(req.body, 'country')
          ? normalizeOptionalString(req.body.country)
          : undefined,
        city: Object.prototype.hasOwnProperty.call(req.body, 'city')
          ? normalizeOptionalString(req.body.city)
          : undefined,
      },
    });
    res.json(project);
  } catch (error) {
    next(error);
  }
});

export default router;

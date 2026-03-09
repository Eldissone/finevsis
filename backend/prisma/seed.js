import { PrismaClient } from '@prisma/client';
import { calculateOpportunityScore, getPriority } from '../src/services/scoringService.js';

const prisma = new PrismaClient();

const trends = [
  { title: 'Agritech & Agricultura Digital', category: 'Tecnologia', sector: 'Agricultura', country: 'Angola', city: 'Huambo', growthRate: 87, relevance: 91, source: 'Google Trends', status: 'emerging' },
  { title: 'Microcredito Digital', category: 'Fintech', sector: 'Financas', country: 'Angola', city: 'Luanda', growthRate: 74, relevance: 84, source: 'Relatorios Bancarios', status: 'active' },
  { title: 'Servicos de Logistica Local', category: 'Logistica', sector: 'Transporte', country: 'Mozambique', city: 'Maputo', growthRate: 68, relevance: 76, source: 'Redes Sociais', status: 'active' },
  { title: 'Educacao Profissional Online', category: 'Edtech', sector: 'Educacao', country: 'Portugal', city: 'Lisboa', growthRate: 91, relevance: 93, source: 'Startups Emergentes', status: 'emerging' },
  { title: 'Saude Preventiva e Telemedicina', category: 'Healthtech', sector: 'Saude', country: 'Angola', city: 'Benguela', growthRate: 82, relevance: 88, source: 'Dados de Mercado', status: 'emerging' },
  { title: 'Marketplace de Servicos Tecnicos', category: 'Plataformas', sector: 'Servicos', country: 'Namibia', city: 'Windhoek', growthRate: 65, relevance: 72, source: 'Feedback Utilizadores', status: 'active' },
];

const problems = [
  { description: 'Agricultores sem acesso a previsoes climaticas precisas', sector: 'Agricultura', frequency: 9, impact: 8.5, tags: ['clima', 'agricultor', 'dados'] },
  { description: 'Pequenas empresas sem presenca digital eficaz', sector: 'Comercio', frequency: 8.5, impact: 7, tags: ['PME', 'digital', 'marketing'] },
  { description: 'Mototaxis sem sistema de gestao e pagamento digital', sector: 'Transporte', frequency: 7.5, impact: 8, tags: ['transporte', 'pagamento', 'app'] },
  { description: 'Desenvolvedores iniciantes sem projetos reais no portfolio', sector: 'Tecnologia', frequency: 9, impact: 6, tags: ['dev', 'portfolio', 'emprego'] },
  { description: 'Falta de plataformas de mentoria profissional acessiveis', sector: 'Educacao', frequency: 8, impact: 9, tags: ['mentoria', 'carreira', 'educacao'] },
];

const opportunities = [
  { title: 'Plataforma de Credito Agricola Digital', sector: 'Agricultura', country: 'Angola', city: 'Huambo', marketDemand: 92, competitionLevel: 25, technicalViability: 80, impactScore: 90, scalability: 85, tags: [] },
  { title: 'App de Gestao para Mototaxis', sector: 'Transporte', country: 'Angola', city: 'Luanda', marketDemand: 84, competitionLevel: 30, technicalViability: 82, impactScore: 85, scalability: 70, tags: [] },
  { title: 'Plataforma de Mentoria Profissional', sector: 'Educacao', country: 'Portugal', city: 'Lisboa', marketDemand: 88, competitionLevel: 35, technicalViability: 85, impactScore: 90, scalability: 92, tags: [] },
  { title: 'Marketplace de Servicos Tecnicos', sector: 'Servicos', country: 'Namibia', city: 'Windhoek', marketDemand: 79, competitionLevel: 45, technicalViability: 75, impactScore: 78, scalability: 80, tags: [] },
  { title: 'SaaS de Presenca Digital para PMEs', sector: 'Comercio', country: 'Mozambique', city: 'Maputo', marketDemand: 75, competitionLevel: 50, technicalViability: 88, impactScore: 80, scalability: 90, tags: [] },
  { title: 'Sistema de Previsao Agricola com IA', sector: 'Agricultura', country: 'Angola', city: 'Benguela', marketDemand: 90, competitionLevel: 20, technicalViability: 70, impactScore: 92, scalability: 88, tags: [] },
].map(opportunity => {
  const finalScore = calculateOpportunityScore(opportunity);
  return {
    ...opportunity,
    finalScore,
    priority: getPriority(finalScore),
  };
});

async function syncByField(model, field, records) {
  for (const record of records) {
    await model.updateMany({
      where: { [field]: record[field] },
      data: record,
    });
  }
}

async function main() {
  const [trendCount, problemCount, opportunityCount] = await Promise.all([
    prisma.trend.count(),
    prisma.problem.count(),
    prisma.opportunity.count(),
  ]);

  if (trendCount === 0) {
    await prisma.trend.createMany({ data: trends });
  }

  if (problemCount === 0) {
    await prisma.problem.createMany({ data: problems });
  }

  if (opportunityCount === 0) {
    await prisma.opportunity.createMany({ data: opportunities });
  }

  await syncByField(prisma.trend, 'title', trends);
  await syncByField(prisma.problem, 'description', problems);
  await syncByField(prisma.opportunity, 'title', opportunities);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async error => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });

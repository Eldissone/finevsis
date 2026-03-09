import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function hasAnthropicKey() {
  return Boolean(process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_API_KEY.includes('...'));
}

function buildLocationContext({ country, city }) {
  if (country && city) return `${city}, ${country}`;
  if (country) return country;
  if (city) return city;
  return 'mercado global';
}

function buildFallbackAnalysis({ description, sector = 'Geral', country, city }) {
  const location = buildLocationContext({ country, city });
  const compactDescription = description.trim();
  const shortTitle = compactDescription.split(/\s+/).slice(0, 6).join(' ');
  const marketDemand = Math.min(92, 58 + compactDescription.length % 28);
  const competitionLevel = Math.max(22, 48 - sector.length);
  const technicalViability = Math.min(90, 60 + sector.length * 2);
  const impactScore = Math.min(94, 64 + compactDescription.length % 24);
  const scalability = Math.min(88, 55 + compactDescription.length % 26);

  return {
    opportunity_title: shortTitle || `Solucao ${sector}`,
    summary: `Existe uma oportunidade clara no setor de ${sector} para responder ao problema descrito com foco em ${location}. A proposta deve validar demanda rapidamente, diferenciar-se pela execucao local e construir uma oferta replicavel.`,
    market_demand: marketDemand,
    competition_level: competitionLevel,
    technical_viability: technicalViability,
    impact_score: impactScore,
    scalability: scalability,
    differentials: [
      `Foco operacional em ${location}`,
      'Experiencia digital simples para adocao rapida',
      'Modelo de validacao enxuto com aprendizagem continua',
    ],
    next_steps: [
      'Validar o problema com entrevistas curtas e dados do mercado local',
      'Criar MVP com uma jornada principal e medir uso nas primeiras semanas',
      'Definir parcerias e canais de aquisicao com melhor distribuicao regional',
    ],
    tech_stack: ['React', 'Node.js', 'PostgreSQL'],
    revenue_model: 'Assinatura mensal com servicos premium e onboarding assistido',
    target_audience: `Equipas e operadores do setor de ${sector} em ${location}`,
  };
}

export async function analyzeOpportunityWithAI({ description, sector = 'Geral', country, city }) {
  if (!hasAnthropicKey()) {
    return buildFallbackAnalysis({ description, sector, country, city });
  }

  const location = buildLocationContext({ country, city });
  const prompt = `
Voce e o motor de inteligencia de mercado do FINEVSIS.
Analise o seguinte problema/ideia no setor de "${sector}" com foco em "${location}":

"${description}"

Responda APENAS em JSON valido, sem markdown, com esta estrutura:
{
  "opportunity_title": "titulo objetivo (max 10 palavras)",
  "summary": "resumo estrategico 2-3 frases",
  "market_demand": <numero 0-100>,
  "competition_level": <numero 0-100>,
  "technical_viability": <numero 0-100>,
  "impact_score": <numero 0-100>,
  "scalability": <numero 0-100>,
  "differentials": ["diferencial 1", "diferencial 2", "diferencial 3"],
  "next_steps": ["passo 1", "passo 2", "passo 3"],
  "tech_stack": ["tecnologia 1", "tecnologia 2"],
  "revenue_model": "como o projeto gera receita",
  "target_audience": "publico-alvo principal"
}
`;

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = response.content.map(block => block.text || '').join('');
    const clean = text.replace(/```json|```/g, '').trim();
    return JSON.parse(clean);
  } catch (_error) {
    return buildFallbackAnalysis({ description, sector, country, city });
  }
}

function buildFallbackProjects(opportunities = [], { country, city } = {}) {
  const location = buildLocationContext({ country, city });
  return {
    projects: opportunities.slice(0, 3).map((opportunity, index) => ({
      name: `${opportunity.sector || 'Mercado'} Pulse ${index + 1}`,
      type: index === 0 ? 'SaaS' : index === 1 ? 'Marketplace' : 'Platform',
      description: `Produto orientado por dados para acelerar execucao comercial em ${location} a partir da oportunidade "${opportunity.title}".`,
      target_audience: `Equipes e operadores de ${opportunity.sector || 'mercado'} em ${location}`,
      revenue_model: 'Assinatura recorrente com plano enterprise',
      estimated_time_weeks: 8 + index * 2,
      tech_stack: ['React', 'Node.js', 'PostgreSQL'],
    })),
  };
}

export async function generateProjectRecommendations(opportunities, { country, city } = {}) {
  if (!opportunities.length) {
    return { projects: [] };
  }

  if (!hasAnthropicKey()) {
    return buildFallbackProjects(opportunities, { country, city });
  }

  const topOpportunities = opportunities.slice(0, 5).map(entry => entry.title).join(', ');
  const location = buildLocationContext({ country, city });
  const prompt = `
Com base nestas oportunidades de mercado identificadas: ${topOpportunities}
Priorize ideias com aderencia a ${location}.

Sugira 3 projetos inovadores. Responda APENAS em JSON:
{
  "projects": [
    {
      "name": "nome do projeto",
      "type": "tipo (SaaS/App/Marketplace/etc)",
      "description": "descricao em 2 frases",
      "target_audience": "publico-alvo",
      "revenue_model": "modelo de receita",
      "estimated_time_weeks": <numero>,
      "tech_stack": ["tech1", "tech2", "tech3"]
    }
  ]
}
`;

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = response.content.map(block => block.text || '').join('');
    const clean = text.replace(/```json|```/g, '').trim();
    return JSON.parse(clean);
  } catch (_error) {
    return buildFallbackProjects(opportunities, { country, city });
  }
}

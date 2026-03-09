// src/services/scoringService.js
// Motor de pontuação de oportunidades — FINEVSIS

/**
 * Calcula o score final de uma oportunidade
 * Score = (demanda * 0.35) + (baixa_concorrencia * 0.20) +
 *         (viabilidade * 0.20) + (impacto * 0.15) + (escalabilidade * 0.10)
 */
export function calculateOpportunityScore({
  marketDemand       = 0,
  competitionLevel   = 0, // quanto menor, melhor
  technicalViability = 0,
  impactScore        = 0,
  scalability        = 0,
}) {
  const lowCompetition = 100 - competitionLevel;

  const score =
    (marketDemand       * 0.35) +
    (lowCompetition     * 0.20) +
    (technicalViability * 0.20) +
    (impactScore        * 0.15) +
    (scalability        * 0.10);

  return Math.round(score * 10) / 10;
}

/**
 * Determina a prioridade com base no score
 */
export function getPriority(score) {
  if (score >= 70) return 'high';
  if (score >= 45) return 'medium';
  return 'low';
}

/**
 * Classifica uma lista de oportunidades por score
 */
export function rankOpportunities(opportunities) {
  return opportunities
    .map(op => ({
      ...op,
      finalScore: calculateOpportunityScore(op),
      priority:   getPriority(calculateOpportunityScore(op)),
    }))
    .sort((a, b) => b.finalScore - a.finalScore);
}

/**
 * Classifica problemas por prioridade (frequência * impacto)
 */
export function rankProblems(problems) {
  return problems
    .map(p => ({
      ...p,
      urgencyScore: Math.round((p.frequency * 0.5 + p.impact * 0.5) * 10) / 10,
    }))
    .sort((a, b) => b.urgencyScore - a.urgencyScore);
}

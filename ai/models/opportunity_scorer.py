# ai/models/opportunity_scorer.py
# Algoritmo de scoring de oportunidades

def score_opportunity(data: dict) -> dict:
    """
    Score = (demanda * 0.35) + (baixa_concorrencia * 0.20) +
            (viabilidade * 0.20) + (impacto * 0.15) + (escalabilidade * 0.10)
    """
    market_demand        = float(data.get("market_demand", 0))
    competition_level    = float(data.get("competition_level", 0))
    technical_viability  = float(data.get("technical_viability", 0))
    impact_score         = float(data.get("impact_score", 0))
    scalability          = float(data.get("scalability", 0))

    low_competition = 100 - competition_level

    breakdown = {
        "market_demand_weighted":       round(market_demand       * 0.35, 2),
        "low_competition_weighted":     round(low_competition     * 0.20, 2),
        "technical_viability_weighted": round(technical_viability * 0.20, 2),
        "impact_weighted":              round(impact_score        * 0.15, 2),
        "scalability_weighted":         round(scalability         * 0.10, 2),
    }

    score = sum(breakdown.values())
    score = round(score, 2)

    if score >= 70:
        priority = "high"
    elif score >= 45:
        priority = "medium"
    else:
        priority = "low"

    return {"score": score, "priority": priority, "breakdown": breakdown}

# ai/models/trend_prediction.py
# Previsão de tendências (modelo simplificado)

def predict_trend(data: dict) -> dict:
    """
    Previsão de tendência usando regras heurísticas.
    Pode ser substituído por modelo Scikit-learn ou TensorFlow treinado.
    """
    growth_rate = float(data.get("growth_rate", 0))
    relevance   = float(data.get("relevance", 0))
    sector      = data.get("sector", "Geral")

    # Previsão para os próximos 3 e 6 meses
    growth_3m = round(growth_rate * 1.05, 1)
    growth_6m = round(growth_rate * 1.12, 1)

    if growth_rate >= 80:
        outlook = "Muito Positivo"
        recommendation = "Investir agora — janela de oportunidade aberta"
    elif growth_rate >= 60:
        outlook = "Positivo"
        recommendation = "Monitorar e planejar entrada no mercado"
    elif growth_rate >= 40:
        outlook = "Neutro"
        recommendation = "Aguardar consolidação antes de investir"
    else:
        outlook = "Cauteloso"
        recommendation = "Alta concorrência ou mercado saturado"

    return {
        "sector": sector,
        "current_growth": growth_rate,
        "predicted_3m": growth_3m,
        "predicted_6m": growth_6m,
        "outlook": outlook,
        "recommendation": recommendation,
        "confidence": round(min(relevance / 100 * 0.9, 0.95), 2),
    }

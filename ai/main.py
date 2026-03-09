"""
FINEVSIS — Serviço de Inteligência Artificial
FastAPI + Scikit-learn + Pandas
"""
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

from models.clustering import cluster_problems
from models.opportunity_scorer import score_opportunity
from models.trend_prediction import predict_trend

load_dotenv()

app = FastAPI(title="FINEVSIS AI Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Schemas ──────────────────────────────────────────

class OpportunityInput(BaseModel):
    market_demand: float
    competition_level: float
    technical_viability: float
    impact_score: float
    scalability: float
    sector: str = "Geral"

class TrendInput(BaseModel):
    growth_rate: float
    relevance: float
    sector: str

class ProblemInput(BaseModel):
    description: str
    frequency: float
    impact: float
    sector: str


# ── Endpoints ────────────────────────────────────────

@app.get("/health")
def health():
    return {"status": "ok", "service": "finevsis-ai"}


@app.post("/score")
def score(op: OpportunityInput):
    """Pontua uma oportunidade usando o modelo treinado."""
    result = score_opportunity(op.dict())
    return {"final_score": result["score"], "priority": result["priority"], "breakdown": result["breakdown"]}


@app.post("/predict-trend")
def predict(t: TrendInput):
    """Prevê a evolução de uma tendência."""
    prediction = predict_trend(t.dict())
    return prediction


@app.post("/cluster-problems")
def cluster(problems: list[ProblemInput]):
    """Agrupa problemas similares usando K-Means."""
    data = [p.dict() for p in problems]
    clusters = cluster_problems(data)
    return {"clusters": clusters}


@app.get("/insights")
def insights():
    """Retorna insights gerais do mercado angolano."""
    return {
        "top_sectors": ["Agritech", "Fintech", "Edtech", "Healthtech"],
        "emerging_opportunities": [
            "Microcrédito Digital",
            "Plataforma Agrícola com IA",
            "Telemedicina Rural",
        ],
        "risk_areas": ["Alta concorrência em e-commerce", "Baixa penetração internet rural"],
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

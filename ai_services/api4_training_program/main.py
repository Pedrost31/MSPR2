import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))

from contextlib import asynccontextmanager
from fastapi import FastAPI
from routes.training import router as training_router
from routes.metrics import router as metrics_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield


app = FastAPI(
    title="API 4 – Programmes d'Entraînement",
    description=(
        "Programmes d'entraînement personnalisés basés sur l'objectif sportif. "
        "Génération IA par Ollama Llama3.2 + exercices Wger (tous gratuits / open source)."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

app.include_router(training_router, prefix="/api/v4/training", tags=["Training Program"])
app.include_router(metrics_router, prefix="/api/v4", tags=["Metrics"])


@app.get("/health")
async def health():
    return {"status": "ok", "service": "training-program", "port": 8004}

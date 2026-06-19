import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))

from contextlib import asynccontextmanager
from fastapi import FastAPI
from routes.diet import router as diet_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield


app = FastAPI(
    title="API 3 – Plan Diététique",
    description=(
        "Plans alimentaires personnalisés adaptés aux objectifs sportifs. "
        "Calcul TDEE/macros + génération IA par Ollama Llama3.2 (gratuit / open source)."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

app.include_router(diet_router, prefix="/api/v3/diet", tags=["Diet Plan"])


@app.get("/health")
async def health():
    return {"status": "ok", "service": "diet-plan", "port": 8003}

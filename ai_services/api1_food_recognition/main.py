import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))

from contextlib import asynccontextmanager
from fastapi import FastAPI
from routes.food_recognition import router as food_router
from routes.metrics import router as metrics_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield


app = FastAPI(
    title="API 1 – Reconnaissance Alimentaire",
    description=(
        "Analyse d'images et reconnaissance d'aliments avec Ollama LLaVA, "
        "Open Food Facts et USDA FoodData Central (toutes API gratuites / open source)."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

app.include_router(food_router, prefix="/api/v1/food", tags=["Food Recognition"])
app.include_router(metrics_router, prefix="/api/v1", tags=["Metrics"])


@app.get("/health")
async def health():
    return {"status": "ok", "service": "food-recognition", "port": 8001}

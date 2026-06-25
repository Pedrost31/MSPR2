import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))

from contextlib import asynccontextmanager
from fastapi import FastAPI
from routes.recipes import router as recipes_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield


app = FastAPI(
    title="API 2 – Suggestions de Recettes",
    description=(
        "Suggestions de recettes personnalisées basées sur le profil utilisateur, "
        "générées par Ollama Llama3.2 et enrichies par TheMealDB (gratuit)."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

app.include_router(recipes_router, prefix="/api/v2/recipes", tags=["Recipe Suggestions"])


@app.get("/health")
async def health():
    return {"status": "ok", "service": "recipe-suggestions", "port": 8002}

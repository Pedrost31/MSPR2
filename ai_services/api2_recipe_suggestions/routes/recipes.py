import uuid
import time
import json
from typing import Literal
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from services import ollama_service, themealdb_service
from shared.mongodb import get_db, save_ai_log, save_recommendation
from shared.postgres import get_user_profile, get_user_food_entries
from config import settings

router = APIRouter()

MealType = Literal["breakfast", "lunch", "dinner", "snack"]

MEAL_TYPE_LABELS = {
    "breakfast": "petit-déjeuner",
    "lunch": "déjeuner",
    "dinner": "dîner",
    "snack": "collation / snack",
}


class GenerateFromIngredientsRequest(BaseModel):
    user_id: str
    ingredients: list[str]
    goal: str = "maintenir le poids"


@router.get(
    "/suggest/{user_id}",
    summary="Suggestions de recettes pour un repas donné selon l'objectif utilisateur",
)
async def suggest_recipes(
    user_id: str,
    meal_type: MealType = Query(
        ...,
        description="Type de repas souhaité : breakfast | lunch | dinner | snack",
    ),
):
    request_id = str(uuid.uuid4())
    t0 = time.time()
    db = get_db()

    user = await get_user_profile(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")

    food_entries = await get_user_food_entries(user_id, days=7)
    meal_label = MEAL_TYPE_LABELS[meal_type]

    try:
        result = await ollama_service.generate_recipe_suggestions(user, food_entries, meal_type, meal_label)
        latency_ms = int((time.time() - t0) * 1000)

        await save_ai_log(
            db, user_id, request_id, "recipe-suggestions",
            "success", {"goal": user.get("goal"), "meal_type": meal_type, "entries_count": len(food_entries)},
            output=str(result), latency_ms=latency_ms,
        )
        await save_recommendation(
            db, user_id, "nutrition",
            f"Suggestions de recettes ({meal_label})",
            json.dumps(result, ensure_ascii=False),
            settings.ollama_text_model,
        )
        return {
            "request_id": request_id,
            "user_id": user_id,
            "meal_type": meal_type,
            "meal_label": meal_label,
            "recipes": result,
            "latency_ms": latency_ms,
        }
    except Exception as exc:
        await save_ai_log(
            db, user_id, request_id, "recipe-suggestions",
            "error", {"goal": user.get("goal"), "meal_type": meal_type},
            error=str(exc), latency_ms=int((time.time() - t0) * 1000),
        )
        raise HTTPException(status_code=503, detail=f"Erreur de génération : {exc}")


@router.post("/generate", summary="Générer une recette à partir d'ingrédients disponibles")
async def generate_from_ingredients(request: GenerateFromIngredientsRequest):
    if not request.ingredients:
        raise HTTPException(status_code=422, detail="La liste d'ingrédients ne peut pas être vide")
    if len(request.ingredients) > 20:
        raise HTTPException(status_code=422, detail="Maximum 20 ingrédients")

    request_id = str(uuid.uuid4())
    t0 = time.time()
    db = get_db()

    try:
        result = await ollama_service.generate_recipe_from_ingredients(
            request.ingredients, request.goal
        )
        latency_ms = int((time.time() - t0) * 1000)
        await save_ai_log(
            db, request.user_id, request_id, "recipe-from-ingredients",
            "success", {"ingredients": request.ingredients, "goal": request.goal},
            output=str(result), latency_ms=latency_ms,
        )
        return {"request_id": request_id, "recipe": result, "latency_ms": latency_ms}
    except Exception as exc:
        await save_ai_log(
            db, request.user_id, request_id, "recipe-from-ingredients",
            "error", {"ingredients": request.ingredients},
            error=str(exc), latency_ms=int((time.time() - t0) * 1000),
        )
        raise HTTPException(status_code=503, detail=f"Erreur de génération : {exc}")


@router.get("/search", summary="Rechercher des recettes par nom (TheMealDB)")
async def search_recipes(query: str):
    if not query or len(query) < 2:
        raise HTTPException(status_code=422, detail="La requête doit contenir au moins 2 caractères")
    results = await themealdb_service.search_by_name(query)
    return {"query": query, "results": results, "source": "TheMealDB"}


@router.get("/by-ingredient", summary="Filtrer les recettes par ingrédient (TheMealDB)")
async def recipes_by_ingredient(ingredient: str):
    if not ingredient:
        raise HTTPException(status_code=422, detail="L'ingrédient est requis")
    results = await themealdb_service.search_by_ingredient(ingredient)
    return {"ingredient": ingredient, "results": results, "source": "TheMealDB"}


@router.get("/random", summary="Recette aléatoire (TheMealDB)")
async def random_recipe():
    meal = await themealdb_service.get_random_meal()
    if not meal:
        raise HTTPException(status_code=503, detail="Impossible de récupérer une recette")
    return meal

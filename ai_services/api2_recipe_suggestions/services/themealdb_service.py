"""
TheMealDB – API de recettes gratuite (pas de clé requise pour le niveau 1).
Docs : https://www.themealdb.com/api.php
"""
import httpx
from typing import Optional

_BASE = "https://www.themealdb.com/api/json/v1/1"


async def search_by_name(name: str) -> list[dict]:
    """Recherche des repas par nom."""
    async with httpx.AsyncClient(timeout=10.0) as client:
        r = await client.get(f"{_BASE}/search.php", params={"s": name})
        r.raise_for_status()
        meals = r.json().get("meals") or []
        return [_fmt(m) for m in meals]


async def search_by_ingredient(ingredient: str) -> list[dict]:
    """Filtre les recettes par ingrédient principal."""
    async with httpx.AsyncClient(timeout=10.0) as client:
        r = await client.get(f"{_BASE}/filter.php", params={"i": ingredient})
        r.raise_for_status()
        meals = r.json().get("meals") or []
        return [
            {"id": m["idMeal"], "name": m["strMeal"], "thumbnail": m["strMealThumb"]}
            for m in meals
        ]


async def get_by_id(meal_id: str) -> Optional[dict]:
    """Récupère les détails d'une recette par son ID."""
    async with httpx.AsyncClient(timeout=10.0) as client:
        r = await client.get(f"{_BASE}/lookup.php", params={"i": meal_id})
        r.raise_for_status()
        meals = r.json().get("meals") or []
        return _fmt(meals[0]) if meals else None


async def get_random_meal() -> Optional[dict]:
    """Récupère une recette aléatoire."""
    async with httpx.AsyncClient(timeout=10.0) as client:
        r = await client.get(f"{_BASE}/random.php")
        r.raise_for_status()
        meals = r.json().get("meals") or []
        return _fmt(meals[0]) if meals else None


def _fmt(meal: dict) -> dict:
    ingredients = []
    for i in range(1, 21):
        ing = meal.get(f"strIngredient{i}", "").strip()
        measure = meal.get(f"strMeasure{i}", "").strip()
        if ing:
            ingredients.append(f"{measure} {ing}".strip())

    return {
        "source": "TheMealDB",
        "id": meal.get("idMeal"),
        "name": meal.get("strMeal"),
        "category": meal.get("strCategory"),
        "area": meal.get("strArea"),
        "instructions": meal.get("strInstructions", "").split("\r\n") if meal.get("strInstructions") else [],
        "thumbnail": meal.get("strMealThumb"),
        "tags": [t.strip() for t in (meal.get("strTags") or "").split(",") if t.strip()],
        "youtube_url": meal.get("strYoutube"),
        "ingredients": ingredients,
    }

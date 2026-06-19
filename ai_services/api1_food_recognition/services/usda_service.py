"""
USDA FoodData Central – API gratuite (clé DEMO_KEY = 100 req/h, clé gratuite = illimité).
Inscription : https://fdc.nal.usda.gov/api-guide.html
"""
import httpx
from config import settings

_BASE = "https://api.nal.usda.gov/fdc/v1"


async def search_food_usda(query: str, page_size: int = 5) -> list[dict]:
    """Recherche dans USDA FoodData Central."""
    async with httpx.AsyncClient(timeout=10.0) as client:
        r = await client.get(
            f"{_BASE}/foods/search",
            params={
                "query": query,
                "pageSize": page_size,
                "api_key": settings.usda_api_key,
                "dataType": "Foundation,SR Legacy",
            },
        )
        r.raise_for_status()
        return [_fmt(f) for f in r.json().get("foods", [])]


async def get_food_by_fdc_id(fdc_id: int) -> dict | None:
    """Récupère les détails d'un aliment par son ID FDC."""
    async with httpx.AsyncClient(timeout=10.0) as client:
        r = await client.get(
            f"{_BASE}/food/{fdc_id}",
            params={"api_key": settings.usda_api_key},
        )
        if r.status_code == 200:
            return _fmt(r.json())
    return None


def _fmt(food: dict) -> dict:
    nutrients = {n["nutrientName"]: n["value"] for n in food.get("foodNutrients", [])}
    category = food.get("foodCategory")
    return {
        "source": "USDA FoodData Central",
        "fdc_id": food.get("fdcId"),
        "name": food.get("description", "").title(),
        "food_category": category.get("description") if isinstance(category, dict) else category,
        "nutrition_per_100g": {
            "calories": nutrients.get("Energy"),
            "protein_g": nutrients.get("Protein"),
            "carbs_g": nutrients.get("Carbohydrate, by difference"),
            "fat_g": nutrients.get("Total lipid (fat)"),
            "fiber_g": nutrients.get("Fiber, total dietary"),
        },
    }

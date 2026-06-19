"""
Open Food Facts – API gratuite et open source, aucune clé requise.
Docs : https://wiki.openfoodfacts.org/API
"""
import httpx
from typing import Optional

_BASE = "https://world.openfoodfacts.org"


async def get_product_by_barcode(barcode: str) -> Optional[dict]:
    """Récupère un produit par son code-barres."""
    async with httpx.AsyncClient(timeout=10.0) as client:
        r = await client.get(
            f"{_BASE}/api/v2/product/{barcode}",
            params={"fields": "product_name,nutriments,serving_size,image_url,categories"},
        )
        if r.status_code == 200:
            data = r.json()
            if data.get("status") == 1:
                return _fmt(data["product"])
    return None


async def search_food(query: str, page_size: int = 10) -> list[dict]:
    """Recherche des aliments par nom."""
    async with httpx.AsyncClient(timeout=10.0) as client:
        r = await client.get(
            f"{_BASE}/cgi/search.pl",
            params={
                "search_terms": query,
                "json": "1",
                "page_size": page_size,
                "fields": "product_name,nutriments,serving_size,image_url",
            },
        )
        r.raise_for_status()
        return [_fmt(p) for p in r.json().get("products", []) if p.get("product_name")]


def _fmt(product: dict) -> dict:
    n = product.get("nutriments", {})
    return {
        "source": "Open Food Facts",
        "name": product.get("product_name", "Inconnu"),
        "serving_size": product.get("serving_size"),
        "image_url": product.get("image_url"),
        "nutrition_per_100g": {
            "calories": n.get("energy-kcal_100g"),
            "protein_g": n.get("proteins_100g"),
            "carbs_g": n.get("carbohydrates_100g"),
            "fat_g": n.get("fat_100g"),
            "fiber_g": n.get("fiber_100g"),
        },
    }

"""
Wger – API open source de gestion d'entraînement (gratuite, sans clé).
Instance publique : https://wger.de/api/v2/
Code source : https://github.com/wger-project/wger
"""
import httpx
from typing import Optional

_BASE = "https://wger.de/api/v2"

_CATEGORY_MAP = {
    "chest": 11,
    "back": 12,
    "shoulders": 13,
    "arms": 10,
    "legs": 9,
    "abs": 10,
    "cardio": 15,
}

_EQUIPMENT_MAP = {
    "barbell": 1,
    "dumbbell": 3,
    "bodyweight": 7,
    "machine": 4,
    "kettlebell": 10,
}


async def get_exercises(
    muscle_category: Optional[str] = None,
    equipment: Optional[str] = None,
    language: int = 2,
    limit: int = 10,
) -> list[dict]:
    """Récupère des exercices depuis Wger (langue 2 = anglais, 6 = français)."""
    params: dict = {"format": "json", "language": language, "limit": limit}
    if muscle_category and muscle_category.lower() in _CATEGORY_MAP:
        params["category"] = _CATEGORY_MAP[muscle_category.lower()]
    if equipment and equipment.lower() in _EQUIPMENT_MAP:
        params["equipment"] = _EQUIPMENT_MAP[equipment.lower()]

    async with httpx.AsyncClient(timeout=10.0) as client:
        r = await client.get(f"{_BASE}/exercise/", params=params)
        r.raise_for_status()
        exercises = r.json().get("results", [])
        return [_fmt_exercise(e) for e in exercises]


async def get_exercise_by_id(exercise_id: int) -> Optional[dict]:
    """Récupère un exercice par son ID."""
    async with httpx.AsyncClient(timeout=10.0) as client:
        r = await client.get(f"{_BASE}/exercise/{exercise_id}/", params={"format": "json"})
        if r.status_code == 200:
            return _fmt_exercise(r.json())
    return None


def _fmt_exercise(ex: dict) -> dict:
    translations = ex.get("translations", [])
    en_trans = next((t for t in translations if t.get("language") == 2), None)
    name = en_trans.get("name", "") if en_trans else ex.get("name", f"Exercise {ex.get('id')}")
    description = en_trans.get("description", "") if en_trans else ""

    return {
        "source": "Wger",
        "id": ex.get("id"),
        "name": name,
        "description": description,
        "category": ex.get("category", {}).get("name") if isinstance(ex.get("category"), dict) else None,
        "muscles": [m.get("name_en") for m in ex.get("muscles", [])],
        "muscles_secondary": [m.get("name_en") for m in ex.get("muscles_secondary", [])],
        "equipment": [e.get("name") for e in ex.get("equipment", [])],
    }

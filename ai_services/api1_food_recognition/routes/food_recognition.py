import uuid
import time
import base64
import json
import re
from fastapi import APIRouter, HTTPException, UploadFile, File
from pydantic import BaseModel, field_validator

from services import ollama_service, openfoodfacts_service, usda_service
from shared.mongodb import get_db, save_ai_log, save_recommendation
from config import settings

router = APIRouter()

_NUTRITION_KEYS = ("calories", "protein_g", "carbs_g", "fat_g", "fiber_g")


def _to_float(value):
    """Convertit une valeur (nombre, '350', '12,5 g', None…) en float ou None."""
    if value is None:
        return None
    if isinstance(value, bool):
        return None
    if isinstance(value, (int, float)):
        return float(value)
    match = re.search(r"-?\d+(?:[.,]\d+)?", str(value))
    if not match:
        return None
    try:
        return float(match.group().replace(",", "."))
    except ValueError:
        return None


def _normalize_nutrition(nutrition: dict | None) -> dict:
    """Force toutes les valeurs nutritionnelles en nombres (ou None)."""
    nutrition = nutrition or {}
    return {key: _to_float(nutrition.get(key)) for key in _NUTRITION_KEYS}


async def _enrich_nutrition(result: dict) -> dict:
    """LLaVA reconnaît bien l'aliment mais estime mal (voire pas) les calories.
    Quand la nutrition est absente ou nulle, on la complète via Open Food Facts
    puis USDA à partir du nom détecté (valeurs pour 100 g)."""
    nutrition = _normalize_nutrition(result.get("nutrition"))
    calories = nutrition.get("calories")

    if calories and calories > 0:
        result["nutrition"] = nutrition
        return result

    food_name = (result.get("food_name") or "").strip()
    if food_name:
        for lookup in (openfoodfacts_service.search_food, usda_service.search_food_usda):
            try:
                hits = await lookup(food_name, page_size=5)
            except Exception:
                hits = []
            for hit in hits:
                per_100g = _normalize_nutrition(hit.get("nutrition_per_100g"))
                if per_100g.get("calories"):
                    result["nutrition"] = per_100g
                    result["nutrition_basis"] = f"pour 100 g (source : {hit.get('source')})"
                    return result

    # Aucune source : on renvoie au moins des nombres propres (évite les NaN côté front).
    result["nutrition"] = nutrition
    return result


class AnalyzeImageRequest(BaseModel):
    image_base64: str
    user_id: str

    @field_validator("image_base64")
    @classmethod
    def validate_base64(cls, v: str) -> str:
        if not v:
            raise ValueError("image_base64 ne peut pas être vide")
        try:
            base64.b64decode(v, validate=True)
        except Exception:
            raise ValueError("image_base64 doit être un base64 valide")
        return v


@router.post("/analyze-image", summary="Analyser une image alimentaire avec Ollama LLaVA")
async def analyze_image(request: AnalyzeImageRequest):
    request_id = str(uuid.uuid4())
    t0 = time.time()
    db = get_db()

    try:
        result = await ollama_service.analyze_food_image(request.image_base64)
        result = await _enrich_nutrition(result)
        latency_ms = int((time.time() - t0) * 1000)

        await save_ai_log(
            db, request.user_id, request_id, "food-recognition",
            "success", {"type": "image_analysis"},
            output=str(result), latency_ms=latency_ms,
        )
        await save_recommendation(
            db, request.user_id, "nutrition",
            "Image food analysis",
            json.dumps(result, ensure_ascii=False),
            settings.ollama_vision_model,
        )
        return {"request_id": request_id, "analysis": result, "latency_ms": latency_ms}
    except Exception as exc:
        await save_ai_log(
            db, request.user_id, request_id, "food-recognition",
            "error", {"type": "image_analysis"},
            error=str(exc), latency_ms=int((time.time() - t0) * 1000),
        )
        raise HTTPException(status_code=503, detail=f"Erreur d'analyse : {exc}")


@router.post("/upload-image", summary="Uploader et analyser une image (multipart)")
async def upload_and_analyze(user_id: str, file: UploadFile = File(...)):
    content = await file.read()
    image_b64 = base64.b64encode(content).decode("utf-8")
    return await analyze_image(AnalyzeImageRequest(image_base64=image_b64, user_id=user_id))


@router.get("/search", summary="Rechercher un aliment (Open Food Facts + USDA)")
async def search_food(query: str, sources: str = "all"):
    if not query or len(query) < 2:
        raise HTTPException(status_code=422, detail="La requête doit contenir au moins 2 caractères")

    results: list[dict] = []
    used_sources: list[str] = []

    if sources in ("all", "openfoodfacts"):
        off = await openfoodfacts_service.search_food(query, page_size=5)
        results.extend(off)
        used_sources.append("Open Food Facts")

    if sources in ("all", "usda"):
        usda = await usda_service.search_food_usda(query, page_size=5)
        results.extend(usda)
        used_sources.append("USDA FoodData Central")

    return {"query": query, "results": results, "sources": used_sources}


@router.get("/barcode/{barcode}", summary="Rechercher un produit par code-barres (Open Food Facts)")
async def get_by_barcode(barcode: str):
    if not barcode.isdigit():
        raise HTTPException(status_code=422, detail="Le code-barres doit être numérique")
    product = await openfoodfacts_service.get_product_by_barcode(barcode)
    if not product:
        raise HTTPException(status_code=404, detail="Produit introuvable")
    return product

import uuid
import time
import base64
from fastapi import APIRouter, HTTPException, UploadFile, File
from pydantic import BaseModel, field_validator

from services import ollama_service, openfoodfacts_service, usda_service
from shared.mongodb import get_db, save_ai_log, save_recommendation
from config import settings

router = APIRouter()


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
        latency_ms = int((time.time() - t0) * 1000)

        await save_ai_log(
            db, request.user_id, request_id, "food-recognition",
            "success", {"type": "image_analysis"},
            output=str(result), latency_ms=latency_ms,
        )
        await save_recommendation(
            db, request.user_id, "nutrition",
            "Image food analysis", str(result),
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

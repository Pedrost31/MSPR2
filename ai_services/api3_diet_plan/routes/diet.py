import uuid
import time
import json
from fastapi import APIRouter, HTTPException

from services import ollama_service
from services.tdee_calculator import get_full_macros
from shared.mongodb import get_db, save_ai_log, save_recommendation
from shared.postgres import get_user_profile, get_user_food_entries
from config import settings

router = APIRouter()


@router.get("/macros/{user_id}", summary="Calcul TDEE et macros recommandés (sans IA, calcul direct)")
async def get_macros(user_id: str):
    user = await get_user_profile(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")

    macros = get_full_macros(user)
    if not macros:
        raise HTTPException(
            status_code=422,
            detail="Profil incomplet : âge, poids et taille sont requis pour calculer les macros",
        )
    return {"user_id": user_id, "macros": macros}


@router.get("/plan/{user_id}", summary="Plan alimentaire hebdomadaire IA (Ollama Llama3.2)")
async def get_diet_plan(user_id: str):
    request_id = str(uuid.uuid4())
    t0 = time.time()
    db = get_db()

    user = await get_user_profile(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")

    macros = get_full_macros(user)
    if not macros:
        raise HTTPException(
            status_code=422,
            detail="Profil incomplet : âge, poids et taille sont requis",
        )

    food_entries = await get_user_food_entries(user_id, days=7)

    try:
        plan = await ollama_service.generate_diet_plan(user, macros, food_entries)
        latency_ms = int((time.time() - t0) * 1000)

        await save_ai_log(
            db, user_id, request_id, "diet-plan",
            "success", {"goal": user.get("goal"), "target_calories": macros["calories"]},
            output=str(plan), latency_ms=latency_ms,
        )
        await save_recommendation(
            db, user_id, "nutrition", f"Diet plan for goal={user.get('goal')}",
            json.dumps(plan, ensure_ascii=False),
            settings.ollama_text_model,
        )
        return {
            "request_id": request_id,
            "user_id": user_id,
            "macros": macros,
            "plan": plan,
            "latency_ms": latency_ms,
        }
    except Exception as exc:
        await save_ai_log(
            db, user_id, request_id, "diet-plan",
            "error", {"goal": user.get("goal")},
            error=str(exc), latency_ms=int((time.time() - t0) * 1000),
        )
        raise HTTPException(status_code=503, detail=f"Erreur de génération : {exc}")


@router.get("/analyze/{user_id}", summary="Analyse nutritionnelle de la semaine écoulée (IA)")
async def analyze_week(user_id: str, days: int = 7):
    if days < 1 or days > 30:
        raise HTTPException(status_code=422, detail="La période doit être entre 1 et 30 jours")

    user = await get_user_profile(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")

    macros = get_full_macros(user)
    if not macros:
        raise HTTPException(status_code=422, detail="Profil incomplet pour le calcul des macros")

    food_entries = await get_user_food_entries(user_id, days=days)
    request_id = str(uuid.uuid4())
    t0 = time.time()
    db = get_db()

    try:
        analysis = await ollama_service.analyze_nutritional_balance(food_entries, macros)
        latency_ms = int((time.time() - t0) * 1000)
        await save_ai_log(
            db, user_id, request_id, "diet-analysis",
            "success", {"days": days, "entries_count": len(food_entries)},
            output=str(analysis), latency_ms=latency_ms,
        )
        return {"request_id": request_id, "user_id": user_id, "analysis": analysis}
    except Exception as exc:
        await save_ai_log(
            db, user_id, request_id, "diet-analysis",
            "error", {"days": days},
            error=str(exc), latency_ms=int((time.time() - t0) * 1000),
        )
        raise HTTPException(status_code=503, detail=f"Erreur d'analyse : {exc}")

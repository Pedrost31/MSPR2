import uuid
import time
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

from services import ollama_service, wger_service
from shared.mongodb import get_db, save_ai_log, save_recommendation
from shared.postgres import get_user_profile, get_user_activity_entries
from config import settings

router = APIRouter()


class QuickWorkoutRequest(BaseModel):
    workout_type: str = "cardio"
    duration_min: int = 30
    equipment: list[str] = []

    class Config:
        json_schema_extra = {
            "example": {
                "workout_type": "strength",
                "duration_min": 45,
                "equipment": ["dumbbell", "barbell"],
            }
        }


@router.get("/program/{user_id}", summary="Programme d'entraînement hebdomadaire IA (Ollama + profil PostgreSQL)")
async def get_training_program(user_id: str):
    request_id = str(uuid.uuid4())
    t0 = time.time()
    db = get_db()

    user = await get_user_profile(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")

    activity_entries = await get_user_activity_entries(user_id, days=14)

    try:
        program = await ollama_service.generate_training_program(user, activity_entries)
        latency_ms = int((time.time() - t0) * 1000)

        await save_ai_log(
            db, user_id, request_id, "training-program",
            "success",
            {"goal": user.get("goal"), "activity_level": user.get("activityLevel")},
            output=str(program), latency_ms=latency_ms,
        )
        await save_recommendation(
            db, user_id, "activity",
            f"Training program for goal={user.get('goal')}", str(program),
            settings.ollama_text_model,
        )
        return {
            "request_id": request_id,
            "user_id": user_id,
            "program": program,
            "latency_ms": latency_ms,
        }
    except Exception as exc:
        await save_ai_log(
            db, user_id, request_id, "training-program",
            "error", {"goal": user.get("goal")},
            error=str(exc), latency_ms=int((time.time() - t0) * 1000),
        )
        raise HTTPException(status_code=503, detail=f"Erreur de génération : {exc}")


@router.post("/quick-workout", summary="Générer un entraînement rapide sans profil utilisateur")
async def quick_workout(request: QuickWorkoutRequest):
    valid_types = {"cardio", "strength", "hiit", "flexibility", "yoga"}
    if request.workout_type not in valid_types:
        raise HTTPException(
            status_code=422,
            detail=f"Type invalide. Valeurs acceptées : {', '.join(valid_types)}",
        )
    if not (10 <= request.duration_min <= 180):
        raise HTTPException(status_code=422, detail="La durée doit être entre 10 et 180 minutes")

    try:
        workout = await ollama_service.generate_quick_workout(
            request.workout_type, request.duration_min, request.equipment
        )
        return {"workout": workout}
    except Exception as exc:
        raise HTTPException(status_code=503, detail=f"Erreur de génération : {exc}")


@router.get("/exercises", summary="Rechercher des exercices (Wger – open source)")
async def get_exercises(
    muscle: Optional[str] = None,
    equipment: Optional[str] = None,
    limit: int = 10,
):
    if limit < 1 or limit > 50:
        raise HTTPException(status_code=422, detail="limit doit être entre 1 et 50")
    exercises = await wger_service.get_exercises(
        muscle_category=muscle, equipment=equipment, limit=limit
    )
    return {"results": exercises, "count": len(exercises), "source": "Wger"}


@router.get("/exercises/{exercise_id}", summary="Détails d'un exercice par ID (Wger)")
async def get_exercise_detail(exercise_id: int):
    exercise = await wger_service.get_exercise_by_id(exercise_id)
    if not exercise:
        raise HTTPException(status_code=404, detail="Exercice introuvable")
    return exercise

"""
Endpoint /metrics – KPIs en temps réel de l'API 4 (Training Program).
"""
from datetime import datetime, timezone
from fastapi import APIRouter
from shared.mongodb import get_db

router = APIRouter()

_GOAL_SPORT_MAP = {
    "lose": ["cardio", "hiit", "flexibility"],
    "gain": ["strength"],
    "maintain": ["cardio", "strength", "hiit", "flexibility", "yoga"],
}


@router.get("/metrics", summary="KPIs en temps réel – API 4 Training Program")
async def get_metrics():
    db = get_db()
    service = "training-program"

    pipeline = [
        {"$match": {"service": service}},
        {
            "$group": {
                "_id": "$status",
                "count": {"$sum": 1},
                "avg_latency_ms": {"$avg": "$latencyMs"},
                "max_latency_ms": {"$max": "$latencyMs"},
            }
        },
    ]

    groups: dict = {}
    async for doc in db["ailogs"].aggregate(pipeline):
        groups[doc["_id"]] = doc

    success = groups.get("success", {})
    error = groups.get("error", {})
    total = (success.get("count", 0) or 0) + (error.get("count", 0) or 0)
    error_count = error.get("count", 0) or 0

    # Workout Completion Rate (séances recommandées vs réalisées)
    # Donnée indicative si stockée dans les recommendations
    recommendations_count = await db["recommendations"].count_documents({"type": "activity"})

    return {
        "service": service,
        "kpis": {
            "total_requests": total,
            "success_count": success.get("count", 0) or 0,
            "error_count": error_count,
            "error_rate_pct": round(error_count / total * 100, 2) if total else 0.0,
            "avg_latency_ms": round(success.get("avg_latency_ms") or 0, 1),
            "max_latency_ms": success.get("max_latency_ms"),
            "total_training_recommendations_generated": recommendations_count,
            "workout_completion_rate_note": (
                "Nécessite un suivi côté utilisateur (séances réalisées / recommandées)"
            ),
        },
        "formulas": {
            "error_rate": "error_count / total_requests × 100",
            "avg_response_time": "Σ latencyMs / n requêtes réussies",
            "workout_completion_rate": "séances réalisées / séances recommandées × 100",
        },
    }

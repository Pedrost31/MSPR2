"""
Endpoint /metrics – KPIs en temps réel de l'API 1 (Food Recognition).
Agrège les logs stockés dans MongoDB (collection ailogs).
"""
from datetime import datetime, timezone
from fastapi import APIRouter
from shared.mongodb import get_db

router = APIRouter()


@router.get("/metrics", summary="KPIs en temps réel – API 1 Food Recognition")
async def get_metrics():
    db = get_db()
    service = "food-recognition"

    pipeline = [
        {"$match": {"service": service}},
        {
            "$group": {
                "_id": "$status",
                "count": {"$sum": 1},
                "avg_latency_ms": {"$avg": "$latencyMs"},
                "max_latency_ms": {"$max": "$latencyMs"},
                "min_latency_ms": {"$min": "$latencyMs"},
            }
        },
    ]

    cursor = db["ailogs"].aggregate(pipeline)
    groups: dict = {}
    async for doc in cursor:
        groups[doc["_id"]] = doc

    success = groups.get("success", {})
    error = groups.get("error", {})
    total = (success.get("count", 0) or 0) + (error.get("count", 0) or 0)
    error_count = error.get("count", 0) or 0

    # Disponibilité : premier log → maintenant
    first_doc = await db["ailogs"].find_one(
        {"service": service}, sort=[("createdAt", 1)]
    )
    uptime_seconds: float | None = None
    if first_doc and first_doc.get("createdAt"):
        delta = datetime.now(timezone.utc) - first_doc["createdAt"].replace(tzinfo=timezone.utc)
        uptime_seconds = round(delta.total_seconds(), 0)

    return {
        "service": service,
        "kpis": {
            "total_requests": total,
            "success_count": success.get("count", 0) or 0,
            "error_count": error_count,
            "error_rate_pct": round(error_count / total * 100, 2) if total else 0.0,
            "avg_latency_ms": round(success.get("avg_latency_ms") or 0, 1),
            "max_latency_ms": success.get("max_latency_ms"),
            "min_latency_ms": success.get("min_latency_ms"),
            "uptime_seconds": uptime_seconds,
            "availability_note": "Calculée depuis le premier log enregistré",
        },
        "formulas": {
            "error_rate": "error_count / total_requests × 100",
            "avg_response_time": "Σ latencyMs / n requêtes réussies",
        },
    }

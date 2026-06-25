"""
Endpoint /metrics – KPIs en temps réel de l'API 3 (Diet Plan).
Agrège les logs MongoDB + calcule la cohérence depuis les données réelles.
"""
from datetime import datetime, timezone
from fastapi import APIRouter
from shared.mongodb import get_db

router = APIRouter()

_GOAL_ADJUSTMENTS = {"lose": -500, "maintain": 0, "gain": 300}


@router.get("/metrics", summary="KPIs en temps réel – API 3 Diet Plan")
async def get_metrics():
    db = get_db()
    services = ["diet-plan", "diet-analysis"]

    pipeline = [
        {"$match": {"service": {"$in": services}}},
        {
            "$group": {
                "_id": {"service": "$service", "status": "$status"},
                "count": {"$sum": 1},
                "avg_latency_ms": {"$avg": "$latencyMs"},
            }
        },
    ]

    groups: dict = {}
    async for doc in db["ailogs"].aggregate(pipeline):
        key = f"{doc['_id']['service']}:{doc['_id']['status']}"
        groups[key] = doc

    plan_success = groups.get("diet-plan:success", {}).get("count", 0) or 0
    plan_error = groups.get("diet-plan:error", {}).get("count", 0) or 0
    plan_total = plan_success + plan_error

    analysis_success = groups.get("diet-analysis:success", {}).get("count", 0) or 0
    analysis_error = groups.get("diet-analysis:error", {}).get("count", 0) or 0
    analysis_total = analysis_success + analysis_error

    avg_latency_plan = round(groups.get("diet-plan:success", {}).get("avg_latency_ms") or 0, 1)
    avg_latency_analysis = round(groups.get("diet-analysis:success", {}).get("avg_latency_ms") or 0, 1)

    # Coherence Rate : calcul sur les profils réels ayant demandé un plan
    # On vérifie dans les logs que l'input contient "goal" et que target_calories respecte la règle
    coherent = 0
    unsafe = 0
    checked = 0

    async for log in db["ailogs"].find(
        {"service": "diet-plan", "status": "success"},
        {"input": 1, "output": 1},
    ).limit(100):
        inp = log.get("input", {})
        goal = inp.get("goal")
        target_cal = inp.get("target_calories")
        tdee = inp.get("tdee")

        if goal and target_cal and tdee:
            checked += 1
            adjustment = _GOAL_ADJUSTMENTS.get(goal, 0)
            expected = max(1200.0, float(tdee) + adjustment)
            if abs(float(target_cal) - expected) < 5:
                coherent += 1
            if float(target_cal) < 1200 or float(target_cal) > 6000:
                unsafe += 1

    coherence_rate = round(coherent / checked * 100, 2) if checked else None
    unsafe_rate = round(unsafe / checked * 100, 2) if checked else None

    return {
        "service": "diet-plan + diet-analysis",
        "kpis": {
            "diet_plan": {
                "total_requests": plan_total,
                "success_count": plan_success,
                "error_count": plan_error,
                "error_rate_pct": round(plan_error / plan_total * 100, 2) if plan_total else 0.0,
                "avg_latency_ms": avg_latency_plan,
            },
            "diet_analysis": {
                "total_requests": analysis_total,
                "success_count": analysis_success,
                "error_count": analysis_error,
                "error_rate_pct": round(analysis_error / analysis_total * 100, 2) if analysis_total else 0.0,
                "avg_latency_ms": avg_latency_analysis,
            },
            "coherence_rate_pct": coherence_rate,
            "unsafe_recommendation_rate_pct": unsafe_rate,
            "profiles_checked_for_coherence": checked,
            "note": "Coherence Rate calculé si les logs contiennent goal + target_calories + tdee",
        },
        "formulas": {
            "coherence_rate": "recommandations respectant les règles métier / total × 100",
            "unsafe_rate": "recommandations < 1200 kcal ou > 6000 kcal / total × 100",
            "avg_response_time": "Σ latencyMs / n requêtes réussies",
        },
    }

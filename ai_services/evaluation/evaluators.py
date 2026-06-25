"""
Évaluateurs par API – testent les endpoints et calculent les métriques.

Trois évaluateurs :
  FoodAPIEvaluator    → API 1 (Open Food Facts + USDA) : précision, rappel, F1
  DietAPIEvaluator    → API 3 (TDEE + Ollama)          : cohérence, sécurité
  TrainingAPIEvaluator→ API 4 (Ollama + Wger)           : cohérence, sécurité
  AvailabilityEvaluator → toutes les APIs              : disponibilité
"""
from __future__ import annotations

import sys
import os
import time
import asyncio
from typing import Any

import httpx

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from evaluation.datasets import (
    FOOD_SEARCH_CASES,
    BARCODE_CASES,
    DIET_COHERENCE_PROFILES,
    DIET_SAFETY_RULES,
    TRAINING_WORKOUT_CASES,
    API_HEALTH_ENDPOINTS,
)
from evaluation import metrics as M

# Ajustements caloriques définis dans tdee_calculator.py
_GOAL_ADJUSTMENTS = {"lose": -500, "maintain": 0, "gain": 300}


# ─── API 1 – Food Recognition ─────────────────────────────────────────────────

class FoodAPIEvaluator:
    """Évalue les endpoints de recherche alimentaire de l'API 1."""

    BASE_URL = "http://localhost:8001/api/v1/food"

    def __init__(self, timeout: float = 15.0):
        self.timeout = timeout

    async def evaluate_search(self) -> dict:
        """
        Précision / Rappel / F1 sur la recherche textuelle.

        Pour chaque requête du jeu de données :
          - TP si le food_name du premier résultat contient un mot-clé attendu (P@1)
          - Hit si n'importe quel résultat contient un mot-clé attendu (Recall)
        """
        case_results = []
        latencies: list[float] = []
        errors = 0

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            for case in FOOD_SEARCH_CASES:
                t0 = time.perf_counter()
                try:
                    r = await client.get(
                        f"{self.BASE_URL}/search",
                        params={"query": case["query"], "sources": "all"},
                    )
                    latency = (time.perf_counter() - t0) * 1000
                    latencies.append(latency)

                    if r.status_code != 200:
                        errors += 1
                        case_results.append({
                            "query": case["query"],
                            "found": False,
                            "correct_at_1": False,
                            "status_code": r.status_code,
                            "latency_ms": latency,
                        })
                        continue

                    names = [item["name"] for item in r.json().get("results", [])]
                    found = M.hit_in_results(names, case["expected_keywords"])
                    correct_at_1 = M.precision_at_k(names, case["expected_keywords"], k=1)

                    case_results.append({
                        "query": case["query"],
                        "found": found,
                        "correct_at_1": correct_at_1,
                        "results_count": len(names),
                        "status_code": 200,
                        "latency_ms": round(latency, 1),
                    })
                except httpx.ConnectError:
                    errors += 1
                    case_results.append({
                        "query": case["query"],
                        "found": False,
                        "correct_at_1": False,
                        "error": "API non disponible",
                        "latency_ms": 0,
                    })

        total = len(FOOD_SEARCH_CASES)
        tp = sum(1 for r in case_results if r.get("correct_at_1"))
        fp = sum(1 for r in case_results if r.get("found") and not r.get("correct_at_1"))
        fn = sum(1 for r in case_results if not r.get("found"))

        p = M.precision(tp, fp)
        r = M.recall(tp, fn)
        f1 = M.f1_score(p, r)

        return {
            "metric": "Food Search (Open Food Facts + USDA)",
            "total_queries": total,
            "true_positives": tp,
            "false_positives": fp,
            "false_negatives": fn,
            "precision": p,
            "recall": r,
            "f1_score": f1,
            "avg_latency_ms": M.average(latencies),
            "error_count": errors,
            "error_rate_pct": M.error_rate(errors, total),
            "details": case_results,
        }

    async def evaluate_barcode(self) -> dict:
        """Précision sur la recherche par code-barres."""
        results = []
        latencies: list[float] = []
        errors = 0

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            for case in BARCODE_CASES:
                t0 = time.perf_counter()
                try:
                    r = await client.get(f"{self.BASE_URL}/barcode/{case['barcode']}")
                    latency = (time.perf_counter() - t0) * 1000
                    latencies.append(latency)

                    if r.status_code == 200:
                        name = r.json().get("name", "")
                        match = any(kw.lower() in name.lower() for kw in case["expected_keywords"])
                        results.append({
                            "barcode": case["barcode"],
                            "found": True,
                            "correct": match,
                            "returned_name": name,
                            "latency_ms": round(latency, 1),
                        })
                    else:
                        errors += 1
                        results.append({
                            "barcode": case["barcode"],
                            "found": False,
                            "correct": False,
                            "status_code": r.status_code,
                            "latency_ms": round(latency, 1),
                        })
                except httpx.ConnectError:
                    errors += 1
                    results.append({
                        "barcode": case["barcode"],
                        "found": False,
                        "correct": False,
                        "error": "API non disponible",
                        "latency_ms": 0,
                    })

        total = len(BARCODE_CASES)
        correct = sum(1 for r in results if r.get("correct"))
        p = M.precision(correct, total - correct)

        return {
            "metric": "Barcode Lookup (Open Food Facts)",
            "total_lookups": total,
            "correct": correct,
            "precision": p,
            "avg_latency_ms": M.average(latencies),
            "error_count": errors,
            "details": results,
        }


# ─── API 3 – Diet Plan ────────────────────────────────────────────────────────

class DietAPIEvaluator:
    """
    Évalue le moteur de recommandation diététique (TDEE calculator + Ollama).

    Évaluation déterministe : les macros calculées par le TDEE calculator
    doivent TOUJOURS respecter les règles métier, quelle que soit l'entrée.
    """

    def evaluate_macro_coherence(self) -> dict:
        """
        Vérifie que chaque profil test produit une cible calorique cohérente
        avec l'objectif (déficit / surplus / maintien) et des règles de sécurité.

        Coherence Rate = % de profils où target_calories respecte la règle métier
        Unsafe Rate    = % de profils où calories < 1200 ou > 6000
        """
        from api3_diet_plan.services.tdee_calculator import (
            compute_bmr, compute_tdee, compute_target_calories, compute_macros,
        )

        results = []
        coherent_count = 0
        unsafe_count = 0

        for profile in DIET_COHERENCE_PROFILES:
            bmr = compute_bmr(
                profile["weight"], profile["height"],
                profile["age"], profile["gender"],
            )
            tdee = compute_tdee(bmr, profile["activityLevel"])
            target_cal = compute_target_calories(tdee, profile["goal"])
            macros = compute_macros(target_cal, profile["weight"], profile["goal"])

            # Cohérence : les calories respectent-elles l'ajustement attendu ?
            is_coherent = M.macro_coherence_check(
                target_cal, tdee, profile["goal"], _GOAL_ADJUSTMENTS
            )
            # Sécurité : calories dans des limites raisonnables ?
            is_safe_cal = M.safety_check_calories(
                target_cal,
                DIET_SAFETY_RULES["min_calories_absolute"],
                DIET_SAFETY_RULES["max_calories_absolute"],
            )
            is_safe_protein = M.safety_check_protein(macros["protein_g"], profile["weight"])
            is_safe = is_safe_cal and is_safe_protein

            # Balance macros (somme des % ≈ 100%)
            macro_pct_sum = macros["protein_pct"] + macros["carbs_pct"] + macros["fat_pct"]
            is_balanced = abs(macro_pct_sum - 100.0) < 2.0

            if is_coherent:
                coherent_count += 1
            if not is_safe:
                unsafe_count += 1

            results.append({
                "label": profile["label"],
                "goal": profile["goal"],
                "bmr": round(bmr, 0),
                "tdee": tdee,
                "target_calories": target_cal,
                "protein_g": macros["protein_g"],
                "carbs_g": macros["carbs_g"],
                "fat_g": macros["fat_g"],
                "protein_pct": macros["protein_pct"],
                "carbs_pct": macros["carbs_pct"],
                "fat_pct": macros["fat_pct"],
                "macro_pct_sum": round(macro_pct_sum, 1),
                "is_coherent": is_coherent,
                "is_safe_calories": is_safe_cal,
                "is_safe_protein": is_safe_protein,
                "is_balanced": is_balanced,
            })

        total = len(DIET_COHERENCE_PROFILES)
        return {
            "metric": "Diet Plan Coherence (TDEE Calculator)",
            "total_profiles": total,
            "coherent_count": coherent_count,
            "unsafe_count": unsafe_count,
            "coherence_rate_pct": M.coherence_rate(coherent_count, total),
            "unsafe_rate_pct": M.unsafe_rate(unsafe_count, total),
            "details": results,
        }


# ─── API 4 – Training Program ─────────────────────────────────────────────────

class TrainingAPIEvaluator:
    """Évalue le moteur de génération de programmes d'entraînement (API 4)."""

    BASE_URL = "http://localhost:8004/api/v4/training"

    def __init__(self, timeout: float = 180.0):
        self.timeout = timeout

    async def evaluate_quick_workout(self) -> dict:
        """
        Évalue la cohérence et la sécurité des entraînements générés par Ollama.

        Cohérence : le champ `type` de la réponse correspond au type demandé.
        Sécurité   : durée de session <= 120 min, présence d'au moins 1 phase.
        Structure  : tous les champs attendus sont présents.
        """
        results = []
        latencies: list[float] = []
        errors = 0
        coherent = 0
        unsafe = 0

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            for case in TRAINING_WORKOUT_CASES:
                t0 = time.perf_counter()
                try:
                    r = await client.post(
                        f"{self.BASE_URL}/quick-workout",
                        json={
                            "workout_type": case["workout_type"],
                            "duration_min": case["duration_min"],
                            "equipment": case["equipment"],
                        },
                    )
                    latency = (time.perf_counter() - t0) * 1000
                    latencies.append(latency)

                    if r.status_code != 200:
                        errors += 1
                        results.append({
                            "label": case["label"],
                            "requested_type": case["workout_type"],
                            "status_code": r.status_code,
                            "is_coherent": False,
                            "is_safe": False,
                            "has_required_fields": False,
                            "latency_ms": round(latency, 1),
                        })
                        continue

                    workout = r.json().get("workout", {})
                    returned_type = workout.get("type", "")
                    returned_duration = workout.get("duration_min", 0)
                    phases = workout.get("phases", [])

                    # Cohérence : type retourné correspond au type demandé
                    is_coherent = returned_type == case["expected_type"]
                    # Structure : champs obligatoires présents
                    has_fields = all(f in workout for f in case["expected_fields"])
                    # Sécurité : durée <= 120 min, au moins 1 phase
                    is_safe_duration = returned_duration <= case["safety"]["max_duration_min"]
                    is_safe_phases = len(phases) >= case["safety"]["min_phases"]
                    is_safe = is_safe_duration and is_safe_phases

                    if is_coherent:
                        coherent += 1
                    if not is_safe:
                        unsafe += 1

                    results.append({
                        "label": case["label"],
                        "requested_type": case["workout_type"],
                        "returned_type": returned_type,
                        "returned_duration_min": returned_duration,
                        "phases_count": len(phases),
                        "is_coherent": is_coherent,
                        "has_required_fields": has_fields,
                        "is_safe": is_safe,
                        "latency_ms": round(latency, 1),
                    })

                except httpx.ConnectError:
                    errors += 1
                    results.append({
                        "label": case["label"],
                        "requested_type": case["workout_type"],
                        "error": "API non disponible",
                        "is_coherent": False,
                        "is_safe": False,
                        "has_required_fields": False,
                        "latency_ms": 0,
                    })

        total = len(TRAINING_WORKOUT_CASES)
        return {
            "metric": "Training Quick-Workout Coherence (Ollama Llama3.2)",
            "total_cases": total,
            "coherent_count": coherent,
            "unsafe_count": unsafe,
            "error_count": errors,
            "coherence_rate_pct": M.coherence_rate(coherent, max(total - errors, 1)),
            "unsafe_rate_pct": M.unsafe_rate(unsafe, max(total - errors, 1)),
            "error_rate_pct": M.error_rate(errors, total),
            "avg_latency_ms": M.average(latencies),
            "details": results,
        }


# ─── Disponibilité de toutes les APIs ─────────────────────────────────────────

class AvailabilityEvaluator:
    """Vérifie la disponibilité de chaque API via son endpoint /health."""

    def __init__(self, checks: int = 3, timeout: float = 5.0):
        self.checks = checks
        self.timeout = timeout

    async def evaluate(self) -> dict:
        results = []
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            for api in API_HEALTH_ENDPOINTS:
                up_count = 0
                latencies: list[float] = []
                for _ in range(self.checks):
                    t0 = time.perf_counter()
                    try:
                        r = await client.get(api["url"])
                        latency = (time.perf_counter() - t0) * 1000
                        latencies.append(latency)
                        if r.status_code == 200:
                            up_count += 1
                    except Exception:
                        latencies.append(0)

                results.append({
                    "api": api["name"],
                    "service": api["service"],
                    "url": api["url"],
                    "checks": self.checks,
                    "up_count": up_count,
                    "availability_pct": M.availability(up_count, self.checks),
                    "avg_latency_ms": M.average([l for l in latencies if l > 0]),
                })

        all_up = sum(1 for r in results if r["availability_pct"] == 100.0)
        return {
            "metric": "API Availability",
            "apis_checked": len(results),
            "all_available": all_up == len(results),
            "details": results,
        }

"""
Calcul des métriques de performance pour l'évaluation des API IA.

Métriques implémentées :
  - Précision, Rappel, F1-score  (évaluation de la pertinence des résultats)
  - Coherence Rate               (taux de recommandations cohérentes avec les règles métier)
  - Unsafe Recommendation Rate   (taux de recommandations potentiellement dangereuses)
  - Average Response Time        (performance technique)
  - API Error Rate               (fiabilité)
  - Availability                 (disponibilité)
"""
from __future__ import annotations


def precision(tp: int, fp: int) -> float:
    """Parmi les résultats renvoyés, quelle fraction est correcte ?"""
    return round(tp / (tp + fp), 4) if (tp + fp) > 0 else 0.0


def recall(tp: int, fn: int) -> float:
    """Parmi tous les éléments attendus, quelle fraction a été trouvée ?"""
    return round(tp / (tp + fn), 4) if (tp + fn) > 0 else 0.0


def f1_score(p: float, r: float) -> float:
    """Moyenne harmonique entre précision et rappel."""
    return round(2 * p * r / (p + r), 4) if (p + r) > 0 else 0.0


def coherence_rate(correct: int, total: int) -> float:
    """Pourcentage de recommandations respectant les règles métier."""
    return round(correct / total * 100, 2) if total > 0 else 0.0


def unsafe_rate(unsafe: int, total: int) -> float:
    """Pourcentage de recommandations potentiellement dangereuses."""
    return round(unsafe / total * 100, 2) if total > 0 else 0.0


def error_rate(errors: int, total: int) -> float:
    """Taux d'erreurs API (réponses non-2xx)."""
    return round(errors / total * 100, 2) if total > 0 else 0.0


def availability(up: int, total: int) -> float:
    """Disponibilité du service (% de health-checks réussis)."""
    return round(up / total * 100, 2) if total > 0 else 0.0


def average(values: list[float]) -> float:
    """Moyenne arithmétique."""
    return round(sum(values) / len(values), 2) if values else 0.0


def precision_at_k(results: list[str], expected_keywords: list[str], k: int = 1) -> bool:
    """
    Vérifie si au moins un des `k` premiers résultats contient un mot-clé attendu.
    Utilisé pour P@1 (premier résultat correct) et P@5 (top 5).
    """
    top_k = results[:k]
    for name in top_k:
        name_lower = name.lower()
        if any(kw.lower() in name_lower for kw in expected_keywords):
            return True
    return False


def hit_in_results(results: list[str], expected_keywords: list[str]) -> bool:
    """Vérifie si un mot-clé attendu apparaît n'importe où dans la liste de résultats."""
    for name in results:
        name_lower = name.lower()
        if any(kw.lower() in name_lower for kw in expected_keywords):
            return True
    return False


def build_confusion(cases_results: list[dict]) -> dict:
    """
    Construit la matrice de confusion à partir d'une liste de résultats.
    Chaque entrée doit avoir : {"found": bool, "correct_at_1": bool}
    """
    tp = sum(1 for r in cases_results if r["found"] and r["correct_at_1"])
    fp = sum(1 for r in cases_results if r["found"] and not r["correct_at_1"])
    fn = sum(1 for r in cases_results if not r["found"])
    tn = 0  # non défini pour ce type de tâche de récupération d'information
    return {"tp": tp, "fp": fp, "fn": fn, "tn": tn}


def macro_coherence_check(
    target_calories: float,
    tdee: float,
    goal: str,
    goal_adjustments: dict[str, int],
) -> bool:
    """
    Vérifie que les calories cibles respectent l'ajustement attendu pour l'objectif.
    Règle : target_calories == max(1200, tdee + adjustment)
    """
    adjustment = goal_adjustments.get(goal, 0)
    expected = max(1200.0, tdee + adjustment)
    return abs(target_calories - expected) < 1.0


def safety_check_calories(calories: float, min_kcal: float = 1200, max_kcal: float = 6000) -> bool:
    """Vérifie que les calories sont dans des limites de sécurité."""
    return min_kcal <= calories <= max_kcal


def safety_check_protein(protein_g: float, weight_kg: float) -> bool:
    """Vérifie que les protéines respectent des seuils de sécurité (0.8–3.0 g/kg)."""
    ratio = protein_g / weight_kg if weight_kg > 0 else 0
    return 0.8 <= ratio <= 3.0

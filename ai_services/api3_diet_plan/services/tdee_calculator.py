"""
Calcul TDEE (Total Daily Energy Expenditure) et macronutriments.
Formule Mifflin-St Jeor + ajustement selon l'activité et l'objectif.
"""

_ACTIVITY_MULTIPLIERS = {
    "sedentary": 1.2,
    "light": 1.375,
    "moderate": 1.55,
    "active": 1.725,
    "very_active": 1.9,
}

_GOAL_ADJUSTMENTS = {
    "lose": -500,
    "maintain": 0,
    "gain": 300,
}


def compute_bmr(weight_kg: float, height_cm: float, age: int, gender: str) -> float:
    """Calcule le Taux Métabolique de Base (Mifflin-St Jeor)."""
    base = 10 * weight_kg + 6.25 * height_cm - 5 * age
    return base + 5 if gender == "male" else base - 161


def compute_tdee(bmr: float, activity_level: str) -> float:
    """Calcule la Dépense Énergétique Totale Journalière."""
    multiplier = _ACTIVITY_MULTIPLIERS.get(activity_level, 1.55)
    return round(bmr * multiplier, 0)


def compute_target_calories(tdee: float, goal: str) -> float:
    """Ajuste les calories selon l'objectif (lose/maintain/gain)."""
    adjustment = _GOAL_ADJUSTMENTS.get(goal, 0)
    return max(1200, tdee + adjustment)


def compute_macros(target_calories: float, weight_kg: float, goal: str) -> dict:
    """Calcule les macronutriments recommandés selon l'objectif sportif."""
    protein_g = weight_kg * (2.0 if goal == "gain" else 1.6 if goal == "lose" else 1.8)
    fat_g = weight_kg * 0.9
    protein_kcal = protein_g * 4
    fat_kcal = fat_g * 9
    carbs_kcal = max(0, target_calories - protein_kcal - fat_kcal)
    carbs_g = carbs_kcal / 4

    return {
        "calories": int(target_calories),
        "protein_g": round(protein_g, 1),
        "carbs_g": round(carbs_g, 1),
        "fat_g": round(fat_g, 1),
        "protein_pct": round(protein_kcal / target_calories * 100, 1),
        "carbs_pct": round(carbs_kcal / target_calories * 100, 1),
        "fat_pct": round(fat_kcal / target_calories * 100, 1),
    }


def get_full_macros(user: dict) -> dict | None:
    """Calcule les macros complètes à partir d'un profil utilisateur."""
    weight = user.get("weight")
    height = user.get("height")
    age = user.get("age")
    gender = user.get("gender", "male")
    activity = user.get("activityLevel", "moderate")
    goal = user.get("goal", "maintain")

    if not all([weight, height, age]):
        return None

    bmr = compute_bmr(float(weight), float(height), int(age), gender or "male")
    tdee = compute_tdee(bmr, activity or "moderate")
    target_cal = compute_target_calories(tdee, goal or "maintain")
    macros = compute_macros(target_cal, float(weight), goal or "maintain")

    return {
        "bmr": round(bmr, 0),
        "tdee": tdee,
        **macros,
    }

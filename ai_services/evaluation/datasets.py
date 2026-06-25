"""
Jeux de données de test pour l'évaluation des API IA HealthAI Coach.

Chaque cas de test définit une entrée connue et le résultat attendu,
permettant de calculer précision, rappel et F1-score.
"""

# ─── API 1 – Recherche alimentaire (Open Food Facts + USDA) ───────────────────
FOOD_SEARCH_CASES = [
    {"query": "apple",    "expected_keywords": ["apple", "pomme"]},
    {"query": "chicken",  "expected_keywords": ["chicken", "poulet"]},
    {"query": "salmon",   "expected_keywords": ["salmon", "saumon"]},
    {"query": "banana",   "expected_keywords": ["banana", "banane"]},
    {"query": "broccoli", "expected_keywords": ["broccoli", "brocoli"]},
    {"query": "rice",     "expected_keywords": ["rice", "riz"]},
    {"query": "egg",      "expected_keywords": ["egg", "oeuf", "œuf"]},
    {"query": "yogurt",   "expected_keywords": ["yogurt", "yoghurt", "yaourt"]},
    {"query": "avocado",  "expected_keywords": ["avocado", "avocat"]},
    {"query": "oats",     "expected_keywords": ["oat", "avoine"]},
    {"query": "tomato",   "expected_keywords": ["tomato", "tomate"]},
    {"query": "pasta",    "expected_keywords": ["pasta", "pâte", "pate", "spaghetti", "macaroni"]},
]

# Codes-barres de produits notoires (Open Food Facts)
BARCODE_CASES = [
    {"barcode": "3017620422003", "expected_keywords": ["nutella", "chocolate", "hazelnut"]},
    {"barcode": "3228857000166", "expected_keywords": ["evian", "water", "eau"]},
    {"barcode": "5449000000996", "expected_keywords": ["coca", "cola", "soda"]},
]

# ─── API 3 – Cohérence du moteur de recommandation diététique (TDEE) ──────────
# Profils deterministes : les macros calculées doivent respecter les règles métier.
DIET_COHERENCE_PROFILES = [
    {
        "label": "Homme 30 ans – Perte de poids",
        "weight": 80.0, "height": 175.0, "age": 30,
        "gender": "male", "activityLevel": "moderate", "goal": "lose",
        "expected": {
            "caloric_direction": "deficit",
            "safe_min_kcal": 1200,
            "safe_max_kcal": 3500,
        },
    },
    {
        "label": "Homme 25 ans – Prise de masse",
        "weight": 70.0, "height": 180.0, "age": 25,
        "gender": "male", "activityLevel": "active", "goal": "gain",
        "expected": {
            "caloric_direction": "surplus",
            "safe_min_kcal": 1800,
            "safe_max_kcal": 5000,
        },
    },
    {
        "label": "Femme 35 ans – Maintien",
        "weight": 60.0, "height": 165.0, "age": 35,
        "gender": "female", "activityLevel": "light", "goal": "maintain",
        "expected": {
            "caloric_direction": "maintain",
            "safe_min_kcal": 1200,
            "safe_max_kcal": 3000,
        },
    },
    {
        "label": "Femme 45 ans – Perte de poids sédentaire",
        "weight": 90.0, "height": 170.0, "age": 45,
        "gender": "female", "activityLevel": "sedentary", "goal": "lose",
        "expected": {
            "caloric_direction": "deficit",
            "safe_min_kcal": 1200,
            "safe_max_kcal": 2500,
        },
    },
    {
        "label": "Homme 22 ans – Prise de masse très actif",
        "weight": 65.0, "height": 172.0, "age": 22,
        "gender": "male", "activityLevel": "very_active", "goal": "gain",
        "expected": {
            "caloric_direction": "surplus",
            "safe_min_kcal": 2500,
            "safe_max_kcal": 6000,
        },
    },
    {
        "label": "Femme 28 ans – Maintien modéré",
        "weight": 55.0, "height": 162.0, "age": 28,
        "gender": "female", "activityLevel": "moderate", "goal": "maintain",
        "expected": {
            "caloric_direction": "maintain",
            "safe_min_kcal": 1200,
            "safe_max_kcal": 2800,
        },
    },
]

# Seuils de sécurité pour détecter les recommandations dangereuses
DIET_SAFETY_RULES = {
    "min_calories_absolute": 1200,
    "max_calories_absolute": 6000,
    "min_protein_g_per_kg": 0.8,
    "max_protein_g_per_kg": 3.0,
}

# ─── API 4 – Cohérence du moteur d'entraînement (quick-workout) ───────────────
TRAINING_WORKOUT_CASES = [
    {
        "label": "Cardio 30 min sans équipement",
        "workout_type": "cardio",
        "duration_min": 30,
        "equipment": [],
        "expected_type": "cardio",
        "expected_fields": ["workout_name", "type", "duration_min", "phases"],
        "safety": {"max_duration_min": 120, "min_phases": 1},
    },
    {
        "label": "Force 45 min avec haltères",
        "workout_type": "strength",
        "duration_min": 45,
        "equipment": ["dumbbell"],
        "expected_type": "strength",
        "expected_fields": ["workout_name", "type", "duration_min", "phases"],
        "safety": {"max_duration_min": 120, "min_phases": 1},
    },
    {
        "label": "HIIT 20 min sans équipement",
        "workout_type": "hiit",
        "duration_min": 20,
        "equipment": [],
        "expected_type": "hiit",
        "expected_fields": ["workout_name", "type", "duration_min", "phases"],
        "safety": {"max_duration_min": 120, "min_phases": 1},
    },
    {
        "label": "Flexibilité 30 min",
        "workout_type": "flexibility",
        "duration_min": 30,
        "equipment": [],
        "expected_type": "flexibility",
        "expected_fields": ["workout_name", "type", "duration_min", "phases"],
        "safety": {"max_duration_min": 120, "min_phases": 1},
    },
    {
        "label": "Yoga 45 min",
        "workout_type": "yoga",
        "duration_min": 45,
        "equipment": ["mat"],
        "expected_type": "yoga",
        "expected_fields": ["workout_name", "type", "duration_min", "phases"],
        "safety": {"max_duration_min": 120, "min_phases": 1},
    },
]

# Endpoints de santé de chaque API
API_HEALTH_ENDPOINTS = [
    {"name": "API 1 – Food Recognition", "url": "http://localhost:8001/health", "service": "food-recognition"},
    {"name": "API 2 – Recipe Suggestions", "url": "http://localhost:8002/health", "service": "recipe-suggestions"},
    {"name": "API 3 – Diet Plan",         "url": "http://localhost:8003/health", "service": "diet-plan"},
    {"name": "API 4 – Training Program",  "url": "http://localhost:8004/health", "service": "training-program"},
]

"""
Service Ollama Llama3.2 – génération de suggestions de recettes personnalisées.
Modèle gratuit et open source : https://ollama.com/library/llama3.2
"""
import json
import httpx
from config import settings


async def generate_recipe_suggestions(
    user_profile: dict,
    food_entries: list[dict],
    meal_type: str,
    meal_label: str,
) -> dict:
    """Génère des suggestions de recettes pour un repas spécifique selon le profil utilisateur."""
    recent_foods = ", ".join({e["name"] for e in food_entries[:10]}) if food_entries else "non disponible"

    goal_map = {
        "lose": "perte de poids (déficit calorique, riche en protéines, faible en graisses)",
        "gain": "prise de masse (surplus calorique, riche en protéines et glucides complexes)",
        "maintain": "maintien du poids (équilibre macronutriments)",
    }
    goal_label = goal_map.get(user_profile.get("goal", ""), user_profile.get("goal", "équilibre alimentaire"))

    prompt = f"""Tu es un chef nutritionniste expert. L'utilisateur veut des idées pour son {meal_label}.

Profil utilisateur :
- Objectif santé : {goal_label}
- Niveau d'activité : {user_profile.get('activityLevel', 'modéré')}
- Poids : {user_profile.get('weight', '?')} kg
- Cible calorique journalière : {user_profile.get('dailyCalorieTarget', 2000)} kcal/jour
- Aliments consommés récemment (à varier) : {recent_foods}

Génère 3 recettes de {meal_label} adaptées à cet objectif.
Réponds UNIQUEMENT en JSON valide :
{{
  "meal_type": "{meal_type}",
  "meal_label": "{meal_label}",
  "suggestions": [
    {{
      "name": "nom de la recette",
      "prep_time_min": 0,
      "calories": 0,
      "protein_g": 0.0,
      "carbs_g": 0.0,
      "fat_g": 0.0,
      "ingredients": ["ingrédient 1 (quantité)", "ingrédient 2 (quantité)"],
      "instructions": ["étape 1", "étape 2"],
      "benefits": "pourquoi cette recette est adaptée à l'objectif"
    }}
  ],
  "tip": "conseil nutritionnel spécifique à ce repas"
}}"""

    async with httpx.AsyncClient(timeout=120.0) as client:
        r = await client.post(
            f"{settings.ollama_url}/api/chat",
            json={
                "model": settings.ollama_text_model,
                "messages": [{"role": "user", "content": prompt}],
                "stream": False,
                "format": "json",
            },
        )
        r.raise_for_status()
        content = r.json()["message"]["content"]
        return json.loads(content) if isinstance(content, str) else content


async def generate_recipe_from_ingredients(ingredients: list[str], goal: str) -> dict:
    """Génère une recette à partir d'une liste d'ingrédients disponibles."""
    ing_list = ", ".join(ingredients)
    prompt = f"""Tu es un chef cuisinier expert en nutrition sportive.
Crée UNE recette équilibrée avec ces ingrédients disponibles : {ing_list}
Objectif santé : {goal}

Réponds UNIQUEMENT en JSON valide :
{{
  "name": "nom de la recette",
  "meal_type": "breakfast|lunch|dinner|snack",
  "servings": 1,
  "prep_time_min": 0,
  "cook_time_min": 0,
  "calories": 0,
  "protein_g": 0.0,
  "carbs_g": 0.0,
  "fat_g": 0.0,
  "ingredients": ["ingrédient 1 (quantité)"],
  "instructions": ["étape 1", "étape 2"],
  "nutrition_tip": "conseil nutritionnel lié à cette recette"
}}"""

    async with httpx.AsyncClient(timeout=120.0) as client:
        r = await client.post(
            f"{settings.ollama_url}/api/chat",
            json={
                "model": settings.ollama_text_model,
                "messages": [{"role": "user", "content": prompt}],
                "stream": False,
                "format": "json",
            },
        )
        r.raise_for_status()
        content = r.json()["message"]["content"]
        return json.loads(content) if isinstance(content, str) else content

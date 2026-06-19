"""
Service Ollama Llama3.2 – génération de plans diététiques personnalisés.
"""
import json
import httpx
from config import settings


async def generate_diet_plan(user_profile: dict, macros: dict, food_entries: list[dict]) -> dict:
    """Génère un plan alimentaire hebdomadaire personnalisé."""
    recent = ", ".join({e["name"] for e in food_entries[:8]}) if food_entries else "non disponible"
    goal_labels = {"lose": "perte de poids", "maintain": "maintien du poids", "gain": "prise de masse"}
    goal_label = goal_labels.get(user_profile.get("goal", "maintain"), "maintien du poids")

    prompt = f"""Tu es un diététicien sportif expert. Crée un plan alimentaire hebdomadaire.

Profil :
- Objectif : {goal_label}
- Cible calorique : {macros['calories']} kcal/jour
- Protéines : {macros['protein_g']}g ({macros['protein_pct']}%)
- Glucides : {macros['carbs_g']}g ({macros['carbs_pct']}%)
- Lipides : {macros['fat_g']}g ({macros['fat_pct']}%)
- Niveau d'activité : {user_profile.get('activityLevel', 'modéré')}
- Aliments récents : {recent}

Génère un plan pour 7 jours. Réponds UNIQUEMENT en JSON valide :
{{
  "weekly_plan": {{
    "monday": {{"breakfast": "...", "lunch": "...", "dinner": "...", "snack": "..."}},
    "tuesday": {{"breakfast": "...", "lunch": "...", "dinner": "...", "snack": "..."}},
    "wednesday": {{"breakfast": "...", "lunch": "...", "dinner": "...", "snack": "..."}},
    "thursday": {{"breakfast": "...", "lunch": "...", "dinner": "...", "snack": "..."}},
    "friday": {{"breakfast": "...", "lunch": "...", "dinner": "...", "snack": "..."}},
    "saturday": {{"breakfast": "...", "lunch": "...", "dinner": "...", "snack": "..."}},
    "sunday": {{"breakfast": "...", "lunch": "...", "dinner": "...", "snack": "..."}}
  }},
  "shopping_list": ["aliment 1 (quantité)", "aliment 2 (quantité)"],
  "key_principles": ["principe 1", "principe 2", "principe 3"],
  "hydration_tip": "conseil d'hydratation",
  "supplements": ["supplément conseillé 1"]
}}"""

    async with httpx.AsyncClient(timeout=180.0) as client:
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


async def analyze_nutritional_balance(food_entries: list[dict], target_macros: dict) -> dict:
    """Analyse l'équilibre nutritionnel de la semaine écoulée."""
    if not food_entries:
        return {"status": "no_data", "message": "Aucune entrée alimentaire pour la période"}

    total_cal = sum(e.get("calories", 0) for e in food_entries)
    total_protein = sum(e.get("protein") or 0 for e in food_entries)
    total_carbs = sum(e.get("carbs") or 0 for e in food_entries)
    total_fat = sum(e.get("fat") or 0 for e in food_entries)
    days = max(1, len({str(e.get("date", ""))[:10] for e in food_entries}))

    avg_cal = round(total_cal / days, 0)
    avg_protein = round(total_protein / days, 1)
    avg_carbs = round(total_carbs / days, 1)
    avg_fat = round(total_fat / days, 1)

    prompt = f"""Analyse cet équilibre nutritionnel et donne des recommandations.

Moyennes journalières réelles vs cibles :
- Calories : {avg_cal} kcal (cible {target_macros['calories']} kcal)
- Protéines : {avg_protein}g (cible {target_macros['protein_g']}g)
- Glucides : {avg_carbs}g (cible {target_macros['carbs_g']}g)
- Lipides : {avg_fat}g (cible {target_macros['fat_g']}g)
- Période : {days} jour(s)

Réponds UNIQUEMENT en JSON valide :
{{
  "score": 0,
  "status": "excellent|bon|moyen|insuffisant",
  "calories_balance": "surplus|déficit|équilibré",
  "strengths": ["point fort 1"],
  "improvements": ["amélioration 1"],
  "priority_action": "action prioritaire à mettre en place"
}}"""

    async with httpx.AsyncClient(timeout=60.0) as client:
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
        analysis = json.loads(content) if isinstance(content, str) else content

    return {
        "period_days": days,
        "averages": {
            "calories": avg_cal,
            "protein_g": avg_protein,
            "carbs_g": avg_carbs,
            "fat_g": avg_fat,
        },
        "targets": target_macros,
        "ai_analysis": analysis,
    }

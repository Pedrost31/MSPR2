"""
Service Ollama Llama3.2 – génération de programmes d'entraînement personnalisés.
"""
import json
import httpx
from config import settings

_GOAL_LABELS = {
    "lose": "perte de poids et cardio",
    "maintain": "maintien et forme générale",
    "gain": "prise de masse musculaire",
}

_ACTIVITY_LABELS = {
    "sedentary": "débutant",
    "light": "débutant-intermédiaire",
    "moderate": "intermédiaire",
    "active": "avancé",
    "very_active": "athlète confirmé",
}


async def generate_training_program(user_profile: dict, activity_entries: list[dict]) -> dict:
    """Génère un programme d'entraînement hebdomadaire personnalisé."""
    goal = user_profile.get("goal", "maintain")
    activity = user_profile.get("activityLevel", "moderate")
    recent_activities = ", ".join({e["name"] for e in activity_entries[:5]}) if activity_entries else "aucune activité récente"

    prompt = f"""Tu es un coach sportif professionnel. Crée un programme d'entraînement hebdomadaire.

Profil athlète :
- Objectif : {_GOAL_LABELS.get(goal, 'forme générale')}
- Niveau : {_ACTIVITY_LABELS.get(activity, 'intermédiaire')}
- Poids : {user_profile.get('weight', '?')} kg
- Activités récentes : {recent_activities}

Génère un programme sur 7 jours (inclure repos). Réponds UNIQUEMENT en JSON valide :
{{
  "program_name": "nom du programme",
  "difficulty": "débutant|intermédiaire|avancé",
  "weekly_sessions": 0,
  "weekly_plan": {{
    "monday": {{
      "type": "strength|cardio|hiit|rest|flexibility",
      "name": "nom de la séance",
      "duration_min": 0,
      "exercises": [
        {{
          "name": "nom de l'exercice",
          "sets": 3,
          "reps": "8-12",
          "rest_sec": 60,
          "notes": "conseil de forme"
        }}
      ]
    }},
    "tuesday": {{}},
    "wednesday": {{}},
    "thursday": {{}},
    "friday": {{}},
    "saturday": {{}},
    "sunday": {{}}
  }},
  "warm_up": ["exercice d'échauffement 1", "exercice 2"],
  "cool_down": ["étirement 1", "étirement 2"],
  "progression": "comment progresser sur 4 semaines",
  "coach_tip": "conseil du coach"
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


async def generate_quick_workout(workout_type: str, duration_min: int, equipment: list[str]) -> dict:
    """Génère un entraînement rapide sans profil utilisateur."""
    eq_str = ", ".join(equipment) if equipment else "sans équipement (bodyweight)"
    prompt = f"""Crée un entraînement {workout_type} de {duration_min} minutes.
Équipement disponible : {eq_str}

Réponds UNIQUEMENT en JSON valide :
{{
  "workout_name": "nom",
  "type": "{workout_type}",
  "duration_min": {duration_min},
  "calories_estimated": 0,
  "phases": [
    {{
      "phase": "échauffement|principal|retour au calme",
      "duration_min": 0,
      "exercises": [
        {{"name": "exercice", "duration_sec": 30, "reps": null, "sets": null, "notes": "conseil"}}
      ]
    }}
  ]
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

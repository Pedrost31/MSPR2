"""
Service Ollama LLaVA – analyse visuelle d'images alimentaires.
Modèle gratuit et open source : https://ollama.com/library/llava
"""
import json
import re
import httpx
from config import settings

_VISION_PROMPT = """Tu es un expert en nutrition. Analyse cette image d'aliment.
Réponds UNIQUEMENT en JSON valide avec cette structure exacte, sans texte avant ou après :
{
  "food_name": "nom de l'aliment en français",
  "ingredients": ["ingrédient 1", "ingrédient 2"],
  "portion_size": "taille estimée (ex: 1 pomme moyenne ~182g)",
  "nutrition": {
    "calories": 0,
    "protein_g": 0.0,
    "carbs_g": 0.0,
    "fat_g": 0.0,
    "fiber_g": 0.0
  },
  "confidence": "high",
  "notes": "remarques optionnelles"
}"""


def _extract_json(text: str) -> dict:
    """Extrait le premier bloc JSON trouvé dans un texte libre."""
    text = text.strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass
    # Fallback : cherche le premier {...} dans la réponse
    match = re.search(r"\{.*\}", text, re.DOTALL)
    if match:
        return json.loads(match.group())
    raise ValueError(f"Aucun JSON valide dans la réponse LLaVA : {text[:200]}")


async def analyze_food_image(image_base64: str) -> dict:
    """Analyse une image alimentaire via Ollama LLaVA."""
    payload = {
        "model": settings.ollama_vision_model,
        "messages": [
            {
                "role": "user",
                "content": _VISION_PROMPT,
                "images": [image_base64],
            }
        ],
        "stream": False,
        # "format": "json" retiré — LLaVA ne le supporte pas toujours avec les images
    }
    async with httpx.AsyncClient(timeout=300.0) as client:
        response = await client.post(
            f"{settings.ollama_url}/api/chat",
            json=payload,
        )
        response.raise_for_status()
        body = response.json()
        content = body.get("message", {}).get("content", "")
        if not content:
            raise ValueError(f"Réponse vide de LLaVA. Body reçu : {body}")
        return _extract_json(content)

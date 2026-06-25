# 4. API IA & documentation OpenAPI

## 4.1 Positionnement

L'API IA est exposée **via le backend Express** (intégrée à la MSPR TPRE501), qui agit
comme passerelle authentifiée vers 4 microservices FastAPI. Le front-end et les
partenaires externes consomment donc une **surface unique** (`/api/ai/*`), protégée par
JWT et limitée en débit, sans connaître la topologie interne des microservices.

```
Client ──JWT──▶ Backend /api/ai/* ──HTTP──▶ Microservices FastAPI (8001–8004) ──▶ Ollama
```

## 4.2 Spécification OpenAPI

- **Format** : OpenAPI 3.0.0.
- **Source de vérité** : [`backend/src/docs/swagger.ts`](../backend/src/docs/swagger.ts).
- **Fichier exporté** : [`openapi.json`](./openapi.json) (à la racine de `docs/`).
- **UI interactive** : `http://localhost:5000/api-docs` (Swagger UI, « Try it out »).

### Régénérer la spec (reproductible)

```bash
cd backend
npm run openapi:export          # → docs/openapi.json
# ou vers un chemin précis :
npx ts-node scripts/export-openapi.ts ../docs/openapi.json
```

La spec est **générée depuis le code**, ce qui garantit qu'elle reste synchronisée.
Elle est importable telle quelle dans Postman, Insomnia, Stoplight, ou pour générer un
client (openapi-generator).

## 4.3 Authentification

Toutes les routes `/api/ai/*` exigent un header :

```
Authorization: Bearer <accessToken>
```

Le token s'obtient via `POST /api/auth/login`. Quota IA : **60 requêtes / heure / IP**
(429 au-delà). Les routes de calcul déterministe (`/ai/diet/macros`) ne sont pas limitées.

## 4.4 Endpoints IA (résumé)

| Méthode | Endpoint | Microservice | Modèle | Description |
|---------|----------|--------------|--------|-------------|
| POST | `/api/ai/analyze-food-image` | 8001 | LLaVA | Analyse d'une photo de repas (base64), enrichie OFF/USDA |
| GET | `/api/ai/recipes/suggest?mealType=` | 8002 | Llama 3.2 | 3 recettes selon le profil |
| POST | `/api/ai/recipes/generate` | 8002 | Llama 3.2 | Recette à partir d'ingrédients |
| GET | `/api/ai/diet/macros` | 8003 | *déterministe* | BMR / TDEE / macros |
| GET | `/api/ai/diet/plan` | 8003 | Llama 3.2 | Plan hebdomadaire + courses |
| GET | `/api/ai/diet/analyze?days=` | 8003 | Llama 3.2 | Bilan nutritionnel récent |
| GET | `/api/ai/training/program` | 8004 | Llama 3.2 | Programme sportif hebdomadaire |
| POST | `/api/ai/training/quick-workout` | 8004 | Llama 3.2 | Séance express |
| POST | `/api/ai/recommend` | — | OpenAI / mock | Recommandation texte générique |
| GET | `/api/ai/history?type=&limit=` | — | — | Historique (MongoDB) |

### Exemple — analyse d'image

```http
POST /api/ai/analyze-food-image
Authorization: Bearer <token>
Content-Type: application/json

{ "imageBase64": "<JPEG base64 sans préfixe data:>" }
```

```json
{
  "success": true,
  "data": {
    "request_id": "…",
    "analysis": {
      "food_name": "pavé de saumon",
      "ingredients": ["saumon", "aneth"],
      "portion_size": "1 pavé ~150g",
      "nutrition": { "calories": 280, "protein_g": 34, "carbs_g": 0, "fat_g": 15, "fiber_g": 0 },
      "nutrition_basis": "pour 100 g (source : Open Food Facts)",
      "confidence": "high"
    },
    "latency_ms": 85000
  }
}
```

### Exemple — macros (déterministe)

```http
GET /api/ai/diet/macros
Authorization: Bearer <token>
```

```json
{ "success": true, "data": { "macros": {
  "bmr": 1780, "tdee": 2759, "calories": 2759,
  "protein_g": 150, "carbs_g": 344, "fat_g": 92
}}}
```

## 4.5 Documentation détaillée des microservices

Chaque microservice expose sa propre spec OpenAPI auto-générée par FastAPI :

| Service | Swagger | Préfixe |
|---------|---------|---------|
| API 1 — Reconnaissance alimentaire | `http://localhost:8001/docs` | `/api/v1/food` |
| API 2 — Suggestions de recettes | `http://localhost:8002/docs` | `/api/v2/recipes` |
| API 3 — Plan diététique | `http://localhost:8003/docs` | `/api/v3/diet` |
| API 4 — Programme d'entraînement | `http://localhost:8004/docs` | `/api/v4/training` |

Le détail endpoint par endpoint (corps de requête, réponses) est maintenu dans
[`ai_services/README.md`](../ai_services/README.md).

## 4.6 Technologies additionnelles mobilisées (justification)

| Techno | Rôle | Justification |
|--------|------|---------------|
| **FastAPI** | Framework des microservices | Async natif (adapté aux appels LLM longs), validation Pydantic, Swagger auto-généré. |
| **Ollama** | Runtime LLM local | Exécution gratuite et souveraine de LLaVA/Llama 3.2, API HTTP simple. |
| **Pydantic** | Validation des entrées | Rejet précoce des payloads invalides (ex. base64 vide → 422). |
| **Motor** | Driver MongoDB async | Écriture non bloquante des recommandations/logs. |
| **httpx** | Client HTTP async | Appels aux APIs externes (OFF, USDA, Ollama) sans bloquer l'event loop. |
| **swagger-jsdoc / swagger-ui-express** | OpenAPI côté backend | Doc unique, testable, exportable. |
| **express-rate-limit** | Quotas IA | Protège les ressources d'inférence coûteuses. |

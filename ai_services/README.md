# HealthAI Coach — Microservices IA

4 microservices Python FastAPI alimentés par Ollama (LLaVA + Llama3.2), 100% gratuits et open source.

---

## Architecture

```
ai_services/
├── api1_food_recognition/    → Port 8001  (LLaVA  – vision)
├── api2_recipe_suggestions/  → Port 8002  (Llama3.2 – texte)
├── api3_diet_plan/           → Port 8003  (Llama3.2 – texte)
├── api4_training_program/    → Port 8004  (Llama3.2 – texte)
├── shared/                   → PostgreSQL + MongoDB partagés
└── .venv/                    → Environnement Python unique
```

**Dépendances externes :**

| Service | Port | Rôle |
|---------|------|------|
| PostgreSQL (Docker) | 55432 | Profils utilisateurs, entrées alimentaires |
| MongoDB (Docker) | 27017 | Logs IA, recommandations |
| Ollama | 11434 | LLM local (LLaVA + Llama3.2) |

---

## Prérequis

- Python 3.11+
- [Ollama](https://ollama.com) installé avec les modèles :
  ```
  ollama pull llava
  ollama pull llama3.2
  ```
- Docker Desktop lancé

---

## Démarrage

### 1. Lancer les bases de données (Docker)

```powershell
cd C:\Users\elgas\OneDrive\Desktop\MSPR2\backend
docker-compose up -d db mongo
```

### 2. Lancer les migrations (première fois uniquement)

```powershell
cd C:\Users\elgas\OneDrive\Desktop\MSPR2\backend
npm install
node_modules\.bin\prisma migrate deploy
node_modules\.bin\ts-node src/prisma/seed.ts
```

### 3. Lancer les 4 APIs (4 terminaux séparés)

**Terminal 1 — API 1**
```powershell
cd C:\Users\elgas\OneDrive\Desktop\MSPR2\ai_services\api1_food_recognition
..\.venv\Scripts\uvicorn main:app --host 0.0.0.0 --port 8001 --reload
```

**Terminal 2 — API 2**
```powershell
cd C:\Users\elgas\OneDrive\Desktop\MSPR2\ai_services\api2_recipe_suggestions
..\.venv\Scripts\uvicorn main:app --host 0.0.0.0 --port 8002 --reload
```

**Terminal 3 — API 3**
```powershell
cd C:\Users\elgas\OneDrive\Desktop\MSPR2\ai_services\api3_diet_plan
..\.venv\Scripts\uvicorn main:app --host 0.0.0.0 --port 8003 --reload
```

**Terminal 4 — API 4**
```powershell
cd C:\Users\elgas\OneDrive\Desktop\MSPR2\ai_services\api4_training_program
..\.venv\Scripts\uvicorn main:app --host 0.0.0.0 --port 8004 --reload
```

---

## Utilisateur de test

```
ID    : e6a37d3d-b619-474d-84e9-aba44a48dea2
Email : demo@healthai.com
Profil: 75kg, 175cm, 30 ans, objectif: maintain, activité: moderate
```

---

## API 1 — Reconnaissance alimentaire par image

**Swagger :** `http://localhost:8001/docs`  
**Modèle :** LLaVA (vision)

### Endpoints

#### `POST /api/v1/food/upload-image` — Analyser une image
Upload d'une photo d'aliment → analyse nutritionnelle complète.

**Paramètre URL :** `?user_id=<id>`  
**Body :** fichier image (multipart/form-data)  
**Temps de réponse :** 1–3 minutes (LLaVA est lent)

**Réponse :**
```json
{
  "request_id": "...",
  "analysis": {
    "food_name": "pavé de saumon",
    "ingredients": ["saumon", "aneth"],
    "portion_size": "1 pavé ~150g",
    "nutrition": {
      "calories": 280,
      "protein_g": 34.0,
      "carbs_g": 0.0,
      "fat_g": 15.0,
      "fiber_g": 0.0
    },
    "confidence": "high",
    "notes": "..."
  },
  "latency_ms": 85000
}
```

#### `POST /api/v1/food/analyze-image` — Analyser en base64
**Body JSON :**
```json
{
  "image_base64": "<image encodée en base64>",
  "user_id": "e6a37d3d-b619-474d-84e9-aba44a48dea2"
}
```

#### `GET /api/v1/food/search` — Rechercher un aliment
**Paramètre :** `?query=pomme&sources=all`  
Sources disponibles : `all`, `openfoodfacts`, `usda`

#### `GET /api/v1/food/barcode/{barcode}` — Recherche par code-barres
```
GET /api/v1/food/barcode/3017620422003
```

---

## API 2 — Suggestions de recettes

**Swagger :** `http://localhost:8002/docs`  
**Modèle :** Llama3.2

### Endpoints

#### `GET /api/v2/recipes/suggest/{user_id}` — Recettes personnalisées par repas
Retourne 3 recettes adaptées à l'objectif de l'utilisateur pour le repas choisi.

**Paramètre URL obligatoire :** `?meal_type=<type>`

| `meal_type` | Repas |
|-------------|-------|
| `breakfast` | Petit-déjeuner |
| `lunch` | Déjeuner |
| `dinner` | Dîner |
| `snack` | Collation |

**Exemple :**
```
GET /api/v2/recipes/suggest/e6a37d3d-b619-474d-84e9-aba44a48dea2?meal_type=lunch
```

**Réponse :**
```json
{
  "meal_type": "lunch",
  "meal_label": "déjeuner",
  "recipes": {
    "suggestions": [
      {
        "name": "Poulet grillé aux légumes",
        "prep_time_min": 20,
        "calories": 450,
        "protein_g": 38.0,
        "carbs_g": 30.0,
        "fat_g": 12.0,
        "ingredients": ["200g poulet", "100g brocolis"],
        "instructions": ["Griller le poulet 15 min", "..."],
        "benefits": "Riche en protéines, adapté à l'objectif maintain"
      }
    ],
    "tip": "conseil nutritionnel pour ce repas"
  }
}
```

#### `POST /api/v2/recipes/generate` — Recette depuis des ingrédients
**Body JSON :**
```json
{
  "user_id": "e6a37d3d-b619-474d-84e9-aba44a48dea2",
  "ingredients": ["œufs", "épinards", "fromage"],
  "goal": "prise de muscle"
}
```

#### `GET /api/v2/recipes/search` — Recherche TheMealDB
```
GET /api/v2/recipes/search?query=chicken
```

#### `GET /api/v2/recipes/random` — Recette aléatoire
```
GET /api/v2/recipes/random
```

---

## API 3 — Plan diététique

**Swagger :** `http://localhost:8003/docs`  
**Modèle :** Llama3.2

### Endpoints

#### `GET /api/v3/diet/plan/{user_id}` — Plan hebdomadaire complet
Génère un plan alimentaire sur 7 jours avec liste de courses.

```
GET /api/v3/diet/plan/e6a37d3d-b619-474d-84e9-aba44a48dea2
```

**Réponse :**
```json
{
  "plan": {
    "weekly_plan": {
      "monday": {
        "breakfast": "Flocons d'avoine + banane",
        "lunch": "Riz + poulet",
        "dinner": "Saumon + légumes",
        "snack": "Yaourt grec"
      }
    },
    "shopping_list": ["Poulet 1kg", "Riz complet 500g"],
    "key_principles": ["Manger toutes les 3h"],
    "hydration_tip": "Boire 2.5L d'eau par jour"
  },
  "macros": {
    "bmr": 1780,
    "tdee": 2759,
    "calories": 2759,
    "protein_g": 150.0,
    "carbs_g": 344.0,
    "fat_g": 92.0
  }
}
```

#### `GET /api/v3/diet/macros/{user_id}` — Calcul des macros
Retourne BMR, TDEE et répartition protéines/glucides/lipides.

```
GET /api/v3/diet/macros/e6a37d3d-b619-474d-84e9-aba44a48dea2
```

#### `GET /api/v3/diet/analyze/{user_id}` — Analyse nutritionnelle
**Paramètre optionnel :** `?days=7` (1–30)
```
GET /api/v3/diet/analyze/e6a37d3d-b619-474d-84e9-aba44a48dea2?days=7
```

---

## API 4 — Programme d'entraînement

**Swagger :** `http://localhost:8004/docs`  
**Modèle :** Llama3.2

### Endpoints

#### `GET /api/v4/training/program/{user_id}` — Programme hebdomadaire
Génère un programme sportif sur 7 jours adapté au profil.

```
GET /api/v4/training/program/e6a37d3d-b619-474d-84e9-aba44a48dea2
```

**Réponse :**
```json
{
  "program": {
    "program_name": "Programme Forme Générale",
    "difficulty": "intermédiaire",
    "weekly_sessions": 4,
    "weekly_plan": {
      "monday": {
        "type": "strength",
        "name": "Haut du corps",
        "duration_min": 45,
        "exercises": [
          {"name": "Pompes", "sets": 3, "reps": "12-15", "rest_sec": 60}
        ]
      },
      "tuesday": { "type": "rest", "name": "Repos actif" }
    },
    "warm_up": ["5 min marche rapide", "Rotations des épaules"],
    "cool_down": ["Étirement quadriceps", "Posture enfant"],
    "progression": "Augmenter de 5% les charges toutes les 2 semaines",
    "coach_tip": "La régularité prime sur l'intensité"
  }
}
```

#### `POST /api/v4/training/quick-workout` — Entraînement express
Pas besoin de compte utilisateur.

**Body JSON :**
```json
{
  "workout_type": "hiit",
  "duration_min": 30,
  "equipment": []
}
```

| `workout_type` | Description |
|----------------|-------------|
| `cardio` | Cardio endurance |
| `strength` | Musculation |
| `hiit` | Intervalles haute intensité |
| `flexibility` | Souplesse / étirements |
| `yoga` | Yoga |

#### `GET /api/v4/training/exercises` — Catalogue d'exercices (Wger)
**Paramètres optionnels :**
```
?muscle=Chest&equipment=Barbell&limit=10
```

---

## Tests unitaires

Lancer tous les tests (136 tests au total) :

```powershell
cd C:\Users\elgas\OneDrive\Desktop\MSPR2\ai_services

# Toutes les APIs d'un coup
..\.venv\Scripts\pytest api1_food_recognition/tests/ api2_recipe_suggestions/tests/ api3_diet_plan/tests/ api4_training_program/tests/ -v

# Par API
..\.venv\Scripts\pytest api1_food_recognition/tests/ -v   # 30 tests
..\.venv\Scripts\pytest api2_recipe_suggestions/tests/ -v  # 38 tests
..\.venv\Scripts\pytest api3_diet_plan/tests/ -v           # 36 tests
..\.venv\Scripts\pytest api4_training_program/tests/ -v    # 32 tests
```

---

## Notes importantes

- **Temps de réponse :** LLaVA (images) = 1–3 min / Llama3.2 (texte) = 30–90 sec. C'est normal, le modèle tourne en local.
- **Le `.env` ne se recharge pas avec `--reload`** : si tu modifies `.env`, redémarre uvicorn manuellement (Ctrl+C + relancer).
- **Docker doit tourner** avant de lancer les APIs, sinon erreur de connexion PostgreSQL.
- **Swagger UI** : accessible sur `/docs` de chaque API — interface graphique pour tester sans écrire de code.

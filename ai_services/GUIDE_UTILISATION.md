# Guide d'utilisation – Microservices IA MSPR TPRE502

## Table des matières
1. [Architecture et flux de données](#1-architecture-et-flux-de-données)
2. [Démarrage rapide](#2-démarrage-rapide)
3. [APIs – Référence complète](#3-apis--référence-complète)
4. [Connexion PostgreSQL – lecture du profil utilisateur](#4-connexion-postgresql--lecture-du-profil-utilisateur)
5. [MongoDB – logs IA et métriques](#5-mongodb--logs-ia-et-métriques)
6. [Endpoints /metrics par service](#6-endpoints-metrics-par-service)
7. [Rapport d'évaluation (MSPR)](#7-rapport-dévaluation-mspr)

---

## 1. Architecture et flux de données

```
┌─────────────────────────────────────────────────────┐
│                   Frontend React                     │
│                (client/ – port 5173)                 │
└────────────────────┬────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────┐
│              Backend Node.js / Express               │
│                (backend/ – port 5000)                │
│  - Auth JWT  - CRUD utilisateur  - CORS              │
└──┬─────────────┬──────────────┬─────────────┬───────┘
   │             │              │             │
   ▼             ▼              ▼             ▼
PostgreSQL    MongoDB      API 1 :8001   API 2 :8002
port 55432    port 27017   Food Recog.   Recipes
(Prisma)      (ailogs +    (Ollama       (TheMealDB
              recomm.)      LLaVA +       + Ollama)
                            OFF/USDA)
                                      API 3 :8003   API 4 :8004
                                      Diet Plan     Training
                                      (Ollama +     (Ollama +
                                       TDEE calc)    Wger)

Sources externes (toutes gratuites / open source) :
  - Ollama LLaVA  : http://localhost:11434  (vision)
  - Ollama Llama3.2: http://localhost:11434  (NLP)
  - Open Food Facts: https://world.openfoodfacts.org
  - USDA FoodData : https://api.nal.usda.gov
  - TheMealDB     : https://www.themealdb.com
  - Wger          : https://wger.de
```

**Flux d'une requête typique (ex. plan diététique) :**
1. Le frontend envoie `GET /api/v3/diet/plan/{userId}` à l'API 3.
2. L'API 3 lit le profil de l'utilisateur dans **PostgreSQL** (`User`, `FoodEntry`).
3. Le TDEE est calculé localement (Mifflin-St Jeor) → calories cible déterminées.
4. **Ollama Llama3.2** génère le plan textuel.
5. Le log est sauvegardé dans **MongoDB** (collection `ailogs`).
6. La recommandation est sauvegardée dans **MongoDB** (collection `recommendations`).
7. La réponse JSON est retournée au client.

---

## 2. Démarrage rapide

### Prérequis
| Outil | Version | Vérification |
|---|---|---|
| Python | 3.11+ | `python --version` |
| Ollama | latest | `ollama --version` |
| MongoDB | 6+ | `mongosh --version` |
| PostgreSQL | 15+ | port `55432` |
| Node.js | 18+ | `node --version` |

### Étape 1 – Variables d'environnement

Le fichier `ai_services/.env` est déjà configuré :
```env
DATABASE_URL=postgresql://postgres:healthai123@localhost:55432/healthai
MONGODB_URI=mongodb://localhost:27017/healthai
OLLAMA_URL=http://localhost:11434
OLLAMA_VISION_MODEL=llava:latest
OLLAMA_TEXT_MODEL=llama3.2:latest
USDA_API_KEY=kmqWa6fsnc9h9bsvL6bZnGYr23JKxYHUaKclK1L6
```

### Étape 2 – Démarrer Ollama et les modèles

```powershell
# Démarrer le serveur Ollama (garde le terminal ouvert)
ollama serve

# Dans un autre terminal – télécharger les modèles (1 seule fois)
ollama pull llava:latest       # modèle vision (~4 GB)
ollama pull llama3.2:latest    # modèle texte (~2 GB)

# Vérifier que les modèles sont bien présents
ollama list
```

### Étape 3 – Démarrer les 4 microservices IA

Depuis le dossier `ai_services/` :

```powershell
cd ai_services

# Activer le venv
.\.venv\Scripts\Activate.ps1

# Démarrer chaque API dans un terminal séparé
uvicorn api1_food_recognition.main:app --port 8001 --reload
uvicorn api2_recipe_suggestions.main:app --port 8002 --reload
uvicorn api3_diet_plan.main:app --port 8003 --reload
uvicorn api4_training_program.main:app --port 8004 --reload
```

### Étape 4 – Démarrer le backend Node.js

```powershell
cd backend
npm install
npm run dev    # port 5000
```

### Étape 5 – Démarrer le frontend

```powershell
cd client
npm install
npm run dev    # port 5173
```

### Vérification rapide (toutes les APIs)

```powershell
curl http://localhost:8001/health
curl http://localhost:8002/health
curl http://localhost:8003/health
curl http://localhost:8004/health
```

Réponse attendue par service :
```json
{"status": "ok", "service": "food-recognition", "port": 8001}
```

---

## 3. APIs – Référence complète

### API 1 – Reconnaissance Alimentaire (port 8001)

**Documentation Swagger :** `http://localhost:8001/docs`

| Méthode | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/food/analyze-image` | Analyse une image (base64) avec Ollama LLaVA |
| `POST` | `/api/v1/food/upload-image?user_id=X` | Upload image multipart |
| `GET` | `/api/v1/food/search?query=apple` | Recherche Open Food Facts + USDA |
| `GET` | `/api/v1/food/barcode/{barcode}` | Produit par code-barres (Open Food Facts) |
| `GET` | `/api/v1/metrics` | KPIs en temps réel (depuis MongoDB) |
| `GET` | `/health` | Statut du service |

**Exemple – Recherche aliment :**
```bash
curl "http://localhost:8001/api/v1/food/search?query=apple&sources=all"
```
```json
{
  "query": "apple",
  "results": [
    {
      "name": "Apple",
      "calories": 52,
      "protein": 0.3,
      "carbs": 13.8,
      "fat": 0.2,
      "source": "USDA"
    }
  ],
  "sources": ["Open Food Facts", "USDA FoodData Central"]
}
```

**Exemple – Code-barres Nutella :**
```bash
curl "http://localhost:8001/api/v1/food/barcode/3017620422003"
```

**Exemple – Analyse image :**
```bash
curl -X POST "http://localhost:8001/api/v1/food/analyze-image" \
  -H "Content-Type: application/json" \
  -d '{"image_base64": "<BASE64>", "user_id": "user-123"}'
```

---

### API 2 – Suggestions de Recettes (port 8002)

**Documentation Swagger :** `http://localhost:8002/docs`

| Méthode | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v2/recipes/suggest/{user_id}` | Suggestions personnalisées (Ollama + profil) |
| `GET` | `/api/v2/recipes/search?query=pasta` | Recherche TheMealDB |
| `GET` | `/api/v2/recipes/{meal_id}` | Détails d'une recette |
| `GET` | `/health` | Statut du service |

---

### API 3 – Plan Diététique (port 8003)

**Documentation Swagger :** `http://localhost:8003/docs`

| Méthode | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v3/diet/macros/{user_id}` | Calcul TDEE + macros (sans IA, instantané) |
| `GET` | `/api/v3/diet/plan/{user_id}` | Plan hebdomadaire IA (Ollama Llama3.2) |
| `GET` | `/api/v3/diet/analyze/{user_id}?days=7` | Analyse nutritionnelle de la semaine |
| `GET` | `/api/v3/metrics` | KPIs en temps réel (depuis MongoDB) |
| `GET` | `/health` | Statut du service |

**Exemple – Calcul macros :**
```bash
curl "http://localhost:8003/api/v3/diet/macros/<USER_ID>"
```
```json
{
  "user_id": "cmc...",
  "macros": {
    "bmr": 1680,
    "tdee": 2268,
    "calories": 1768,
    "protein_g": 126,
    "carbs_g": 198,
    "fat_g": 59,
    "goal": "lose",
    "activity_level": "moderate"
  }
}
```

> **Comment obtenir un USER_ID valide ?** Connectez-vous au frontend, allez dans le profil, ou lisez directement dans PostgreSQL :
> ```sql
> SELECT id, email, name FROM "User" LIMIT 5;
> ```

---

### API 4 – Programmes d'Entraînement (port 8004)

**Documentation Swagger :** `http://localhost:8004/docs`

| Méthode | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v4/training/program/{user_id}` | Programme hebdomadaire IA personnalisé |
| `POST` | `/api/v4/training/quick-workout` | Entraînement rapide sans profil |
| `GET` | `/api/v4/training/exercises` | Exercices Wger (filtrable) |
| `GET` | `/api/v4/training/exercises/{id}` | Détails d'un exercice |
| `GET` | `/api/v4/metrics` | KPIs en temps réel (depuis MongoDB) |
| `GET` | `/health` | Statut du service |

**Exemple – Quick workout :**
```bash
curl -X POST "http://localhost:8004/api/v4/training/quick-workout" \
  -H "Content-Type: application/json" \
  -d '{"workout_type": "hiit", "duration_min": 30, "equipment": []}'
```
```json
{
  "workout": {
    "type": "hiit",
    "duration_minutes": 30,
    "exercises": [
      {"name": "Burpees", "sets": 3, "duration_sec": 30, "rest_sec": 15},
      ...
    ]
  }
}
```

**Types de workout valides :** `cardio`, `strength`, `hiit`, `flexibility`, `yoga`

---

## 4. Connexion PostgreSQL – lecture du profil utilisateur

Les microservices IA **lisent en lecture seule** la base PostgreSQL gérée par Prisma (backend Node.js).

**Configuration :**
```
Host     : localhost
Port     : 55432
Database : healthai
User     : postgres
Password : healthai123
```

**Tables utilisées par les APIs :**

| Table | Colonnes clés | Utilisée par |
|---|---|---|
| `"User"` | `id, age, weight, height, gender, activityLevel, goal, dailyCalorieTarget` | API 3, API 4 |
| `"FoodEntry"` | `userId, name, calories, protein, carbs, fat, mealType, date` | API 3 (analyse 7j) |
| `"ActivityEntry"` | `userId, name, duration, caloriesBurned, type, date` | API 4 (historique 14j) |
| `"GoalSettings"` | `userId, dailyCalorieTarget, dailyProteinTarget, weeklyWorkoutTarget` | API 3 (optionnel) |

**Valeurs de `activityLevel` reconnues :**

| Valeur en base | Multiplicateur TDEE | Description |
|---|---|---|
| `sedentary` | × 1.2 | Assis, peu d'exercice |
| `light` | × 1.375 | 1-3 jours/semaine |
| `moderate` | × 1.55 | 3-5 jours/semaine |
| `active` | × 1.725 | 6-7 jours/semaine |
| `very_active` | × 1.9 | Athlète 2x/jour |

**Valeurs de `goal` reconnues :**

| Valeur | Ajustement calorique | Description |
|---|---|---|
| `lose` | TDEE − 500 kcal | Perte de poids |
| `maintain` | TDEE ± 0 kcal | Maintien |
| `gain` | TDEE + 300 kcal | Prise de masse |

**Requêtes PostgreSQL utiles :**

```sql
-- Voir tous les utilisateurs avec leur profil complet
SELECT id, email, name, age, weight, height, gender,
       "activityLevel", goal, "dailyCalorieTarget"
FROM "User";

-- Entrées alimentaires des 7 derniers jours pour un user
SELECT name, calories, protein, carbs, fat, "mealType", date
FROM "FoodEntry"
WHERE "userId" = 'cmc...'
  AND date >= NOW() - INTERVAL '7 days'
ORDER BY date DESC;

-- Activités des 14 derniers jours
SELECT name, duration, "caloriesBurned", type, date
FROM "ActivityEntry"
WHERE "userId" = 'cmc...'
  AND date >= NOW() - INTERVAL '14 days'
ORDER BY date DESC;
```

**Connexion rapide via psql :**
```powershell
psql -U postgres -h localhost -p 55432 -d healthai
```

---

## 5. MongoDB – logs IA et métriques

La base MongoDB `healthai` contient deux collections :

### Collection `ailogs` – Chaque appel IA est tracé

```json
{
  "_id": "ObjectId(...)",
  "userId": "cmc...",
  "requestId": "uuid-v4",
  "service": "diet-plan",
  "status": "success",
  "input": {
    "goal": "lose",
    "target_calories": 1768,
    "tdee": 2268
  },
  "output": "Plan alimentaire généré par Ollama...",
  "latencyMs": 3421,
  "createdAt": "2026-06-24T10:30:00Z",
  "updatedAt": "2026-06-24T10:30:03Z"
}
```

**Valeurs possibles de `service` :**
- `food-recognition` — API 1 (analyse image)
- `recipe-suggestions` — API 2
- `diet-plan` — API 3 plan hebdomadaire
- `diet-analysis` — API 3 analyse nutritionnelle
- `training-program` — API 4

**Valeurs de `status` :** `success` | `error`

**Requêtes MongoDB utiles (mongosh) :**

```javascript
// Connexion
mongosh mongodb://localhost:27017/healthai

// Voir les 10 derniers logs
db.ailogs.find().sort({createdAt: -1}).limit(10).pretty()

// Logs d'erreurs uniquement
db.ailogs.find({status: "error"}).pretty()

// Stats par service
db.ailogs.aggregate([
  {$group: {
    _id: "$service",
    total: {$sum: 1},
    errors: {$sum: {$cond: [{$eq: ["$status","error"]}, 1, 0]}},
    avg_latency: {$avg: "$latencyMs"}
  }}
])

// Taux d'erreur par service (en %)
db.ailogs.aggregate([
  {$group: {
    _id: "$service",
    total: {$sum: 1},
    errors: {$sum: {$cond: [{$eq: ["$status","error"]}, 1, 0]}}
  }},
  {$addFields: {
    error_rate_pct: {$multiply: [{$divide: ["$errors","$total"]}, 100]}
  }}
])

// Latence moyenne des 24 dernières heures
db.ailogs.aggregate([
  {$match: {
    status: "success",
    createdAt: {$gte: new Date(Date.now() - 86400000)}
  }},
  {$group: {
    _id: "$service",
    avg_latency_ms: {$avg: "$latencyMs"},
    count: {$sum: 1}
  }}
])
```

### Collection `recommendations` – Recommandations sauvegardées

```json
{
  "_id": "ObjectId(...)",
  "userId": "cmc...",
  "type": "nutrition",
  "prompt": "Diet plan for goal=lose",
  "content": "Plan alimentaire complet généré...",
  "aiModel": "llama3.2:latest",
  "createdAt": "2026-06-24T10:30:03Z"
}
```

**Valeurs de `type` :** `nutrition` | `activity`

```javascript
// Dernières recommandations d'un utilisateur
db.recommendations.find({userId: "cmc..."}).sort({createdAt: -1}).limit(5)

// Compter les recommandations par type
db.recommendations.countDocuments({type: "nutrition"})
db.recommendations.countDocuments({type: "activity"})
```

---

## 6. Endpoints /metrics par service

Ces endpoints agrègent les données MongoDB en temps réel et retournent les KPIs directement utilisables pour le rapport MSPR.

### GET http://localhost:8001/api/v1/metrics

```json
{
  "service": "food-recognition",
  "kpis": {
    "total_requests": 47,
    "error_count": 2,
    "error_rate_pct": 4.26,
    "avg_latency_ms": 1823.4,
    "max_latency_ms": 5102,
    "min_latency_ms": 312,
    "uptime_seconds": 14400
  },
  "formulas": {
    "error_rate": "error_count / total_requests × 100",
    "avg_response_time": "Σ latencyMs / n requêtes réussies"
  }
}
```

### GET http://localhost:8003/api/v3/metrics

```json
{
  "services": {
    "diet-plan": {
      "total_requests": 23,
      "error_count": 1,
      "error_rate_pct": 4.35,
      "avg_latency_ms": 3241.0
    },
    "diet-analysis": {
      "total_requests": 12,
      "error_count": 0,
      "error_rate_pct": 0.0,
      "avg_latency_ms": 2180.5
    }
  },
  "coherence_rate_pct": 100.0,
  "unsafe_recommendation_rate_pct": 0.0,
  "formulas": {
    "coherence_rate": "plans cohérents avec l'objectif / total × 100",
    "unsafe_rate": "plans hors limites sécurité / total × 100"
  }
}
```

> **Lecture du Coherence Rate :** Un plan est "cohérent" si les calories cibles respectent la direction de l'objectif (lose → déficit, gain → surplus, maintain → équilibre). 100% signifie qu'aucun plan diététique ne contredit l'objectif de l'utilisateur.

> **Lecture du Unsafe Rate :** 0% signifie qu'aucun plan n'a recommandé de calories en dessous de 1 200 kcal/j (limite de sécurité minimale) ni au-dessus de 6 000 kcal/j.

### GET http://localhost:8004/api/v4/metrics

```json
{
  "service": "training-program",
  "kpis": {
    "total_requests": 18,
    "error_count": 0,
    "error_rate_pct": 0.0,
    "avg_latency_ms": 4102.1,
    "max_latency_ms": 7823,
    "total_training_recommendations_generated": 34
  }
}
```

---

## 7. Rapport d'évaluation (MSPR)

Le script d'évaluation mesure les KPIs officiels demandés dans le sujet.

### Lancer l'évaluation

```powershell
cd ai_services

# Mode rapide – TDEE/Diet uniquement (sans Ollama, instantané)
$env:PYTHONIOENCODING = "utf-8"
.\.venv\Scripts\python evaluation/run_evaluation.py --skip-ollama

# Mode complet – toutes les APIs doivent être démarrées
$env:PYTHONIOENCODING = "utf-8"
.\.venv\Scripts\python evaluation/run_evaluation.py
```

### Résultats produits

Les rapports sont sauvegardés dans `evaluation/reports/` :
- `evaluation_report_YYYYMMDD_HHMM.json` — données brutes
- `evaluation_report_YYYYMMDD_HHMM.md` — rapport Markdown lisible

### KPIs mesurés et leurs formules

| KPI | Formule | Seuil bon |
|---|---|---|
| **Précision** | TP / (TP + FP) | > 0.70 |
| **Rappel** | TP / (TP + FN) | > 0.70 |
| **F1-Score** | 2 × P × R / (P + R) | > 0.70 |
| **Coherence Rate** | Plans cohérents / Total × 100 | > 95% |
| **Unsafe Rate** | Plans dangereux / Total × 100 | 0% |
| **Error Rate** | Erreurs / Requêtes × 100 | < 5% |
| **Avg Response Time** | Σ latences / n requêtes | < 5 000 ms |
| **Availability** | Services UP / Total × 100 | > 99% |

### Résultats obtenus (24/06/2026)

| Évaluation | KPI | Résultat |
|---|---|---|
| Diet TDEE | Coherence Rate | **100.0%** |
| Diet TDEE | Unsafe Recommendation Rate | **0.0%** |
| API 1 Food Search | Précision / Rappel / F1 | Mesurable quand API démarrée |
| Disponibilité | Availability | Mesurable quand APIs démarrées |

### Lancer les tests automatisés

```powershell
cd ai_services
.\.venv\Scripts\Activate.ps1

# Tests unitaires de toutes les APIs
pytest api1_food_recognition/tests/ api3_diet_plan/tests/ api4_training_program/tests/ -v

# Avec rapport de couverture HTML
pytest api1_food_recognition/tests/ api3_diet_plan/tests/ api4_training_program/tests/ \
  --cov=api1_food_recognition --cov=api3_diet_plan --cov=api4_training_program \
  --cov-report=html --cov-report=term-missing

# Le rapport HTML s'ouvre dans : htmlcov/index.html
start htmlcov/index.html
```

---

## Résumé des ports

| Service | Port | URL Swagger |
|---|---|---|
| Frontend React | 5173 | `http://localhost:5173` |
| Backend Node.js | 5000 | `http://localhost:5000` |
| API 1 Food Recognition | 8001 | `http://localhost:8001/docs` |
| API 2 Recipe Suggestions | 8002 | `http://localhost:8002/docs` |
| API 3 Diet Plan | 8003 | `http://localhost:8003/docs` |
| API 4 Training Program | 8004 | `http://localhost:8004/docs` |
| PostgreSQL | 55432 | — |
| MongoDB | 27017 | — |
| Ollama | 11434 | `http://localhost:11434` |

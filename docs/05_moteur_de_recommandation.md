# 5. Moteur de recommandation (micro-service + base NoSQL)

## 5.1 Définition

Le moteur de recommandation est constitué de **4 micro-services Python FastAPI**,
**totalement séparés** de l'application principale (backend Express) et déployés
indépendamment. Ils produisent des recommandations personnalisées et **persistent leurs
sorties dans une base NoSQL (MongoDB)**.

```
ai_services/
├── api1_food_recognition/    Port 8001  — LLaVA (vision)
├── api2_recipe_suggestions/  Port 8002  — Llama 3.2 (texte)
├── api3_diet_plan/           Port 8003  — Llama 3.2 + calcul TDEE
├── api4_training_program/    Port 8004  — Llama 3.2 (texte)
└── shared/                   couche d'accès PostgreSQL (lecture profil) + MongoDB (écriture)
```

Chaque service est packagé dans son propre conteneur (voir
[`ai_services/docker-compose.yml`](../ai_services/docker-compose.yml)) et ne partage
**aucun code applicatif** avec le backend : couplage uniquement par HTTP et par la base
MongoDB partagée.

## 5.2 Pourquoi un micro-service séparé ?

- **Isolation des ressources** : l'inférence LLM (CPU/GPU intensive, latence 30 s–3 min)
  ne doit pas bloquer l'API métier temps réel.
- **Scalabilité indépendante** : on peut répliquer uniquement le service sollicité.
- **Tolérance aux pannes** : un microservice IA indisponible renvoie une erreur 503
  gérée par le backend, sans dégrader le suivi nutritionnel/sportif de base.
- **Cycle de vie distinct** : les modèles IA évoluent (nouveaux prompts, nouveaux modèles
  Ollama) sans redéploiement du backend.

## 5.3 Base NoSQL (MongoDB)

Le choix du NoSQL est motivé par la **nature hétérogène et semi-structurée** des sorties
IA (un plan diététique, une recette, un programme sportif et une analyse d'image n'ont
pas le même schéma). MongoDB stocke ces documents JSON sans migration de schéma.

### Collections

#### `recommendations` — recommandations exploitables par l'utilisateur

| Champ | Type | Description |
|-------|------|-------------|
| `_id` | ObjectId | Identifiant Mongo |
| `userId` | string (index) | Référence vers `User.id` (PostgreSQL) |
| `type` | enum `nutrition` \| `activity` \| `general` | Catégorie |
| `prompt` | string | Intitulé / contexte de la demande |
| `content` | string (JSON sérialisé) | Sortie structurée du modèle |
| `aiModel` | string | Modèle ayant produit la réponse (ex. `llama3.2`, `llava`) |
| `tokens` | number? | Coût en tokens (si applicable) |
| `createdAt` / `updatedAt` | date | Horodatage |

Schéma Mongoose (backend) : [`backend/src/models/Recommendation.ts`](../backend/src/models/Recommendation.ts).
Écriture côté microservices : [`ai_services/shared/mongodb.py`](../ai_services/shared/mongodb.py).

#### `ailogs` — journalisation technique (observabilité)

| Champ | Type | Description |
|-------|------|-------------|
| `userId` | string (index) | Utilisateur |
| `requestId` | string | Corrélation requête |
| `service` | string | `food-recognition`, `recipe`, … |
| `status` | enum `success` \| `error` | Issue de l'appel |
| `input` | objet | Paramètres d'entrée (sans données sensibles) |
| `output` | string? | Réponse brute |
| `error` | string? | Message d'erreur éventuel |
| `latencyMs` | number? | Latence d'inférence |
| `createdAt` / `updatedAt` | date | Horodatage |

Schéma : [`backend/src/models/AILog.ts`](../backend/src/models/AILog.ts).

> **Cohérence des données** : les microservices Python et le backend Node.js écrivent dans
> les **mêmes collections** (`recommendations`, `ailogs`) de la même base `healthai`. Le
> backend force l'URI Mongo en IPv4 (`127.0.0.1`) pour éviter la résolution `::1` sous
> Windows qui pointait vers un conteneur distinct (cf. [`backend/src/config/mongodb.ts`](../backend/src/config/mongodb.ts)).

### Sérialisation

Les microservices stockent `content` via `json.dumps(result, ensure_ascii=False)` (JSON
valide, accents préservés), ce qui permet au frontend de **rendre l'historique de façon
structurée** (recettes, plans, analyses) plutôt qu'en texte brut.

## 5.4 Pipeline d'une recommandation

```
1. Client (front) ──▶ Backend /api/ai/...        (auth JWT + quota)
2. Backend ──HTTP──▶ Microservice FastAPI
3. Microservice :
     a. lit le profil utilisateur (PostgreSQL via shared/postgres.py)
     b. construit un prompt personnalisé (objectif, poids, niveau d'activité…)
     c. appelle Ollama (LLaVA ou Llama 3.2) — ou calcul déterministe (macros)
     d. parse/normalise la sortie JSON
     e. enrichit si besoin (Open Food Facts / USDA)
     f. persiste dans MongoDB (recommendations + ailogs)
4. Backend ──▶ Client (réponse normalisée { success, data })
5. Historique consultable via /api/ai/history
```

## 5.5 Consultation de l'historique

- Backend : `GET /api/ai/history?type=&limit=` lit la collection `recommendations`
  (tri décroissant par date) — [`ai.service.ts`](../backend/src/services/ai.service.ts).
- Frontend : onglet **Historique** du Coach, qui parse `content` (JSON ou ancien
  format Python-repr) et l'affiche en cartes structurées.

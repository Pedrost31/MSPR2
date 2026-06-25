# HealthAI Coach — Dossier de livrables (MSPR)

Ce dossier regroupe l'ensemble des livrables de fin de mission, produits dans une
logique industrielle : **documentés, reproductibles et exploitables** par d'autres
équipes (développeurs, data scientists, product managers).

## Sommaire des livrables

| # | Livrable | Fichier |
|---|----------|---------|
| 1 | Architecture, choix des algorithmes & APIs, **benchmark frontend** + justification | [`01_architecture_et_choix_techniques.md`](./01_architecture_et_choix_techniques.md) |
| 2 | Principes d'**ergonomie** et normes d'**accessibilité** (RGAA / WCAG) | [`02_ergonomie_et_accessibilite.md`](./02_ergonomie_et_accessibilite.md) |
| 3 | **Métriques de performance des modèles IA** (précision, rappel, F1) + protocole | [`03_metriques_modeles_ia.md`](./03_metriques_modeles_ia.md) |
| 4 | **API IA** + **documentation OpenAPI** à jour | [`04_api_ia_et_openapi.md`](./04_api_ia_et_openapi.md) · [`openapi.json`](./openapi.json) |
| 5 | **Moteur de recommandation** (micro-service séparé + base NoSQL) | [`05_moteur_de_recommandation.md`](./05_moteur_de_recommandation.md) |
| 6 | **Modèle de données relationnel** documenté + adaptations | [`06_modele_de_donnees.md`](./06_modele_de_donnees.md) |
| 7 | **Tests automatisés** + rapport de couverture | [`07_tests_et_couverture.md`](./07_tests_et_couverture.md) |
| 8 | **Conduite du changement** + accessibilité / adoption | [`08_conduite_du_changement.md`](./08_conduite_du_changement.md) |
| 9 | **Maquettes d'interface responsive** | [`09_maquettes_responsive.md`](./09_maquettes_responsive.md) |

Outils reproductibles fournis :
- [`openapi.json`](./openapi.json) — spec OpenAPI 3.0 régénérable (`npm run openapi:export` côté backend).
- [`../ai_services/evaluation/`](../ai_services/evaluation) — harnais d'évaluation des modèles IA (precision/rappel/F1).

---

## Vue d'ensemble du produit

**HealthAI Coach** est une application de suivi santé (nutrition + activité) enrichie
de recommandations par intelligence artificielle. Elle se compose de trois briques :

```
┌──────────────────┐     HTTPS/JSON      ┌────────────────────┐
│  Frontend React  │ ──────────────────▶ │  Backend Express   │
│  (Vite + TS)     │ ◀────────────────── │  (API REST + JWT)  │
└──────────────────┘                     └─────────┬──────────┘
                                                    │ proxy IA
                          ┌─────────────────────────┼─────────────────────────┐
                          ▼                          ▼                         ▼
                ┌──────────────────┐   ┌──────────────────┐        ┌──────────────────┐
                │ PostgreSQL       │   │ MongoDB (NoSQL)  │        │ 4 microservices  │
                │ (données métier) │   │ recommandations  │        │ IA FastAPI       │
                └──────────────────┘   │ + logs IA        │        │ (Ollama local)   │
                                       └──────────────────┘        └──────────────────┘
```

| Couche | Technologies | Port |
|--------|--------------|------|
| Frontend | React 19, Vite 8, TypeScript, Tailwind CSS 4, Axios, React Router 7, Recharts | 5173 |
| Backend | Node.js, Express 4, TypeScript, Prisma 5, JWT, Zod, Swagger | 5000 |
| Base relationnelle | PostgreSQL 16 (Docker) | 55432 |
| Base NoSQL | MongoDB 7 (Docker) | 27017 |
| Microservices IA | Python 3.12, FastAPI, Ollama (LLaVA + Llama 3.2) | 8001–8004 |

---

## Démarrage reproductible (de zéro)

> Prérequis : Docker Desktop, Node.js ≥ 20, Python ≥ 3.11, [Ollama](https://ollama.com).

### 1. Bases de données

```bash
cd backend
docker compose up -d        # PostgreSQL (55432) + MongoDB (27017)
```

### 2. Backend

```bash
cd backend
npm install
npx prisma migrate deploy   # applique le schéma relationnel
npm run db:seed             # utilisateur de démo : demo@healthai.com
npm run dev                 # http://localhost:5000  — Swagger: /api-docs
```

### 3. Modèles IA (Ollama) + microservices

```bash
ollama pull llava           # vision (reconnaissance d'image)
ollama pull llama3.2        # texte (recettes, diète, sport)

cd ai_services
docker compose up -d --build   # Ollama + 4 APIs (8001–8004)
```

### 4. Frontend

```bash
cd client
npm install
npm run dev                 # http://localhost:5173
```

### 5. Vérification

```bash
curl http://localhost:5000/health          # backend
curl http://localhost:8001/health          # microservice IA 1
# Swagger backend : http://localhost:5000/api-docs
# Swagger microservices : http://localhost:800X/docs
```

---

## Conventions

- Toute l'interface utilisateur et les messages sont en **français**.
- Les identifiants techniques envoyés aux APIs restent en anglais (ex. `mealType: "breakfast"`,
  `goal: "gain"`) ; seul l'affichage est localisé.
- Code commenté en français, commits/PR conventionnels.

# 1. Architecture, choix des algorithmes & APIs, benchmark frontend

## 1.1 Architecture globale

L'application suit une architecture **3-tiers + microservices IA**, avec séparation
nette des responsabilités :

```
Frontend (SPA React)
        │  REST/JSON + JWT
        ▼
Backend Express (API métier, auth, validation, proxy IA)
        ├── PostgreSQL  → données métier structurées (profils, repas, activités)
        ├── MongoDB     → recommandations IA + logs (NoSQL, semi-structuré)
        └── 4 microservices FastAPI (Python) → inférence IA via Ollama (local)
```

### Justification du découpage

- **Le backend ne fait pas d'inférence IA lui-même** : il agit comme *passerelle*
  (authentification, quotas, validation, journalisation) et délègue aux microservices.
  Cela isole les charges lourdes (GPU/CPU des LLM) du chemin critique de l'API métier.
- **Microservices IA indépendants** : chaque capacité (vision, recettes, diète, sport)
  est déployable et scalable séparément, et tombe en panne sans impacter les autres
  (résilience). Communication HTTP synchrone, sans couplage de code.
- **Deux bases de données** : le relationnel (PostgreSQL) pour les données fortement
  structurées et transactionnelles ; le NoSQL (MongoDB) pour les sorties IA hétérogènes
  (JSON variable selon le type de recommandation). Voir [livrable 5](./05_moteur_de_recommandation.md)
  et [livrable 6](./06_modele_de_donnees.md).

---

## 1.2 Choix des algorithmes IA

| Capacité | Modèle / algorithme | Pourquoi ce choix |
|----------|---------------------|-------------------|
| Reconnaissance alimentaire (image) | **LLaVA** (vision-langage, via Ollama) | Modèle multimodal open source, gratuit, exécuté **en local** (pas de fuite de données image vers un tiers, pas de coût d'API). |
| Génération de recettes / diète / sport | **Llama 3.2** (via Ollama) | LLM open source performant en français, local, sortie JSON contrôlable par prompt. |
| Calcul des besoins caloriques | **Mifflin-St Jeor** (déterministe) | Formule scientifique de référence pour le BMR/TDEE. **Aucun LLM** : résultat exact, reproductible, instantané. |
| Enrichissement nutritionnel | **Open Food Facts** + **USDA FoodData Central** | Bases nutritionnelles ouvertes ; complètent les valeurs quand le LLM vision ne les estime pas (fiabilité du chiffre). |
| Catalogue d'exercices / recettes | **Wger**, **TheMealDB** | APIs publiques gratuites pour enrichir les programmes. |

### Détail : calcul calorique (déterministe, non-IA générative)

Implémenté dans [`ai_services/api3_diet_plan/services/tdee_calculator.py`](../ai_services/api3_diet_plan/services/tdee_calculator.py).

1. **BMR** (Mifflin-St Jeor) :
   `10·poids(kg) + 6.25·taille(cm) − 5·âge + s` avec `s = +5` (homme) / `−161` (femme).
2. **TDEE** = `BMR × facteur d'activité` (1.2 sédentaire → 1.9 très actif).
3. **Calories cibles** = `TDEE + ajustement objectif` (−500 perte / 0 maintien / +300 prise),
   plancher à 1200 kcal.
4. **Macros** : protéines `1.6–2.0 g/kg` selon l'objectif, lipides `0.9 g/kg`, glucides = reste.

> Ce choix garantit que la partie « chiffrée » des recommandations est **vérifiable et
> reproductible**, tandis que le LLM n'intervient que sur la partie rédactionnelle/créative.

### Stratégie de fiabilisation de la reconnaissance d'image

LLaVA reconnaît bien l'aliment mais estime mal les calories. Le microservice applique
donc une chaîne de fiabilisation (voir [`food_recognition.py`](../ai_services/api1_food_recognition/routes/food_recognition.py)) :

1. Normalisation des valeurs en nombres (évite les `NaN` issus de chaînes type `"12 g"`).
2. Si les calories sont absentes/nulles → enrichissement par **Open Food Facts** puis
   **USDA** à partir du nom détecté (valeurs pour 100 g, source tracée dans `nutrition_basis`).

---

## 1.3 APIs utilisées

### APIs internes
- **API REST backend** (Express) — voir [livrable 4](./04_api_ia_et_openapi.md) et [`openapi.json`](./openapi.json).
- **4 microservices FastAPI** (`/docs` Swagger auto-généré sur chaque service).

### APIs externes (toutes gratuites / open source)
| API | Usage | Clé requise |
|-----|-------|-------------|
| Ollama | Inférence LLM locale (LLaVA, Llama 3.2) | Non (local) |
| Open Food Facts | Données nutritionnelles par nom/code-barres | Non |
| USDA FoodData Central | Données nutritionnelles | Clé gratuite (DEMO_KEY possible) |
| TheMealDB | Recherche de recettes | Non |
| Wger | Catalogue d'exercices | Non |
| OpenAI *(optionnel)* | Recommandations texte génériques (`/ai/recommend`) ; **fallback mock** si absent | Optionnelle |

---

## 1.4 Benchmark des solutions frontend

Objectif : SPA moderne, responsive, rapide à charger, maintenable par une petite équipe,
avec un écosystème mature.

### Frameworks UI comparés

| Critère | **React 19** *(retenu)* | Vue 3 | Angular 18 | Svelte 5 |
|--------|--------------------------|-------|------------|----------|
| Courbe d'apprentissage | Moyenne | Faible | Élevée | Faible |
| Écosystème / recrutement | ★★★★★ | ★★★★ | ★★★★ | ★★★ |
| Performance runtime | ★★★★ | ★★★★ | ★★★ | ★★★★★ |
| Maturité TypeScript | ★★★★★ | ★★★★ | ★★★★★ | ★★★★ |
| Composants & libs (graphes, icônes) | ★★★★★ | ★★★★ | ★★★★ | ★★★ |
| Adapté à une SPA santé/dashboard | ★★★★★ | ★★★★ | ★★★★ | ★★★★ |

**Choix : React 19.** Justification : écosystème le plus large (facilite la reprise par
d'autres équipes et le recrutement), excellent support TypeScript, hooks pour une logique
d'état lisible, et compatibilité directe avec Recharts (graphes) et lucide-react (icônes).
Angular jugé trop lourd pour le périmètre ; Svelte/Vue écartés pour des raisons
d'écosystème et de mutualisation des compétences.

### Outil de build comparé

| Critère | **Vite 8** *(retenu)* | Create React App | Webpack (manuel) | Next.js |
|--------|------------------------|------------------|------------------|---------|
| Démarrage dev (HMR) | ★★★★★ (esbuild) | ★★ | ★★★ | ★★★★ |
| Config | Minimale | Opaque | Verbeuse | Moyenne |
| Build prod | ★★★★★ | ★★★ | ★★★★ | ★★★★ |
| SSR nécessaire ? | Non (SPA) | Non | Non | Oui (overkill) |

**Choix : Vite.** HMR quasi-instantané, configuration minimale, build optimisé. Next.js
écarté car le SSR/SEO n'est pas requis (application authentifiée, derrière login).

### Styling comparé

| Critère | **Tailwind CSS 4** *(retenu)* | CSS Modules | styled-components | MUI |
|--------|-------------------------------|-------------|-------------------|-----|
| Vitesse de prototypage | ★★★★★ | ★★★ | ★★★ | ★★★★ |
| Cohérence design system | ★★★★★ | ★★★ | ★★★★ | ★★★★★ |
| Poids du bundle | ★★★★★ (purge) | ★★★★ | ★★★ | ★★ |
| Dark mode natif | ★★★★★ | ★★★ | ★★★★ | ★★★★ |

**Choix : Tailwind CSS 4.** Design system cohérent via classes utilitaires, dark mode
intégré (`dark:`), purge automatique → bundle léger. MUI écarté pour éviter un style
« générique » et un bundle lourd.

### Bibliothèques complémentaires retenues
- **Axios** : client HTTP avec intercepteurs (injection JWT, refresh automatique sur 401).
- **React Router 7** : routage SPA.
- **Recharts** : graphiques (courbes apports/dépenses caloriques).
- **react-hot-toast** : notifications non bloquantes (succès/erreur).
- **lucide-react** : pictogrammes cohérents et accessibles.

---

## 1.5 Justification synthétique

L'ensemble vise **gratuité, souveraineté des données (IA locale), maintenabilité et
performance**. Les choix privilégient des technologies à fort écosystème pour qu'une autre
équipe puisse reprendre le projet sans expertise rare, et isolent l'IA (coûteuse, lente,
faillible) du cœur transactionnel de l'application.

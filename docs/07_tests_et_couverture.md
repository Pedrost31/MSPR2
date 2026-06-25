# 7. Tests automatisés & rapport de couverture

Stratégie de test à trois niveaux, couvrant **l'interface utilisateur**, les **services
critiques** (backend) et le **moteur de recommandation** (microservices IA).

| Périmètre | Framework | Type | Statut |
|-----------|-----------|------|--------|
| Backend (services critiques) | Jest + Supertest + ts-jest | Intégration HTTP | ✅ En place |
| Microservices IA (moteur de reco) | Pytest + httpx + mocks | Unitaire / contrat | ✅ En place |
| Frontend (UI) | Vitest + Testing Library | Composant / hook | ⚙️ À mettre en place (setup fourni ci-dessous) |

---

## 7.1 Backend — services critiques (Jest + Supertest)

Configuration : [`backend/jest.config.js`](../backend/jest.config.js) (preset `ts-jest`,
environnement Node, collecte de couverture sur `src/**` hors tests/docs/seed).

Suites présentes ([`backend/src/__tests__/`](../backend/src/__tests__)) :

| Fichier | Couvre |
|---------|--------|
| `auth.test.ts` | Inscription, connexion, refresh token, logout/révocation, protection des routes (401). |
| `food.test.ts` | CRUD entrées alimentaires + règles métier. |
| `activity.test.ts` | CRUD activités + résumés. |

Ces tests valident le **flux complet** (HTTP → contrôleur → service → Prisma → DB), c.-à-d.
les chemins critiques d'authentification et de persistance.

### Lancer les tests + couverture

```bash
cd backend
docker compose up -d            # PostgreSQL requis (tests d'intégration réels)
npm test                        # exécution
npm run test:coverage           # rapport de couverture
```

Le rapport est généré dans `backend/coverage/` :
- `coverage/lcov-report/index.html` — rapport navigable.
- `coverage/lcov.info` — format LCOV (intégrable en CI / SonarQube).

---

## 7.2 Microservices IA — moteur de recommandation (Pytest)

Chaque service possède sa suite avec **toutes les dépendances externes mockées** (Ollama,
Open Food Facts, USDA, MongoDB) → tests rapides, déterministes, sans réseau ni LLM.

| Service | Tests | Points vérifiés |
|---------|-------|-----------------|
| API 1 — Reconnaissance | `api1_food_recognition/tests/` | Analyse base64 (succès/erreurs 422/503), recherche, code-barres, journalisation, health. |
| API 2 — Recettes | `api2_recipe_suggestions/tests/` | Suggestions, génération, validation du contrat JSON. |
| API 3 — Diète | `api3_diet_plan/tests/` | Calcul BMR/TDEE/macros (déterministe), plan, analyse. |
| API 4 — Entraînement | `api4_training_program/tests/` | Programme, séance express, catalogue. |

> Volume indicatif (cf. `ai_services/README.md`) : ~136 tests au total.

### Lancer les tests + couverture

```bash
cd ai_services
pip install pytest pytest-asyncio pytest-mock pytest-cov httpx

# Tous les services
pytest api1_food_recognition/tests api2_recipe_suggestions/tests \
       api3_diet_plan/tests api4_training_program/tests -v

# Avec couverture (exemple API 1)
pytest api1_food_recognition/tests \
       --cov=api1_food_recognition --cov-report=html --cov-report=term
```

Le rapport HTML est généré dans `htmlcov/index.html`.

### Exemple de test (contrat + erreurs)

Extrait de `api1_food_recognition/tests/test_food_recognition.py` : vérifie le code 422
sur base64 vide/invalide, le 503 si Ollama échoue, et la **journalisation** systématique
(`ailogs` + `recommendations`).

---

## 7.3 Frontend — interface utilisateur (Vitest + Testing Library)

> Statut : **à mettre en place**. L'outillage recommandé et la procédure sont fournis ci-dessous
> pour une adoption immédiate.

### Installation

```bash
cd client
npm install -D vitest @testing-library/react @testing-library/jest-dom \
               @testing-library/user-event jsdom
```

### Configuration (`vite.config.ts`)

```ts
/// <reference types="vitest" />
export default defineConfig({
  // …plugins existants
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
    coverage: { provider: 'v8', reporter: ['text', 'html', 'lcov'] },
  },
});
```

`src/test/setup.ts` :
```ts
import '@testing-library/jest-dom';
```

Script `package.json` :
```json
"test": "vitest",
"test:coverage": "vitest run --coverage"
```

### Cibles de test prioritaires (UI critique)

| Composant / logique | Ce qu'on teste |
|---------------------|----------------|
| `services/mappers.ts` | `estimateIntake`, `estimateBurnGoal`, `burnGoalFromBmr` (logique pure → tests unitaires faciles et à fort ROI). |
| `pages/Login.tsx` | Bascule connexion/inscription, soumission, états de chargement. |
| `pages/FoodLog.tsx` | Ajout/suppression d'un repas, analyse photo (mock `aiService`). |
| `pages/Coach.tsx` | Parsing/affichage de l'historique, application des macros. |
| `context/AppContext.tsx` | Login/logout, fetch user, suppression de compte. |

### Exemple (logique pure — sans dépendance)

```ts
import { describe, it, expect } from 'vitest';
import { estimateBurnGoal, burnGoalFromBmr } from '../services/mappers';

describe('objectifs caloriques', () => {
  it('borne l\'objectif de calories brûlées', () => {
    expect(burnGoalFromBmr(1700, 'maintain')).toBeGreaterThanOrEqual(150);
    expect(burnGoalFromBmr(1700, 'maintain')).toBeLessThanOrEqual(900);
  });
  it('exige plus d\'effort pour la perte que la prise', () => {
    expect(estimateBurnGoal({ weight: 80, height: 180, age: 25, goal: 'lose' }))
      .toBeGreaterThan(estimateBurnGoal({ weight: 80, height: 180, age: 25, goal: 'gain' }));
  });
});
```

---

## 7.4 Intégration continue (recommandation)

Pipeline type (GitHub Actions / GitLab CI) :

1. **lint** : `npm run lint` (front + back).
2. **backend** : `npm run test:coverage` (PostgreSQL en service CI).
3. **microservices** : `pytest --cov` sur les 4 services.
4. **frontend** : `vitest run --coverage`.
5. **build** : `npm run build` (front) + `tsc` (back) + `docker build` (microservices).
6. Publication des rapports `lcov` (couverture agrégée, ex. Codecov/SonarQube).

---

## 7.5 Synthèse de couverture

| Couche | Commande | Rapport |
|--------|----------|---------|
| Backend | `npm run test:coverage` | `backend/coverage/lcov-report/index.html` |
| Microservices IA | `pytest --cov --cov-report=html` | `htmlcov/index.html` |
| Frontend | `npm run test:coverage` | `client/coverage/index.html` |

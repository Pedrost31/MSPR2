# 6. Modèle de données relationnel & adaptations

## 6.1 Vue d'ensemble

Deux bases coexistent, par nature de donnée :

- **PostgreSQL** (relationnel, via Prisma) : données métier structurées et transactionnelles.
- **MongoDB** (NoSQL) : sorties IA hétérogènes (cf. [livrable 5](./05_moteur_de_recommandation.md)).

Source de vérité du schéma relationnel : [`backend/prisma/schema.prisma`](../backend/prisma/schema.prisma).

## 6.2 Modèle relationnel (PostgreSQL)

```
                ┌─────────────────────────────┐
                │            User             │
                │ id (PK, uuid)               │
                │ email (unique)              │
                │ password                    │
                │ name, role                  │
                │ age, weight, height, gender │
                │ activityLevel, goal         │
                │ dailyCalorieTarget          │
                │ avatarUrl, createdAt, ...   │
                └──────────────┬──────────────┘
       1                       │ 1
       ├───────────────┬───────┼───────────────┬───────────────┐
       │ N             │ N     │ 1 (optionnel) │ N             │ N
       ▼               ▼       ▼               ▼               ▼
 ┌───────────┐  ┌─────────────┐ ┌───────────┐ ┌──────────────┐ ┌──────────────┐
 │ FoodEntry │  │ActivityEntry│ │GoalSettings│ │ RefreshToken │ │ HealthMetric │
 └───────────┘  └─────────────┘ └───────────┘ └──────────────┘ └──────────────┘
```

### Tables

| Table | Rôle | Points clés |
|-------|------|-------------|
| `User` | Profil + identité | `email` unique ; champs santé optionnels (remplis à l'onboarding) ; `dailyCalorieTarget`. |
| `FoodEntry` | Repas enregistrés | `calories` + macros optionnelles ; `mealType` (enum) ; index `(userId, date)`. |
| `ActivityEntry` | Activités sportives | `duration` (min), `caloriesBurned`, `type` (enum) ; index `(userId, date)`. |
| `GoalSettings` | Objectifs détaillés | Relation **1-1** avec User (`userId` unique) ; cibles macros + séances/sem. |
| `HealthMetric` | Mesures corporelles | Historique poids/IMC/masse grasse ; index `(userId, measuredAt)`. |
| `RefreshToken` | Sessions JWT | Rotation des refresh tokens ; révocation au logout. |

### Énumérations

`Role(user, admin)` · `Gender(male, female, other)` ·
`ActivityLevel(sedentary, light, moderate, active, very_active)` ·
`Goal(lose, maintain, gain)` · `MealType(breakfast, lunch, dinner, snack)` ·
`ActivityType(cardio, strength, flexibility, sports, other)`.

### Intégrité référentielle

Toutes les relations enfant utilisent **`onDelete: Cascade`** : la suppression d'un
compte (`DELETE /api/users/me`) efface automatiquement repas, activités, objectifs,
métriques et tokens associés (conformité RGPD — droit à l'effacement).

## 6.3 Adaptations réalisées sur le modèle existant

Le modèle de la MSPR précédente (suivi santé) a été étendu pour intégrer l'IA et les
nouveaux besoins produit. Adaptations documentées :

| # | Adaptation | Emplacement | Motivation |
|---|------------|-------------|------------|
| 1 | Ajout des **collections NoSQL** `recommendations` & `ailogs` | MongoDB | Stocker des sorties IA au schéma variable sans alourdir le relationnel ni migrer à chaque évolution de prompt. |
| 2 | `User.dailyCalorieTarget` exploité comme **limite calorique** côté front | PostgreSQL | Recalculé dynamiquement (Mifflin-St Jeor) selon l'objectif. |
| 3 | **Objectif de calories brûlées** persté côté client (`localStorage`) | Frontend | Donnée d'affichage dérivée du BMR ; évite une migration relationnelle pour un champ purement UI. *(Évolution possible : colonne dédiée si besoin de synchronisation multi-appareils.)* |
| 4 | Champs santé `User` rendus **optionnels** | PostgreSQL | Permettre l'inscription puis l'onboarding progressif. |
| 5 | `aiModel` / `tokens` dans `recommendations` | MongoDB | Traçabilité du modèle et du coût d'inférence (audit, observabilité). |
| 6 | `nutrition_basis` ajouté aux analyses d'image | MongoDB (`content`) | Tracer la source des valeurs nutritionnelles (LLaVA vs Open Food Facts/USDA). |

## 6.4 Lien relationnel ↔ NoSQL

Le rattachement se fait par **`userId`** (UUID du `User` PostgreSQL) stocké comme clé
étrangère logique dans les documents MongoDB. Il n'y a pas de contrainte FK inter-bases
(impossible) ; la cohérence est assurée applicativement (le backend authentifie l'utilisateur
avant toute écriture IA).

## 6.5 Migrations & seed (reproductible)

```bash
cd backend
npx prisma migrate deploy     # applique les migrations
npm run db:seed               # données de démo (demo@healthai.com)
npx prisma studio             # exploration visuelle du schéma
```

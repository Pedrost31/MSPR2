# 9. Maquettes d'interface responsive

Spécifications des maquettes responsive de HealthAI Coach. Ces maquettes correspondent aux
écrans réellement implémentés (React + Tailwind) ; les wireframes ci-dessous documentent la
structure et le comportement adaptatif pour reprise par un designer (Figma) ou un développeur.

## 9.1 Système de design

| Élément | Valeur |
|---------|--------|
| Couleur primaire | Emerald (`#10b981`) |
| Couleur secondaire / accent | Orange (`#f97316`) — dépense calorique |
| Neutres | Slate (50 → 900) |
| Thèmes | Clair **et** sombre (commutables) |
| Typographie | Sans-serif système, hiérarchie `text-2xl` (titres) → `text-xs` |
| Rayons | `rounded-xl` / `rounded-2xl` (cartes), `rounded-lg` (champs) |
| Composants | `Button`, `Input`, `Select`, `Card`, `ProgressBar`, `Slider`, `Tooltip` |
| Icônes | `lucide-react` |

## 9.2 Points de rupture (breakpoints)

| Breakpoint | Largeur | Comportement |
|------------|---------|--------------|
| Mobile (défaut) | < 640 px | 1 colonne, navigation basse fixe (`BottomNav`). |
| `sm` | ≥ 640 px | Boutons/formulaires en ligne. |
| `md` | ≥ 768 px | Grilles 2 colonnes partielles. |
| `lg` | ≥ 1024 px | **Barre latérale** (`Sidebar`), grille tableau de bord 2 colonnes, `BottomNav` masquée. |

## 9.3 Wireframes par écran

### Connexion / Inscription (`Login`)

```
MOBILE / DESKTOP (carte centrée)
┌──────────────────────────────┐
│            HealthAI           │
│   Connexion   |  Inscription  │
│  ┌────────────────────────┐  │
│  │ ✉  E-mail               │  │
│  ├────────────────────────┤  │
│  │ 🔒 Mot de passe      👁 │  │
│  └────────────────────────┘  │
│  [      Se connecter      ]  │
│  Pas encore de compte ? …    │
└──────────────────────────────┘
```

### Onboarding (3 étapes)

```
┌──────────────────────────────┐
│ HealthAI                      │
│ ▰▰▰▱▱▱  Étape 1 sur 3         │
│ 👤 Parlez-nous de vous         │
│  Âge  [   ]   Sexe [ ▼ ]      │
│                               │
│            [ Continuer → ]    │
└──────────────────────────────┘
Étape 2 : Poids / Taille / Niveau d'activité
Étape 3 : Objectif (Perdre/Maintenir/Prendre) + Objectif calorique (slider)
```

### Tableau de bord (`Dashboard`)

```
MOBILE (1 colonne)                 DESKTOP ≥ lg (2 colonnes)
┌───────────────────────┐          ┌─────────┬──────────────────────────────┐
│  Bonjour {prénom} !   │          │         │  Bonjour {prénom} !          │
│  💪 message motivation │          │ Sidebar │  💪 motivation               │
├───────────────────────┤          │ ─────── ├───────────────┬──────────────┤
│ Calories  | Limite     │          │ Accueil │ Calories card │ Actif | Séances│
│ ▰▰▰▰▱ 1450/2000        │          │ Repas   │ (col-span 2)  │              │
│ Brûlées   | Objectif   │          │ Activité├───────────────┴──────────────┤
├───────────────────────┤          │ Coach   │ Objectif | Mensurations (IMC) │
│ Actif | Séances        │          │ Profil  ├──────────────────────────────┤
│ Objectif | Mensurations│          │ ─────── │ Graphe semaine (apports/dép.) │
│ Graphe semaine         │          │ 🌙 thème│                              │
├───────────────────────┤          └─────────┴──────────────────────────────┘
│ [Accueil][Repas][…][Profil] (BottomNav fixe)
```

### Journal alimentaire (`FoodLog`)

```
┌───────────────────────────────┐
│ Journal alimentaire   1450 kcal│
│ Ajout rapide :                 │
│ [🌮 Petit-déj][🌅 Déj][🌙 Dîner]│
│ [        +        ]            │
│ [ ✨ Photo repas IA ]          │
│ ── Repas groupés par type ──   │
│ ☕ Petit-déjeuner    320 kcal  │
│   • Flocons d'avoine    🗑      │
└───────────────────────────────┘
```

### Coach IA (`Coach`)

```
┌───────────────────────────────┐
│ 🤖 Coach IA                    │
│ [Recettes][Diète][Sport][Hist.]│
│ ┌───────────────────────────┐ │
│ │ Type de repas [ ▼ ]       │ │
│ │ [ Suggérer 3 recettes ]   │ │
│ └───────────────────────────┘ │
│ Carte recette : kcal/P/G/L,    │
│ ingrédients, préparation       │
│ Diète → macros + [Appliquer]   │
│ Historique → cartes repliables │
└───────────────────────────────┘
```

### Profil (`Profile`)

```
┌─────────────────┬─────────────────┐
│ Votre profil    │ Vos statistiques│
│ Âge/Poids/Taille│ Repas | Activités│
│ Objectif        │ 🌙 thème (mobile)│
│ [Modifier]      │ [Se déconnecter] │
│ Édition :       │ Supprimer compte │
│  + [Calculer IA]│                  │
└─────────────────┴─────────────────┘
```

## 9.4 États & retours visuels

- **Chargement IA** : overlay plein écran + spinner + texte « L'IA travaille… ».
- **Vide** : écrans « Aucun repas/activité enregistré » avec illustration + incitation.
- **Notifications** : toasts succès (vert) / erreur (rouge) en haut.
- **Progression** : `ProgressBar` passe au rouge si la limite calorique est dépassée.

## 9.5 Production des maquettes haute-fidélité

Les wireframes ci-dessus servent de référence structurelle. Pour une maquette Figma
haute-fidélité ou des captures d'écran réelles :

```bash
cd client && npm run dev        # http://localhost:5173
# Capturer chaque écran en vues mobile (375px) et desktop (1440px)
```

> Les tokens de design (couleurs, espacements, composants) sont directement dérivables du
> code Tailwind, garantissant la cohérence maquette ↔ implémentation.

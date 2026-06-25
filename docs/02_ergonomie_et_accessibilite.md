# 2. Ergonomie & accessibilité

## 2.1 Principes d'ergonomie appliqués

L'interface suit les **heuristiques de Nielsen** et une logique *mobile-first*.

| Principe | Mise en œuvre dans HealthAI Coach |
|----------|-----------------------------------|
| **Visibilité de l'état du système** | Indicateurs de chargement (spinner plein écran pendant l'IA), notifications `react-hot-toast` pour chaque action (succès/erreur), barres de progression caloriques. |
| **Correspondance avec le monde réel** | Vocabulaire métier en français (« Calories brûlées », « Apports »), emojis de repas, libellés d'objectifs explicites. |
| **Contrôle & liberté** | Boutons *Annuler* sur tous les formulaires, confirmation avant suppression (repas, compte). |
| **Cohérence & standards** | Composants UI réutilisables (`Button`, `Input`, `Select`, `Card`, `ProgressBar`) → style et comportements uniformes. |
| **Prévention des erreurs** | Validation des champs (`min`/`max`, `required`, types), bornage des valeurs caloriques, rejet des photos non reconnues. |
| **Reconnaissance plutôt que rappel** | Ajout rapide (boutons préremplis repas/activités), valeurs calculées automatiquement selon le profil. |
| **Flexibilité** | Thème clair/sombre commutable, ajustement manuel ou assisté par IA des objectifs. |
| **Design minimaliste** | Mise en page aérée (Tailwind), hiérarchie typographique claire, une action principale par écran. |
| **Aide à la récupération d'erreur** | Messages d'erreur explicites et localisés (ex. « Calories non estimées, saisissez-les manuellement »). |

### Navigation responsive (mobile-first)

- **Mobile (< 1024 px)** : barre de navigation **basse** fixe (`BottomNav`), pouce-friendly.
- **Desktop (≥ 1024 px)** : **barre latérale** (`Sidebar`) persistante.
- Grilles adaptatives (`dashboard-grid`, `page-content-grid`) qui passent de 1 à 2 colonnes.

### Parcours utilisateur structuré

1. **Connexion / inscription** → 2. **Onboarding** en 3 étapes (profil, mensurations,
objectif) avec barre de progression → 3. **Tableau de bord** (synthèse + graphe semaine) →
4. modules **Repas**, **Activité**, **Coach IA**, **Profil**.

---

## 2.2 Normes d'accessibilité (RGAA / WCAG 2.1)

Objectif : viser le niveau **WCAG 2.1 AA** / **RGAA 4** (référentiel français).

### Mesures déjà en place

| Critère WCAG | Mise en œuvre |
|--------------|---------------|
| **1.4.3 Contraste** | Palette Tailwind `slate/emerald` à fort contraste ; thème sombre dédié (`dark:`). |
| **1.4.10 Reflow** | Mise en page responsive sans défilement horizontal jusqu'à 320 px. |
| **2.1.1 Clavier** | Éléments natifs (`button`, `input`, `select`, liens `NavLink`) → navigables au clavier par défaut. |
| **2.4.7 Focus visible** | Styles de focus conservés (anneaux `ring` Tailwind). |
| **3.2.4 Cohérence** | Composants identiques d'un écran à l'autre. |
| **3.3.1 / 3.3.3 Erreurs** | Champs requis, bornes, messages d'erreur explicites. |
| **4.1.2 Nom/rôle/valeur** | Usage d'éléments HTML sémantiques natifs (pas de `div` cliquable à la place de `button`). |
| **`lang`** | `<html lang="fr">` (langue de la page déclarée). |

### Audit & points d'amélioration identifiés (plan de mise en conformité AA)

> Documentés honnêtement pour un suivi industriel.

| Critère | Constat | Action recommandée |
|---------|---------|--------------------|
| **1.1.1 Contenu non textuel** | Boutons icône seule (ex. ajout, suppression, thème) sans libellé textuel. | Ajouter `aria-label` explicite (ex. `aria-label="Supprimer ce repas"`). |
| **1.3.1 / 3.3.2 Étiquettes** | Sur `Login`, les `<label>` ne sont pas liés aux `<input>` par `htmlFor`/`id`. | Associer `htmlFor`+`id` (ou englober l'input) pour les lecteurs d'écran. |
| **4.1.3 Messages d'état** | Les toasts ne sont pas annoncés aux lecteurs d'écran. | Ajouter une région `aria-live="polite"` (option de `react-hot-toast`). |
| **2.4.1 Contournement** | Pas de lien d'évitement. | Ajouter un « Aller au contenu principal ». |
| **1.4.11 Contraste éléments** | Vérifier les états désactivés / placeholders. | Audit automatisé (axe-core) + ajustements. |
| **Icônes décoratives** | SVG `lucide-react` exposés. | `aria-hidden="true"` sur les icônes purement décoratives. |

### Outillage d'audit recommandé (reproductible)

```bash
# Audit automatisé en CI (composants React)
npm install -D @axe-core/playwright   # ou jest-axe avec Vitest

# Audit page complète
# Lighthouse (Chrome DevTools) → score Accessibilité
npx lighthouse http://localhost:5173 --only-categories=accessibility
```

Compléter par un **test manuel** : navigation 100 % clavier (Tab/Shift+Tab/Entrée/Échap)
et lecteur d'écran (NVDA / VoiceOver).

---

## 2.3 Synthèse

L'application part d'une base saine (HTML sémantique, responsive, contrastes, thème
sombre, langue déclarée) qui couvre une large part du niveau A. Le passage en **AA/RGAA**
nécessite principalement l'ajout d'**étiquetage accessible** (`aria-label`, association
label/champ) et de **régions live** — actions ciblées, peu coûteuses, listées ci-dessus
et reprises dans la [conduite du changement](./08_conduite_du_changement.md).

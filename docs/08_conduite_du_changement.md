# 8. Conduite du changement & accessibilité de la solution

Ce document explicite les choix opérés pour **assurer l'accessibilité de la solution** et
**accompagner son adoption** auprès de profils d'utilisateurs variés.

## 8.1 Profils d'utilisateurs (personas) ciblés

| Persona | Besoin principal | Réponse produit |
|---------|------------------|-----------------|
| **Utilisateur grand public** (peu technophile) | Suivre simplement son alimentation/sport | Parcours guidé, ajout rapide, photo repas IA, langue française, vocabulaire simple. |
| **Sportif / objectif précis** | Objectifs caloriques fiables | Calcul Mifflin-St Jeor, macros, programmes IA adaptés à l'objectif. |
| **Développeur / partenaire** | Intégrer l'API | OpenAPI à jour, Swagger interactif, exemples, microservices documentés. |
| **Data scientist** | Évaluer/améliorer l'IA | Harnais d'évaluation, logs `ailogs`, modèles open source remplaçables. |
| **Product manager** | Piloter l'adoption | Métriques de latence/usage (MongoDB), historique des recommandations. |
| **Personne en situation de handicap** | Utiliser l'app avec assistance | Base accessible (HTML sémantique, contrastes, clavier) + plan AA. |

## 8.2 Accessibilité comme levier d'adoption

L'accessibilité n'est pas qu'une conformité : elle élargit le public atteignable. Les
mesures (détaillées en [livrable 2](./02_ergonomie_et_accessibilite.md)) sont intégrées
au backlog avec une priorisation **effort/impact** :

| Action | Effort | Impact | Priorité |
|--------|--------|--------|----------|
| `aria-label` sur boutons icône | Faible | Élevé | P1 |
| Association `label`/`input` (formulaires) | Faible | Élevé | P1 |
| Région `aria-live` pour les toasts | Faible | Moyen | P2 |
| Lien d'évitement + audit axe-core en CI | Moyen | Moyen | P2 |
| Test lecteur d'écran + clavier | Moyen | Élevé | P2 |

## 8.3 Stratégie d'accompagnement du changement

### a) Documentation multi-niveaux (déjà produite)

- **Utilisateur final** : parcours auto-explicatif (onboarding, libellés clairs, aide contextuelle).
- **Technique** : ce dossier `docs/`, README backend / microservices, Swagger.
- **Démarrage reproductible** : section dédiée du [README des livrables](./README.md).

### b) Données de démonstration

Un utilisateur de démo (`demo@healthai.com`, via `npm run db:seed`) permet de **prendre en
main l'application immédiatement** sans saisie initiale — utile pour les formations et démos.

### c) Déploiement progressif recommandé

1. **Bêta interne** : équipe projet + quelques utilisateurs pilotes ; collecte de retours.
2. **Itération** : priorisation des correctifs accessibilité (P1) et UX selon retours.
3. **Ouverture progressive** : montée en charge maîtrisée (les microservices IA scalent
   indépendamment).
4. **Boucle de feedback** : exploitation des `ailogs` (latence, taux d'erreur IA) et de
   l'historique pour ajuster prompts et seuils.

### d) Conduite du changement pour les équipes techniques

| Risque d'adoption | Mitigation |
|-------------------|------------|
| Méconnaissance de l'architecture microservices | Schémas + doc d'architecture ([livrable 1](./01_architecture_et_choix_techniques.md)). |
| Peur de l'IA « boîte noire » | Modèles **open source locaux** (LLaVA/Llama), logs traçables, calculs déterministes pour les chiffres clés. |
| Latence IA perçue comme un bug | Indicateurs de chargement explicites + documentation des temps attendus. |
| Reprise du code par une autre équipe | Technologies à fort écosystème (React/Express/FastAPI), tests, conventions, OpenAPI. |
| Données sensibles (santé/images) | Inférence **locale** (pas d'envoi à un tiers), suppression de compte en cascade (RGPD). |

### e) Indicateurs de succès de l'adoption (à suivre)

- Taux de complétion de l'onboarding.
- Nombre de recommandations IA générées / utilisateur actif.
- Taux d'erreur et latence IA (depuis `ailogs`).
- Score d'accessibilité Lighthouse (objectif ≥ 90).
- Rétention à 7 / 30 jours.

## 8.4 Conformité & éthique

- **Souveraineté des données** : IA exécutée localement (Ollama), aucune image/profil
  transmis à un service tiers propriétaire.
- **RGPD** : droit à l'effacement (suppression de compte → cascade sur toutes les données ;
  nettoyage de l'objectif local côté client).
- **Transparence** : le modèle ayant produit chaque recommandation est tracé (`aiModel`),
  et la source des valeurs nutritionnelles est indiquée (`nutrition_basis`).
- **Gratuité / réversibilité** : technologies open source, pas de dépendance commerciale
  bloquante (OpenAI seulement optionnel, avec fallback).

# Rapport d'Évaluation des API IA – HealthAI Coach

**Date :** 2026-06-24 18:37  
**Modèles IA :** Ollama LLaVA (vision) · Ollama Llama3.2 (NLP)  
**APIs données :** Open Food Facts · USDA FoodData Central · TheMealDB · Wger  

---

## 1. Disponibilité des services

| API | Disponibilité | Latence moy. |
|-----|:---:|---:|
| API 1 – Food Recognition | ❌ 0% | 0 ms |
| API 2 – Recipe Suggestions | ❌ 0% | 0 ms |
| API 3 – Diet Plan | ❌ 0% | 0 ms |
| API 4 – Training Program | ❌ 0% | 0 ms |

---

## 2. API 1 – Recherche alimentaire

### 2.1 Recherche textuelle (Open Food Facts + USDA FoodData Central)

> **Méthode :** 12 requêtes avec des aliments courants, vérification de la présence du mot-clé attendu dans les résultats.

| Métrique | Valeur |
|---|:---:|
| Requêtes testées | 12 |
| Vrais Positifs (P@1) | 0 |
| Faux Positifs | 0 |
| Faux Négatifs | 12 |
| **Précision** | **0.0%** |
| **Rappel** | **0.0%** |
| **F1-Score** | **0.0%** |
| Temps de réponse moyen | 0 ms |
| Taux d'erreur | 100.0% |

### 2.2 Recherche par code-barres (Open Food Facts)

| Métrique | Valeur |
|---|:---:|
| Codes-barres testés | 3 |
| Corrects | 0 |
| **Précision** | **0.0%** |
| Temps de réponse moyen | 0 ms |

---

## 3. API 3 – Cohérence du moteur diététique

> **Méthode :** 6 profils utilisateurs couvrant les 3 objectifs (lose / maintain / gain).
> La cohérence vérifie que les calories respectent exactement l'ajustement défini.
> La sécurité vérifie que les calories ≥ 1 200 kcal et que les protéines sont entre 0,8 et 3,0 g/kg.

| Métrique | Valeur |
|---|:---:|
| Profils testés | 6 |
| **Coherence Rate** | **100.0%** |
| **Unsafe Recommendation Rate** | **0.0%** |

| Profil | Objectif | Calories cibles | Cohérent | Sécurisé | Macros équilibrées |
|--------|:---:|---:|:---:|:---:|:---:|
| Homme 30 ans – Perte de poids | lose | 2211 kcal | ✅ | ✅ | ✅ |
| Homme 25 ans – Prise de masse | gain | 3241 kcal | ✅ | ✅ | ✅ |
| Femme 35 ans – Maintien | maintain | 1781 kcal | ✅ | ✅ | ✅ |
| Femme 45 ans – Perte de poids sédentaire | lose | 1392 kcal | ✅ | ✅ | ✅ |
| Homme 22 ans – Prise de masse très actif | gain | 3378 kcal | ✅ | ✅ | ✅ |
| Femme 28 ans – Maintien modéré | maintain | 1955 kcal | ✅ | ✅ | ✅ |

---

## 4. API 4 – Cohérence des programmes d'entraînement (Ollama Llama3.2)

> ⚠️ Évaluation non disponible : Ignoré (--skip-ollama)

---

## 5. Synthèse des KPIs

| KPI | Formule | Valeur obtenue |
|-----|---------|:---:|
| Précision recherche alimentaire | TP / (TP + FP) | 0.0% |
| Rappel recherche alimentaire | TP / (TP + FN) | 0.0% |
| F1-Score recherche alimentaire | 2·P·R / (P+R) | 0.0% |
| Coherence Rate (diet) | recommandations cohérentes / total × 100 | 100.0% |
| Unsafe Recommendation Rate (diet) | recommandations dangereuses / total × 100 | 0.0% |
| Coherence Rate (training) | coherent / total x 100 | N/A |
| Temps de réponse moyen (API 1) | Σ latences / n requêtes | 0 ms |
| Temps de réponse moyen (API 4) | Σ latences / n requêtes | 0 ms |
| Taux d'erreur API 1 | erreurs / requêtes × 100 | 100.0% |
| Disponibilité | health checks réussis / total × 100 | — voir section 1 |

---

## 6. Analyse et ajustements recommandés

### Interprétation

- **Recherche alimentaire** : le F1-Score mesure l'équilibre entre la capacité à trouver le bon aliment (rappel) et à ne pas retourner de résultats hors-sujet (précision). Un score > 80% est satisfaisant pour un moteur de recherche sur données ouvertes.
- **Cohérence diététique** : un Coherence Rate de 100% indique que le calculateur TDEE respecte systématiquement les règles métier (déficit −500 kcal pour la perte de poids, surplus +300 kcal pour la prise de masse).
- **Sécurité** : un Unsafe Rate de 0% confirme qu'aucune recommandation ne descend sous le seuil minimal de 1 200 kcal/jour.
- **Entraînements** : la cohérence Ollama dépend de la qualité du prompt. Des incohérences de type peuvent être corrigées en renforçant la contrainte `type` dans le prompt système.

### Ajustements possibles

| Problème détecté | Ajustement recommandé |
|---|---|
| Faible précision recherche (< 70%) | Ajouter un re-ranking par pertinence sur le champ `name` |
| Faible rappel (aliment non trouvé) | Étendre à d'autres sources (Edamam, Nutritionix) |
| Type d'entraînement incohérent | Renforcer la contrainte dans le prompt Ollama |
| Calories inférieures à 1200 | Le seuil `max(1200, ...)` dans TDEE calculator prévient ce cas |

---
*Rapport généré automatiquement par `evaluation/run_evaluation.py` – HealthAI Coach MSPR TPRE502*
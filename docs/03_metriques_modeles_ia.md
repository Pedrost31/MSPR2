# 3. Métriques de performance des modèles IA

> **Note méthodologique.** HealthAI Coach combine deux familles de modèles :
> 1. un modèle **vision** de classification/estimation (LLaVA) → mesurable en
>    **précision / rappel / F1** + erreur d'estimation calorique ;
> 2. des modèles **génératifs de texte** (Llama 3.2) pour recettes/diète/sport → non
>    mesurables par precision/rappel ; on évalue leur **validité structurelle** et leur
>    **conformité diététique**.
>
> Un **harnais d'évaluation reproductible** est fourni :
> [`ai_services/evaluation/`](../ai_services/evaluation). Les chiffres ci-dessous sont
> des **valeurs de référence indicatives** à recalculer sur le jeu de validation réel
> de l'équipe avant publication officielle.

---

## 3.1 Reconnaissance alimentaire (LLaVA) — classification

### Définitions

Pour chaque classe d'aliment *c* :

- **Précision(c)** = VP / (VP + FP) — parmi les images prédites *c*, combien sont réellement *c*.
- **Rappel(c)** = VP / (VP + FN) — parmi les images réellement *c*, combien ont été retrouvées.
- **F1(c)** = 2 · (P · R) / (P + R) — moyenne harmonique.
- **Macro-moyenne** = moyenne non pondérée sur les classes (traite les classes rares à égalité).
- **Micro-moyenne** = global (équivaut à l'**exactitude top-1** en classification mono-label).

### Protocole

1. Constituer un jeu de validation étiqueté (`labels.csv` : `image_path, true_label, true_calories`).
2. Démarrer le microservice API 1 (port 8001) + Ollama.
3. Exécuter :
   ```bash
   python ai_services/evaluation/evaluate_food_recognition.py \
       --labels dataset/labels.csv --service-url http://localhost:8001 --out rapport_metrics.json
   ```
4. Le script produit un `rapport_metrics.json` avec le détail par classe.

### Résultats de référence *(à recalculer — exemple de format attendu)*

| Métrique | Valeur de référence |
|----------|---------------------|
| Exactitude top-1 | _à mesurer_ |
| Précision (macro) | _à mesurer_ |
| Rappel (macro) | _à mesurer_ |
| **F1 (macro)** | _à mesurer_ |
| F1 (micro) | _à mesurer_ |

Détail par classe (extrait du JSON) :

```json
{
  "accuracy_top1": 0.80,
  "macro_avg": { "precision": 0.79, "recall": 0.75, "f1": 0.76 },
  "per_class": {
    "saumon": { "precision": 0.90, "recall": 0.82, "f1": 0.86, "support": 11 },
    "pomme":  { "precision": 0.95, "recall": 0.90, "f1": 0.92, "support": 10 }
  }
}
```

> Les valeurs `0.80 / 0.79 / …` ci-dessus illustrent **le format** ; elles doivent être
> remplacées par les mesures réelles obtenues via le harnais.

---

## 3.2 Estimation calorique (LLaVA + enrichissement)

La reconnaissance ne suffit pas : on évalue aussi la **justesse du chiffre** de calories,
sachant que les valeurs manquantes sont complétées par Open Food Facts / USDA.

| Métrique | Définition | Cible recommandée |
|----------|-----------|-------------------|
| **MAE** | Erreur absolue moyenne (kcal) | < 80 kcal |
| **MAPE** | Erreur relative moyenne (%) | < 25 % |
| **Taux ≤ ±20 %** | Part des estimations dans la tolérance | > 60 % |

Calculées automatiquement par le même harnais (colonne `true_calories` du CSV).

---

## 3.3 Modèles génératifs de texte (Llama 3.2)

Recettes, plans diététiques et programmes sportifs sont **génératifs** ; on retient deux
familles d'indicateurs vérifiables :

### a) Validité structurelle (contrat JSON)

- **Définition** : % de réponses du modèle qui sont du JSON valide et conforme au schéma
  attendu (clés, types).
- **Mesure** : déjà couverte par les tests `pytest` des microservices (le LLM est mocké et
  le parsing/validation du contrat est testé). Voir [livrable 7](./07_tests_et_couverture.md).
- **Cible** : 100 % de réponses parsables (un parseur de secours convertit les anciens
  formats Python-repr en JSON, cf. front `Coach.tsx`).

### b) Conformité diététique

- **Définition** : écart entre les calories du plan généré et la **cible TDEE déterministe**
  (Mifflin-St Jeor). Le calcul des macros, lui, est **exact par construction** (non-IA).
- **Mesure** : `|calories_plan − calories_cible| / calories_cible`.
- **Cible** : écart < 10 % (le plan doit respecter l'objectif calculé).

### c) Pertinence (évaluation humaine, optionnelle)

Grille de notation (1–5) sur un échantillon : cohérence avec l'objectif, variété,
faisabilité, qualité du français. À documenter si une revue humaine est menée.

---

## 3.4 Latence (performance opérationnelle)

Mesurée et journalisée pour chaque appel dans la collection `ailogs` (`latencyMs`).

| Modèle | Tâche | Latence typique (CPU local) |
|--------|-------|------------------------------|
| LLaVA | Analyse d'image | 60 s – 3 min |
| Llama 3.2 | Génération texte (recette/plan) | 30 s – 90 s |
| — (déterministe) | Calcul macros | < 50 ms |

> La latence élevée est inhérente à l'inférence **locale** (souveraineté des données,
> coût nul). Le front affiche un indicateur de chargement explicite et le backend applique
> un timeout généreux (4–5 min) + quota anti-abus.

---

## 3.5 Reproductibilité

| Élément | Emplacement |
|---------|-------------|
| Script d'évaluation classification + calories | [`ai_services/evaluation/evaluate_food_recognition.py`](../ai_services/evaluation/evaluate_food_recognition.py) |
| Modèle de jeu de validation | [`ai_services/evaluation/dataset/labels.example.csv`](../ai_services/evaluation/dataset/labels.example.csv) |
| Mode d'emploi | [`ai_services/evaluation/README.md`](../ai_services/evaluation/README.md) |
| Journalisation latence/issue | MongoDB `ailogs` |

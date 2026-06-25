# Harnais d'évaluation des modèles IA

Outils reproductibles pour mesurer la performance des modèles de recommandation.

## Reconnaissance alimentaire (API 1 — LLaVA)

`evaluate_food_recognition.py` calcule :
- **Classification** : exactitude top-1, précision / rappel / F1 (macro & micro), détail par classe.
- **Estimation calorique** : MAE (kcal), MAPE (%), taux de prédictions dans une tolérance ±X %.

### 1. Préparer un jeu de validation

```
dataset/
├── labels.csv          # image_path,true_label,true_calories
└── images/
    ├── pomme_01.jpg
    ├── saumon_01.jpg
    └── ...
```

Modèle fourni : [`dataset/labels.example.csv`](./dataset/labels.example.csv).
Le référentiel de classes (et les mots-clés de rattachement) est défini dans
`CLASS_KEYWORDS` au début du script — à adapter à votre jeu d'images.

### 2. Démarrer le microservice

```bash
cd ai_services && docker compose up -d --build api-food-recognition
```

### 3. Lancer l'évaluation

```bash
pip install requests
python evaluate_food_recognition.py \
    --labels dataset/labels.csv \
    --service-url http://localhost:8001 \
    --calorie-tolerance 0.20 \
    --out rapport_metrics.json
```

### 4. Résultat

Un `rapport_metrics.json` est produit (métriques détaillées) et un résumé est affiché.
Les chiffres présentés dans [`docs/03_metriques_modeles_ia.md`](../../docs/03_metriques_modeles_ia.md)
doivent être **recalculés sur votre propre jeu de validation** avant publication.

## Modèles texte (recettes / diète / sport — Llama 3.2)

Ces modèles sont **génératifs** : ils ne se mesurent pas en precision/rappel mais via :
- **Validité structurelle** : % de réponses JSON parsables conformes au schéma attendu
  (déjà couvert par les tests `pytest` qui mockent le LLM et valident le contrat).
- **Conformité diététique** : écart entre les calories du plan généré et la cible TDEE
  calculée (déterministe). Voir protocole dans `docs/03_metriques_modeles_ia.md` §4.

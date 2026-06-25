#!/usr/bin/env python3
"""
Harnais d'évaluation du modèle de reconnaissance alimentaire (API 1 — LLaVA).

Calcule des métriques de classification (précision, rappel, F1 macro & micro,
exactitude top-1) ainsi que l'erreur d'estimation calorique (MAE, MAPE, taux dans
une tolérance ±X %), à partir d'un jeu de validation étiqueté.

Aucune dépendance lourde : seules `requests` (appel HTTP) et la stdlib sont requises.
Les métriques sont calculées « à la main » (pas de scikit-learn) pour la portabilité.

──────────────────────────────────────────────────────────────────────────────
JEU DE VALIDATION
──────────────────────────────────────────────────────────────────────────────
Un fichier CSV `labels.csv` (UTF-8) avec les colonnes :

    image_path,true_label,true_calories
    images/pomme_01.jpg,pomme,95
    images/saumon_02.jpg,saumon,280
    ...

- `true_label`   : catégorie attendue (doit appartenir au référentiel de classes).
- `true_calories`: calories réelles de la portion (optionnel ; laisser vide si inconnu).

Le mapping prédiction→classe se fait par normalisation + mots-clés (voir CLASS_KEYWORDS,
adaptable). Une prédiction qui ne correspond à aucune classe connue est comptée comme
classe « inconnu ».

──────────────────────────────────────────────────────────────────────────────
UTILISATION
──────────────────────────────────────────────────────────────────────────────
    python evaluate_food_recognition.py \
        --labels dataset/labels.csv \
        --service-url http://localhost:8001 \
        --calorie-tolerance 0.20 \
        --out rapport_metrics.json

Le microservice API 1 doit être démarré (port 8001) et Ollama disponible.
"""
from __future__ import annotations

import argparse
import base64
import csv
import json
import re
import sys
import time
import unicodedata
from collections import defaultdict
from pathlib import Path

try:
    import requests
except ImportError:
    print("Le module 'requests' est requis : pip install requests", file=sys.stderr)
    raise


# ── Référentiel de classes (à adapter au jeu de validation) ─────────────────────
# Chaque classe est associée à des mots-clés permettant de rattacher la prédiction
# libre de LLaVA (ex. "pavé de saumon grillé") à une classe ("saumon").
CLASS_KEYWORDS: dict[str, list[str]] = {
    "pomme": ["pomme", "apple"],
    "banane": ["banane", "banana"],
    "saumon": ["saumon", "salmon"],
    "poulet": ["poulet", "chicken"],
    "riz": ["riz", "rice"],
    "salade": ["salade", "salad"],
    "pizza": ["pizza"],
    "pates": ["pate", "pâte", "pasta", "spaghetti"],
    "oeuf": ["oeuf", "œuf", "egg"],
    "pain": ["pain", "bread"],
}
UNKNOWN = "inconnu"


def normalize(text: str) -> str:
    """minuscule + sans accents + sans ponctuation."""
    text = unicodedata.normalize("NFKD", text or "").encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9 ]", " ", text.lower()).strip()


def to_class(predicted_name: str) -> str:
    """Rattache un nom prédit à une classe du référentiel via mots-clés."""
    norm = normalize(predicted_name)
    for cls, keywords in CLASS_KEYWORDS.items():
        if any(normalize(kw) in norm for kw in keywords):
            return cls
    return UNKNOWN


def analyze_image(service_url: str, image_path: Path, user_id: str = "eval") -> dict:
    """Appelle POST /api/v1/food/analyze-image et renvoie le dict 'analysis'."""
    b64 = base64.b64encode(image_path.read_bytes()).decode("utf-8")
    resp = requests.post(
        f"{service_url}/api/v1/food/analyze-image",
        json={"image_base64": b64, "user_id": user_id},
        timeout=300,
    )
    resp.raise_for_status()
    return resp.json().get("analysis", {})


# ── Calcul des métriques de classification ──────────────────────────────────────
def classification_metrics(y_true: list[str], y_pred: list[str]) -> dict:
    labels = sorted(set(y_true) | set(y_pred))
    tp = defaultdict(int)
    fp = defaultdict(int)
    fn = defaultdict(int)

    for t, p in zip(y_true, y_pred):
        if t == p:
            tp[t] += 1
        else:
            fp[p] += 1
            fn[t] += 1

    per_class = {}
    for lbl in labels:
        precision = tp[lbl] / (tp[lbl] + fp[lbl]) if (tp[lbl] + fp[lbl]) else 0.0
        recall = tp[lbl] / (tp[lbl] + fn[lbl]) if (tp[lbl] + fn[lbl]) else 0.0
        f1 = (2 * precision * recall / (precision + recall)) if (precision + recall) else 0.0
        per_class[lbl] = {
            "precision": round(precision, 4),
            "recall": round(recall, 4),
            "f1": round(f1, 4),
            "support": y_true.count(lbl),
        }

    # Macro = moyenne non pondérée des classes réellement présentes (support > 0)
    present = [l for l in labels if per_class[l]["support"] > 0]
    macro = {
        m: round(sum(per_class[l][m] for l in present) / len(present), 4) if present else 0.0
        for m in ("precision", "recall", "f1")
    }

    # Micro = global (équivaut à l'exactitude en classification mono-label)
    total_tp = sum(tp.values())
    accuracy = round(total_tp / len(y_true), 4) if y_true else 0.0
    micro = {"precision": accuracy, "recall": accuracy, "f1": accuracy}

    return {
        "accuracy_top1": accuracy,
        "macro_avg": macro,
        "micro_avg": micro,
        "per_class": per_class,
    }


def calorie_metrics(pairs: list[tuple[float, float]], tolerance: float) -> dict | None:
    """pairs = [(true_kcal, pred_kcal), ...] ; renvoie MAE, MAPE, taux dans tolérance."""
    pairs = [(t, p) for t, p in pairs if t and t > 0]
    if not pairs:
        return None
    abs_err = [abs(p - t) for t, p in pairs]
    pct_err = [abs(p - t) / t for t, p in pairs]
    within = [1 for t, p in pairs if abs(p - t) / t <= tolerance]
    return {
        "n": len(pairs),
        "mae_kcal": round(sum(abs_err) / len(pairs), 1),
        "mape_pct": round(100 * sum(pct_err) / len(pairs), 1),
        "tolerance_pct": int(tolerance * 100),
        "within_tolerance_rate": round(len(within) / len(pairs), 4),
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Évaluation de la reconnaissance alimentaire (API 1)")
    parser.add_argument("--labels", required=True, help="CSV: image_path,true_label,true_calories")
    parser.add_argument("--service-url", default="http://localhost:8001")
    parser.add_argument("--calorie-tolerance", type=float, default=0.20, help="ex. 0.20 = ±20%%")
    parser.add_argument("--out", default="rapport_metrics.json")
    args = parser.parse_args()

    labels_file = Path(args.labels)
    base_dir = labels_file.parent
    rows = list(csv.DictReader(labels_file.open(encoding="utf-8")))
    if not rows:
        print("Jeu de validation vide.", file=sys.stderr)
        return 1

    y_true, y_pred, cal_pairs, errors = [], [], [], []
    t0 = time.time()

    for i, row in enumerate(rows, 1):
        img = (base_dir / row["image_path"]).resolve()
        true_label = normalize(row["true_label"])
        print(f"[{i}/{len(rows)}] {img.name} (attendu: {true_label})…", flush=True)
        try:
            analysis = analyze_image(args.service_url, img)
        except Exception as exc:  # noqa: BLE001
            errors.append({"image": str(img), "error": str(exc)})
            continue

        y_true.append(true_label if true_label in CLASS_KEYWORDS else UNKNOWN)
        y_pred.append(to_class(analysis.get("food_name", "")))

        true_cal = row.get("true_calories")
        pred_cal = (analysis.get("nutrition") or {}).get("calories")
        if true_cal:
            try:
                cal_pairs.append((float(true_cal), float(pred_cal or 0)))
            except (TypeError, ValueError):
                pass

    report = {
        "model": "LLaVA (Ollama) + enrichissement Open Food Facts/USDA",
        "evaluated_at": time.strftime("%Y-%m-%dT%H:%M:%S"),
        "samples_total": len(rows),
        "samples_scored": len(y_true),
        "samples_failed": len(errors),
        "elapsed_sec": round(time.time() - t0, 1),
        "classification": classification_metrics(y_true, y_pred) if y_true else None,
        "calorie_estimation": calorie_metrics(cal_pairs, args.calorie_tolerance),
        "errors": errors,
    }

    Path(args.out).write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")

    print("\n──────── RÉSULTATS ────────")
    if report["classification"]:
        c = report["classification"]
        print(f"Exactitude top-1 : {c['accuracy_top1']:.1%}")
        print(f"F1 macro         : {c['macro_avg']['f1']:.3f}  "
              f"(précision {c['macro_avg']['precision']:.3f}, rappel {c['macro_avg']['recall']:.3f})")
    if report["calorie_estimation"]:
        k = report["calorie_estimation"]
        print(f"Calories — MAE   : {k['mae_kcal']} kcal | MAPE : {k['mape_pct']}% | "
              f"≤±{k['tolerance_pct']}% : {k['within_tolerance_rate']:.1%}")
    print(f"Rapport écrit dans : {args.out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

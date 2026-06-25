r"""
Script principal d'évaluation des API IA – HealthAI Coach.

Exécution :
    cd ai_services
    .\.venv\Scripts\python evaluation/run_evaluation.py

    # Mode rapide (sans appels Ollama) :
    .\.venv\Scripts\python evaluation/run_evaluation.py --skip-ollama

Sorties :
    evaluation/reports/evaluation_report_<date>.json  -> donnees brutes
    evaluation/reports/evaluation_report_<date>.md    -> rapport humain (MSPR)
"""
from __future__ import annotations

import asyncio
import json
import sys
import os
import argparse
from datetime import datetime
from pathlib import Path

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from evaluation.evaluators import (
    FoodAPIEvaluator,
    DietAPIEvaluator,
    TrainingAPIEvaluator,
    AvailabilityEvaluator,
)

REPORTS_DIR = Path(__file__).parent / "reports"
REPORTS_DIR.mkdir(exist_ok=True)


# ─── Console helpers ──────────────────────────────────────────────────────────

def _sep(char: str = "-", n: int = 70) -> None:
    print(char * n)


def _header(title: str) -> None:
    print()
    _sep("=")
    print(f"  {title}")
    _sep("=")


def _section(title: str) -> None:
    print()
    _sep()
    print(f"  {title}")
    _sep()


def _ok(msg: str) -> None:
    print(f"  [OK]  {msg}")


def _warn(msg: str) -> None:
    print(f"  [!!]  {msg}")


def _kv(key: str, value: Any, width: int = 35) -> None:
    print(f"  {key:<{width}} {value}")


# ─── Report sections ──────────────────────────────────────────────────────────

def print_availability(result: dict) -> None:
    _section("DISPONIBILITÉ DES APIS (Health Checks)")
    for api in result["details"]:
        avail = api["availability_pct"]
        icon = "[OK]" if avail == 100.0 else "[!!]"
        print(f"  {icon}  {api['api']:<35} {avail:.0f}%  ({api['avg_latency_ms']:.0f} ms)")
    all_up = result["all_available"]
    print()
    _kv("Disponibilité globale :", f"{'Toutes opérationnelles' if all_up else 'Certaines APIs indisponibles'}")


def print_food_search(result: dict) -> None:
    _section("API 1 – RECHERCHE ALIMENTAIRE (Open Food Facts + USDA)")
    _kv("Requêtes testées :", result["total_queries"])
    _kv("Vrais positifs (P@1) :", result["true_positives"])
    _kv("Faux positifs :", result["false_positives"])
    _kv("Faux négatifs (non trouvés) :", result["false_negatives"])
    print()
    _kv("Précision :", f"{result['precision']:.4f}  ({result['precision']*100:.1f}%)")
    _kv("Rappel :", f"{result['recall']:.4f}  ({result['recall']*100:.1f}%)")
    _kv("F1-Score :", f"{result['f1_score']:.4f}  ({result['f1_score']*100:.1f}%)")
    print()
    _kv("Temps de réponse moyen :", f"{result['avg_latency_ms']:.0f} ms")
    _kv("Taux d'erreur API :", f"{result['error_rate_pct']:.1f}%")
    print()
    print("  Détail par requête :")
    for d in result["details"]:
        at1 = "[P@1]" if d.get("correct_at_1") else "[---]"
        hit = "[HIT]" if d.get("found") else "[MIS]"
        err = d.get("error", "")
        if err:
            print(f"    {at1} {hit}  query={d['query']:<12} ERROR: {err}")
        else:
            print(f"    {at1} {hit}  query={d['query']:<12} résultats={d.get('results_count',0):>2}  {d.get('latency_ms',0):.0f}ms")


def print_food_barcode(result: dict) -> None:
    _section("API 1 – CODE-BARRES (Open Food Facts)")
    _kv("Codes-barres testés :", result["total_lookups"])
    _kv("Corrects :", result["correct"])
    _kv("Précision :", f"{result['precision']:.4f}  ({result['precision']*100:.1f}%)")
    _kv("Temps de réponse moyen :", f"{result['avg_latency_ms']:.0f} ms")
    for d in result["details"]:
        ok = "[OK]" if d.get("correct") else "[!!]"
        name = d.get("returned_name", d.get("error", ""))
        print(f"    {ok}  {d['barcode']}  →  {name}")


def print_diet(result: dict) -> None:
    _section("API 3 – COHÉRENCE DU MOTEUR DIÉTÉTIQUE (TDEE Calculator)")
    _kv("Profils testés :", result["total_profiles"])
    _kv("Profils cohérents :", result["coherent_count"])
    _kv("Profils dangereux :", result["unsafe_count"])
    print()
    _kv("Coherence Rate :", f"{result['coherence_rate_pct']:.1f}%")
    _kv("Unsafe Recommendation Rate :", f"{result['unsafe_rate_pct']:.1f}%")
    print()
    print("  Détail par profil :")
    for d in result["details"]:
        coh = "[OK]" if d["is_coherent"] else "[!!]"
        safe = "[SAFE]" if (d["is_safe_calories"] and d["is_safe_protein"]) else "[UNSAFE]"
        bal = "[BAL]" if d["is_balanced"] else "[?]"
        print(
            f"    {coh} {safe} {bal}  {d['label']:<45}"
            f"  goal={d['goal']:<8}"
            f"  {d['target_calories']:.0f} kcal"
            f"  P={d['protein_g']}g C={d['carbs_g']}g L={d['fat_g']}g"
        )


def print_training(result: dict) -> None:
    _section("API 4 – COHÉRENCE ENTRAÎNEMENTS (Ollama Llama3.2)")
    _kv("Cas testés :", result["total_cases"])
    _kv("Réponses cohérentes :", result["coherent_count"])
    _kv("Réponses dangereuses :", result["unsafe_count"])
    _kv("Erreurs API :", result["error_count"])
    print()
    _kv("Coherence Rate :", f"{result['coherence_rate_pct']:.1f}%")
    _kv("Unsafe Rate :", f"{result['unsafe_rate_pct']:.1f}%")
    _kv("Taux d'erreur API :", f"{result['error_rate_pct']:.1f}%")
    _kv("Temps de réponse moyen :", f"{result['avg_latency_ms']:.0f} ms")
    print()
    print("  Détail par entraînement :")
    for d in result["details"]:
        coh = "[OK]" if d.get("is_coherent") else "[!!]"
        safe = "[SAFE]" if d.get("is_safe") else "[UNSAFE]"
        err = d.get("error", "")
        if err:
            print(f"    {coh} {safe}  {d['label']:<40}  ERROR: {err}")
        else:
            print(
                f"    {coh} {safe}  {d['label']:<40}"
                f"  type={d.get('returned_type','?'):<12}"
                f"  {d.get('returned_duration_min',0)}min"
                f"  {d.get('phases_count',0)} phases"
                f"  {d.get('latency_ms',0):.0f}ms"
            )


# ─── Markdown report ──────────────────────────────────────────────────────────

def generate_markdown(report: dict, date_str: str) -> str:
    avail = report["availability"]
    food_s = report.get("food_search", {})
    food_b = report.get("food_barcode", {})
    diet = report["diet_coherence"]
    train = report.get("training", {})

    lines = [
        f"# Rapport d'Évaluation des API IA – HealthAI Coach",
        f"",
        f"**Date :** {date_str}  ",
        f"**Modèles IA :** Ollama LLaVA (vision) · Ollama Llama3.2 (NLP)  ",
        f"**APIs données :** Open Food Facts · USDA FoodData Central · TheMealDB · Wger  ",
        f"",
        f"---",
        f"",
        f"## 1. Disponibilité des services",
        f"",
        f"| API | Disponibilité | Latence moy. |",
        f"|-----|:---:|---:|",
    ]
    for a in avail["details"]:
        emoji = "✅" if a["availability_pct"] == 100 else "❌"
        lines.append(f"| {a['api']} | {emoji} {a['availability_pct']:.0f}% | {a['avg_latency_ms']:.0f} ms |")

    lines += [
        f"",
        f"---",
        f"",
        f"## 2. API 1 – Recherche alimentaire",
        f"",
        f"### 2.1 Recherche textuelle (Open Food Facts + USDA FoodData Central)",
        f"",
        f"> **Méthode :** 12 requêtes avec des aliments courants, vérification de la présence du mot-clé attendu dans les résultats.",
        f"",
        f"| Métrique | Valeur |",
        f"|---|:---:|",
        f"| Requêtes testées | {food_s.get('total_queries', 'N/A')} |",
        f"| Vrais Positifs (P@1) | {food_s.get('true_positives', 'N/A')} |",
        f"| Faux Positifs | {food_s.get('false_positives', 'N/A')} |",
        f"| Faux Négatifs | {food_s.get('false_negatives', 'N/A')} |",
        f"| **Précision** | **{food_s.get('precision', 0)*100:.1f}%** |",
        f"| **Rappel** | **{food_s.get('recall', 0)*100:.1f}%** |",
        f"| **F1-Score** | **{food_s.get('f1_score', 0)*100:.1f}%** |",
        f"| Temps de réponse moyen | {food_s.get('avg_latency_ms', 0):.0f} ms |",
        f"| Taux d'erreur | {food_s.get('error_rate_pct', 0):.1f}% |",
        f"",
        f"### 2.2 Recherche par code-barres (Open Food Facts)",
        f"",
        f"| Métrique | Valeur |",
        f"|---|:---:|",
        f"| Codes-barres testés | {food_b.get('total_lookups', 'N/A')} |",
        f"| Corrects | {food_b.get('correct', 'N/A')} |",
        f"| **Précision** | **{food_b.get('precision', 0)*100:.1f}%** |",
        f"| Temps de réponse moyen | {food_b.get('avg_latency_ms', 0):.0f} ms |",
        f"",
        f"---",
        f"",
        f"## 3. API 3 – Cohérence du moteur diététique",
        f"",
        f"> **Méthode :** 6 profils utilisateurs couvrant les 3 objectifs (lose / maintain / gain).",
        f"> La cohérence vérifie que les calories respectent exactement l'ajustement défini.",
        f"> La sécurité vérifie que les calories ≥ 1 200 kcal et que les protéines sont entre 0,8 et 3,0 g/kg.",
        f"",
        f"| Métrique | Valeur |",
        f"|---|:---:|",
        f"| Profils testés | {diet['total_profiles']} |",
        f"| **Coherence Rate** | **{diet['coherence_rate_pct']:.1f}%** |",
        f"| **Unsafe Recommendation Rate** | **{diet['unsafe_rate_pct']:.1f}%** |",
        f"",
        f"| Profil | Objectif | Calories cibles | Cohérent | Sécurisé | Macros équilibrées |",
        f"|--------|:---:|---:|:---:|:---:|:---:|",
    ]
    for d in diet["details"]:
        coh = "✅" if d["is_coherent"] else "❌"
        safe = "✅" if (d["is_safe_calories"] and d["is_safe_protein"]) else "❌"
        bal = "✅" if d["is_balanced"] else "⚠️"
        lines.append(
            f"| {d['label']} | {d['goal']} | {d['target_calories']:.0f} kcal | {coh} | {safe} | {bal} |"
        )

    lines += [
        f"",
        f"---",
        f"",
        f"## 4. API 4 – Cohérence des programmes d'entraînement (Ollama Llama3.2)",
        f"",
    ]

    if "error" in train:
        lines.append(f"> ⚠️ Évaluation non disponible : {train['error']}")
    else:
        lines += [
            f"| Métrique | Valeur |",
            f"|---|:---:|",
            f"| Cas testés | {train.get('total_cases', 0)} |",
            f"| **Coherence Rate** | **{train.get('coherence_rate_pct', 0):.1f}%** |",
            f"| **Unsafe Rate** | **{train.get('unsafe_rate_pct', 0):.1f}%** |",
            f"| Taux d'erreur API | {train.get('error_rate_pct', 0):.1f}% |",
            f"| Temps de réponse moyen | {train.get('avg_latency_ms', 0):.0f} ms |",
            f"",
            f"| Cas | Type demandé | Type retourné | Cohérent | Sécurisé |",
            f"|-----|:---:|:---:|:---:|:---:|",
        ]
        for d in train.get("details", []):
            coh = "✅" if d.get("is_coherent") else "❌"
            safe = "✅" if d.get("is_safe") else "❌"
            err = d.get("error", "")
            if err:
                lines.append(f"| {d['label']} | {d['requested_type']} | ❌ ERREUR | ❌ | ❌ |")
            else:
                lines.append(
                    f"| {d['label']} | {d['requested_type']} | {d.get('returned_type','?')} | {coh} | {safe} |"
                )

    lines += [
        f"",
        f"---",
        f"",
        f"## 5. Synthèse des KPIs",
        f"",
        f"| KPI | Formule | Valeur obtenue |",
        f"|-----|---------|:---:|",
        f"| Précision recherche alimentaire | TP / (TP + FP) | {food_s.get('precision', 0)*100:.1f}% |",
        f"| Rappel recherche alimentaire | TP / (TP + FN) | {food_s.get('recall', 0)*100:.1f}% |",
        f"| F1-Score recherche alimentaire | 2·P·R / (P+R) | {food_s.get('f1_score', 0)*100:.1f}% |",
        f"| Coherence Rate (diet) | recommandations cohérentes / total × 100 | {diet['coherence_rate_pct']:.1f}% |",
        f"| Unsafe Recommendation Rate (diet) | recommandations dangereuses / total × 100 | {diet['unsafe_rate_pct']:.1f}% |",
        "| Coherence Rate (training) | coherent / total x 100 | "
        + (f"{train['coherence_rate_pct']:.1f}%" if isinstance(train.get('coherence_rate_pct'), float) else "N/A")
        + " |",
        f"| Temps de réponse moyen (API 1) | Σ latences / n requêtes | {food_s.get('avg_latency_ms', 0):.0f} ms |",
        f"| Temps de réponse moyen (API 4) | Σ latences / n requêtes | {train.get('avg_latency_ms', 0):.0f} ms |",
        f"| Taux d'erreur API 1 | erreurs / requêtes × 100 | {food_s.get('error_rate_pct', 0):.1f}% |",
        f"| Disponibilité | health checks réussis / total × 100 | — voir section 1 |",
        f"",
        f"---",
        f"",
        f"## 6. Analyse et ajustements recommandés",
        f"",
        f"### Interprétation",
        f"",
        f"- **Recherche alimentaire** : le F1-Score mesure l'équilibre entre la capacité à trouver le bon aliment (rappel) et à ne pas retourner de résultats hors-sujet (précision). Un score > 80% est satisfaisant pour un moteur de recherche sur données ouvertes.",
        f"- **Cohérence diététique** : un Coherence Rate de 100% indique que le calculateur TDEE respecte systématiquement les règles métier (déficit −500 kcal pour la perte de poids, surplus +300 kcal pour la prise de masse).",
        f"- **Sécurité** : un Unsafe Rate de 0% confirme qu'aucune recommandation ne descend sous le seuil minimal de 1 200 kcal/jour.",
        f"- **Entraînements** : la cohérence Ollama dépend de la qualité du prompt. Des incohérences de type peuvent être corrigées en renforçant la contrainte `type` dans le prompt système.",
        f"",
        f"### Ajustements possibles",
        f"",
        f"| Problème détecté | Ajustement recommandé |",
        f"|---|---|",
        f"| Faible précision recherche (< 70%) | Ajouter un re-ranking par pertinence sur le champ `name` |",
        f"| Faible rappel (aliment non trouvé) | Étendre à d'autres sources (Edamam, Nutritionix) |",
        f"| Type d'entraînement incohérent | Renforcer la contrainte dans le prompt Ollama |",
        f"| Calories inférieures à 1200 | Le seuil `max(1200, ...)` dans TDEE calculator prévient ce cas |",
        f"",
        f"---",
        f"*Rapport généré automatiquement par `evaluation/run_evaluation.py` – HealthAI Coach MSPR TPRE502*",
    ]

    return "\n".join(lines)


# ─── Main ─────────────────────────────────────────────────────────────────────

async def run(skip_ollama: bool = False) -> dict:
    now = datetime.now()
    date_str = now.strftime("%Y-%m-%d %H:%M")
    file_date = now.strftime("%Y%m%d_%H%M")

    _header("ÉVALUATION DES API IA – HEALTHAI COACH")
    print(f"  Date : {date_str}")
    print(f"  Mode : {'Rapide (sans Ollama)' if skip_ollama else 'Complet'}")

    report: dict = {"generated_at": date_str}

    # 1 - Disponibilité
    print("\n[1/4] Vérification de la disponibilité des APIs...")
    avail_result = await AvailabilityEvaluator(checks=3).evaluate()
    report["availability"] = avail_result
    print_availability(avail_result)

    # 2 - Food search
    print("\n[2/4] Évaluation de la recherche alimentaire (API 1)...")
    food_eval = FoodAPIEvaluator(timeout=15.0)
    food_search = await food_eval.evaluate_search()
    food_barcode = await food_eval.evaluate_barcode()
    report["food_search"] = food_search
    report["food_barcode"] = food_barcode
    print_food_search(food_search)
    print_food_barcode(food_barcode)

    # 3 - Diet coherence (deterministe, pas de timeout)
    print("\n[3/4] Évaluation de la cohérence diététique (API 3 – TDEE Calculator)...")
    diet_result = DietAPIEvaluator().evaluate_macro_coherence()
    report["diet_coherence"] = diet_result
    print_diet(diet_result)

    # 4 - Training (Ollama – peut être long)
    if skip_ollama:
        print("\n[4/4] Évaluation entraînement ignorée (--skip-ollama).")
        report["training"] = {"error": "Ignoré (--skip-ollama)"}
    else:
        print("\n[4/4] Évaluation des entraînements (API 4 – Ollama, peut prendre plusieurs minutes)...")
        training_result = await TrainingAPIEvaluator(timeout=180.0).evaluate_quick_workout()
        report["training"] = training_result
        print_training(training_result)

    # Sauvegarde JSON
    json_path = REPORTS_DIR / f"evaluation_report_{file_date}.json"
    json_path.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")

    # Sauvegarde Markdown
    md_path = REPORTS_DIR / f"evaluation_report_{file_date}.md"
    md_path.write_text(generate_markdown(report, date_str), encoding="utf-8")

    _header("RAPPORT SAUVEGARDÉ")
    print(f"  JSON     : {json_path}")
    print(f"  Markdown : {md_path}")

    return report


def main() -> None:
    parser = argparse.ArgumentParser(description="Évaluation des API IA HealthAI Coach")
    parser.add_argument(
        "--skip-ollama",
        action="store_true",
        help="Ignore l'évaluation Ollama (API 4) pour un résultat instantané",
    )
    args = parser.parse_args()
    asyncio.run(run(skip_ollama=args.skip_ollama))


if __name__ == "__main__":
    main()

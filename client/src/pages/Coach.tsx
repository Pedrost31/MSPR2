import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  Loader2Icon,
  SparklesIcon,
  UtensilsCrossedIcon,
  SaladIcon,
  DumbbellIcon,
  ChefHatIcon,
  FlameIcon,
  ClockIcon,
  HistoryIcon,
  TargetIcon,
  ChevronDownIcon,
} from "lucide-react";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import { useAppContext } from "../context/AppContext";
import { burnGoalFromBmr } from "../services/mappers";
import {
  aiService,
  type MealType,
  type Recipe,
  type RecipeSuggestions,
  type Macros,
  type DietPlan,
  type TrainingProgram,
  type Exercise,
  type HistoryItem,
} from "../services/aiService";

type Tab = "recipes" | "diet" | "training" | "history";

const tabs: { id: Tab; label: string; icon: typeof SaladIcon }[] = [
  { id: "recipes", label: "Recettes", icon: ChefHatIcon },
  { id: "diet", label: "Diète", icon: SaladIcon },
  { id: "training", label: "Entraînement", icon: DumbbellIcon },
  { id: "history", label: "Historique", icon: HistoryIcon },
];

const mealOptions = [
  { value: "breakfast", label: "Petit-déjeuner" },
  { value: "lunch", label: "Déjeuner" },
  { value: "dinner", label: "Dîner" },
  { value: "snack", label: "Collation" },
];

const workoutOptions = [
  { value: "cardio", label: "Cardio" },
  { value: "strength", label: "Musculation" },
  { value: "hiit", label: "HIIT" },
  { value: "flexibility", label: "Souplesse" },
  { value: "yoga", label: "Yoga" },
];

const dayLabels: Record<string, string> = {
  monday: "Lundi",
  tuesday: "Mardi",
  wednesday: "Mercredi",
  thursday: "Jeudi",
  friday: "Vendredi",
  saturday: "Samedi",
  sunday: "Dimanche",
};

const MacroChip = ({ label, value, unit }: { label: string; value?: number; unit: string }) => {
  const num = Number(value);
  const display = Number.isFinite(num) ? Math.round(num) : "—";
  return (
    <div className="flex-1 text-center p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
      <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
        {display}
        <span className="text-xs font-normal text-slate-400"> {unit}</span>
      </p>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{label}</p>
    </div>
  );
};

const RecipeCard = ({ recipe }: { recipe: Recipe }) => (
  <Card>
    <div className="flex items-start justify-between gap-3 mb-3">
      <h4 className="font-semibold text-slate-800 dark:text-white">{recipe.name}</h4>
      {recipe.prep_time_min != null && (
        <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
          <ClockIcon className="size-3.5" />
          {recipe.prep_time_min} min
        </span>
      )}
    </div>

    <div className="flex gap-2 mb-3">
      <MacroChip label="kcal" value={recipe.calories} unit="" />
      <MacroChip label="Protéines" value={recipe.protein_g} unit="g" />
      <MacroChip label="Glucides" value={recipe.carbs_g} unit="g" />
      <MacroChip label="Lipides" value={recipe.fat_g} unit="g" />
    </div>

    {recipe.ingredients && recipe.ingredients.length > 0 && (
      <div className="mb-3">
        <p className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Ingrédients</p>
        <div className="flex flex-wrap gap-1.5">
          {recipe.ingredients.map((ing, i) => (
            <span
              key={i}
              className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs text-slate-600 dark:text-slate-300"
            >
              {ing}
            </span>
          ))}
        </div>
      </div>
    )}

    {recipe.instructions && recipe.instructions.length > 0 && (
      <div className="mb-3">
        <p className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Préparation</p>
        <ol className="list-decimal list-inside space-y-1 text-sm text-slate-600 dark:text-slate-300">
          {recipe.instructions.map((step, i) => (
            <li key={i}>{step}</li>
          ))}
        </ol>
      </div>
    )}

    {recipe.benefits && (
      <p className="text-sm text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/10 rounded-lg p-2">
        {recipe.benefits}
      </p>
    )}
  </Card>
);

const Coach = () => {
  const { updateCalorieGoals, user } = useAppContext();
  const [tab, setTab] = useState<Tab>("recipes");
  const [loading, setLoading] = useState(false);

  // Recettes
  const [mealType, setMealType] = useState<MealType>("lunch");
  const [suggestions, setSuggestions] = useState<RecipeSuggestions | null>(null);
  const [ingredients, setIngredients] = useState("");
  const [generated, setGenerated] = useState<Recipe | null>(null);

  // Diète
  const [macros, setMacros] = useState<Macros | null>(null);
  const [dietPlan, setDietPlan] = useState<DietPlan | null>(null);

  // Entraînement
  const [program, setProgram] = useState<TrainingProgram | null>(null);
  const [workoutType, setWorkoutType] = useState("hiit");
  const [duration, setDuration] = useState(30);
  const [quickWorkout, setQuickWorkout] = useState<TrainingProgram | null>(null);

  // Historique
  const [history, setHistory] = useState<HistoryItem[] | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  const run = async (label: string, fn: () => Promise<void>) => {
    setLoading(true);
    const toastId = toast.loading(`${label}… (l'IA peut prendre 30 s à 2 min)`);
    try {
      await fn();
      toast.success("Terminé !", { id: toastId });
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Échec de la requête IA", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const handleSuggest = () =>
    run("Recherche de recettes", async () => {
      setSuggestions(await aiService.suggestRecipes(mealType));
    });

  const handleGenerate = () => {
    const list = ingredients
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (list.length === 0) {
      toast.error("Entrez au moins un ingrédient (séparés par des virgules)");
      return;
    }
    return run("Génération de recette", async () => {
      setGenerated(await aiService.generateRecipe(list));
    });
  };

  const handleMacros = () =>
    run("Calcul des macros", async () => {
      setMacros(await aiService.getMacros());
    });

  const handleDietPlan = () =>
    run("Génération du plan alimentaire", async () => {
      const { plan, macros: m } = await aiService.getDietPlan();
      setDietPlan(plan);
      setMacros(m);
    });

  const handleProgram = () =>
    run("Génération du programme", async () => {
      setProgram(await aiService.getTrainingProgram());
    });

  const handleQuickWorkout = () =>
    run("Génération de l'entraînement", async () => {
      setQuickWorkout(await aiService.getQuickWorkout(workoutType, duration));
    });

  const handleApplyMacros = async () => {
    if (!macros) return;
    const intake = macros.calories;
    // Objectif brûlé réaliste : une fraction du BMR selon l'objectif.
    const burn = macros.bmr ? burnGoalFromBmr(macros.bmr, user?.goal) : undefined;
    try {
      await updateCalorieGoals({ intake, burn });
      toast.success(
        `Objectifs mis à jour : ${Math.round(intake ?? 0)} kcal/j${
          burn ? ` · ${burn} kcal brûlées` : ""
        }`
      );
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Échec de la mise à jour des objectifs");
    }
  };

  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      setHistory(await aiService.getHistory());
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Impossible de charger l'historique");
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (tab === "history" && history === null) {
      loadHistory();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div className="flex items-center gap-3">
          <div className="size-11 rounded-xl bg-emerald-500 flex items-center justify-center">
            <SparklesIcon className="size-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Coach IA</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              Recettes, plans nutritionnels et entraînements personnalisés
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mt-6 overflow-x-auto">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
                tab === t.id
                  ? "bg-emerald-500 text-white"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              <t.icon className="size-4" />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="page-content-grid">
        {/* ── RECETTES ── */}
        {tab === "recipes" && (
          <div className="space-y-4">
            <Card>
              <h3 className="font-semibold text-slate-800 dark:text-white mb-3">
                Suggestions selon votre profil
              </h3>
              <Select
                label="Type de repas"
                value={mealType}
                onChange={(v) => setMealType(v as MealType)}
                options={mealOptions}
              />
              <Button className="w-full mt-4" onClick={handleSuggest} disabled={loading}>
                <UtensilsCrossedIcon className="size-5" />
                Suggérer 3 recettes
              </Button>
            </Card>

            {suggestions && (
              <div className="space-y-4">
                {suggestions.tip && (
                  <p className="text-sm text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/10 rounded-lg p-3">
                    {suggestions.tip}
                  </p>
                )}
                {suggestions.suggestions?.map((r, i) => (
                  <RecipeCard key={i} recipe={r} />
                ))}
              </div>
            )}

            <Card>
              <h3 className="font-semibold text-slate-800 dark:text-white mb-3">
                Générer depuis vos ingrédients
              </h3>
              <Input
                label="Ingrédients (séparés par des virgules)"
                value={ingredients}
                onChange={(v) => setIngredients(v.toString())}
                placeholder="œufs, épinards, fromage"
              />
              <Button className="w-full mt-4" onClick={handleGenerate} disabled={loading}>
                <ChefHatIcon className="size-5" />
                Créer une recette
              </Button>
            </Card>

            {generated && <RecipeCard recipe={generated} />}
          </div>
        )}

        {/* ── DIÈTE ── */}
        {tab === "diet" && (
          <div className="space-y-4">
            <Card>
              <h3 className="font-semibold text-slate-800 dark:text-white mb-3">Vos besoins</h3>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button className="flex-1" variant="secondary" onClick={handleMacros} disabled={loading}>
                  <FlameIcon className="size-5" />
                  Calculer mes macros
                </Button>
                <Button className="flex-1" onClick={handleDietPlan} disabled={loading}>
                  <SaladIcon className="size-5" />
                  Plan de la semaine
                </Button>
              </div>
            </Card>

            {macros && (
              <Card>
                <h3 className="font-semibold text-slate-800 dark:text-white mb-3">
                  Objectifs quotidiens
                </h3>
                <div className="flex gap-2 mb-2">
                  <MacroChip label="Calories" value={macros.calories} unit="kcal" />
                  <MacroChip label="Protéines" value={macros.protein_g} unit="g" />
                  <MacroChip label="Glucides" value={macros.carbs_g} unit="g" />
                  <MacroChip label="Lipides" value={macros.fat_g} unit="g" />
                </div>
                {(macros.bmr || macros.tdee) && (
                  <p className="text-xs text-slate-400">
                    BMR : {Math.round(macros.bmr ?? 0)} kcal · TDEE : {Math.round(macros.tdee ?? 0)} kcal
                  </p>
                )}
                <Button className="w-full mt-4" onClick={handleApplyMacros} disabled={loading}>
                  <TargetIcon className="size-5" />
                  Appliquer à mes objectifs (limite & calories brûlées)
                </Button>
              </Card>
            )}

            {dietPlan?.weekly_plan && (
              <Card>
                <h3 className="font-semibold text-slate-800 dark:text-white mb-3">
                  Plan alimentaire hebdomadaire
                </h3>
                <div className="space-y-3">
                  {Object.entries(dietPlan.weekly_plan).map(([day, meals]) => (
                    <div key={day} className="border-b border-slate-100 dark:border-slate-800 pb-3 last:border-0">
                      <p className="font-medium text-emerald-600 dark:text-emerald-400 mb-1 capitalize">
                        {dayLabels[day] ?? day}
                      </p>
                      <div className="space-y-0.5">
                        {Object.entries(meals).map(([meal, content]) => (
                          <p key={meal} className="text-sm text-slate-600 dark:text-slate-300">
                            <span className="capitalize text-slate-400">{meal} :</span> {content}
                          </p>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {dietPlan?.shopping_list && dietPlan.shopping_list.length > 0 && (
              <Card>
                <h3 className="font-semibold text-slate-800 dark:text-white mb-3">Liste de courses</h3>
                <div className="flex flex-wrap gap-1.5">
                  {dietPlan.shopping_list.map((item, i) => (
                    <span
                      key={i}
                      className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs text-slate-600 dark:text-slate-300"
                    >
                      {item}
                    </span>
                  ))}
                </div>
                {dietPlan.hydration_tip && (
                  <p className="text-sm text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/10 rounded-lg p-2 mt-3">
                    {dietPlan.hydration_tip}
                  </p>
                )}
              </Card>
            )}
          </div>
        )}

        {/* ── ENTRAÎNEMENT ── */}
        {tab === "training" && (
          <div className="space-y-4">
            <Card>
              <h3 className="font-semibold text-slate-800 dark:text-white mb-3">
                Programme personnalisé
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
                Généré selon votre profil et vos activités récentes.
              </p>
              <Button className="w-full" onClick={handleProgram} disabled={loading}>
                <DumbbellIcon className="size-5" />
                Générer mon programme de la semaine
              </Button>
            </Card>

            {program && <ProgramView program={program} />}

            <Card>
              <h3 className="font-semibold text-slate-800 dark:text-white mb-3">Entraînement express</h3>
              <div className="flex flex-col sm:flex-row gap-3">
                <Select
                  className="flex-1"
                  label="Type"
                  value={workoutType}
                  onChange={(v) => setWorkoutType(v.toString())}
                  options={workoutOptions}
                />
                <Input
                  className="flex-1"
                  label="Durée (min)"
                  type="number"
                  value={duration}
                  min={10}
                  max={180}
                  onChange={(v) => setDuration(Number(v))}
                />
              </div>
              <Button className="w-full mt-4" variant="secondary" onClick={handleQuickWorkout} disabled={loading}>
                <FlameIcon className="size-5" />
                Générer un workout rapide
              </Button>
            </Card>

            {quickWorkout && <ProgramView program={quickWorkout} />}
          </div>
        )}

        {/* ── HISTORIQUE ── */}
        {tab === "history" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Vos dernières recommandations IA (recettes, plans, programmes, analyses).
              </p>
              <Button variant="secondary" onClick={loadHistory} disabled={historyLoading}>
                <HistoryIcon className="size-4" />
                Rafraîchir
              </Button>
            </div>

            {historyLoading && (
              <Card className="flex items-center justify-center py-8">
                <Loader2Icon className="size-6 text-emerald-500 animate-spin" />
              </Card>
            )}

            {!historyLoading && history && history.length === 0 && (
              <Card className="text-center py-12">
                <HistoryIcon className="size-8 text-slate-400 mx-auto mb-3" />
                <h3 className="font-semibold text-slate-700 dark:text-slate-200 mb-1">
                  Aucun historique
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm">
                  Générez des recettes, plans ou programmes pour les retrouver ici.
                </p>
              </Card>
            )}

            {!historyLoading &&
              history?.map((item) => <HistoryCard key={item._id} item={item} />)}
          </div>
        )}
      </div>

      {loading && (
        <div className="fixed inset-0 bg-slate-100/60 dark:bg-slate-900/60 backdrop-blur flex flex-col items-center justify-center z-50 gap-3">
          <Loader2Icon className="size-10 text-emerald-600 dark:text-emerald-400 animate-spin" />
          <p className="text-slate-600 dark:text-slate-300 text-sm font-medium">
            L'IA travaille… (jusqu'à 2 min)
          </p>
        </div>
      )}
    </div>
  );
};

const historyTypeStyles: Record<string, { label: string; cls: string }> = {
  nutrition: { label: "Nutrition", cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400" },
  activity: { label: "Activité", cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400" },
  general: { label: "Général", cls: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300" },
};

// Convertit un repr de dict Python (anciens enregistrements en str(result)) en
// chaîne JSON parsable. Gère les guillemets simples/doubles, True/False/None.
const pyLiteralToJson = (input: string): string => {
  let out = "";
  let buf = "";
  const flush = () => {
    out += buf
      .replace(/\bTrue\b/g, "true")
      .replace(/\bFalse\b/g, "false")
      .replace(/\bNone\b/g, "null");
    buf = "";
  };
  for (let i = 0; i < input.length; ) {
    const ch = input[i];
    if (ch === "'" || ch === '"') {
      flush();
      const quote = ch;
      i++;
      let str = "";
      while (i < input.length) {
        const c = input[i];
        if (c === "\\") {
          const next = input[i + 1];
          if (next === quote) str += quote;
          else if (next === "\\") str += "\\";
          else if (next === "n") str += "\n";
          else if (next === "t") str += "\t";
          else str += next ?? "";
          i += 2;
          continue;
        }
        if (c === quote) {
          i++;
          break;
        }
        str += c;
        i++;
      }
      out += JSON.stringify(str);
    } else {
      buf += ch;
      i++;
    }
  }
  flush();
  return out;
};

const parseContent = (content: string): any | null => {
  try {
    return JSON.parse(content);
  } catch {
    /* not clean JSON */
  }
  try {
    return JSON.parse(pyLiteralToJson(content));
  } catch {
    return null;
  }
};

const cap = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

const summarizeHistory = (data: any): string => {
  if (Array.isArray(data?.suggestions))
    return `${data.meal_label ? cap(data.meal_label) : "Recettes"} — ${data.suggestions.length} suggestion${data.suggestions.length > 1 ? "s" : ""}`;
  if (data?.weekly_plan || data?.phases)
    return data.program_name ?? data.workout_name ?? "Programme d'entraînement";
  if (data?.food_name) return data.food_name;
  if (data?.name) return data.name;
  return "Détails de la recommandation";
};

const PrettyJson = ({ value }: { value: any }) => {
  if (value === null || value === undefined)
    return <span className="text-slate-400">—</span>;
  if (typeof value !== "object") return <span>{String(value)}</span>;
  if (Array.isArray(value))
    return (
      <ul className="list-disc list-inside space-y-1">
        {value.map((v, i) => (
          <li key={i}>
            <PrettyJson value={v} />
          </li>
        ))}
      </ul>
    );
  return (
    <div className="space-y-1">
      {Object.entries(value).map(([k, v]) => (
        <div key={k}>
          <span className="font-medium text-slate-700 dark:text-slate-200">{cap(k.replace(/_/g, " "))} : </span>
          <PrettyJson value={v} />
        </div>
      ))}
    </div>
  );
};

const NutritionView = ({ data }: { data: any }) => (
  <Card>
    <h4 className="font-semibold text-slate-800 dark:text-white mb-1">{data.food_name}</h4>
    {data.portion_size && (
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">Portion : {data.portion_size}</p>
    )}
    {data.nutrition && (
      <div className="flex gap-2 mb-3">
        <MacroChip label="kcal" value={data.nutrition.calories} unit="" />
        <MacroChip label="Protéines" value={data.nutrition.protein_g} unit="g" />
        <MacroChip label="Glucides" value={data.nutrition.carbs_g} unit="g" />
        <MacroChip label="Lipides" value={data.nutrition.fat_g} unit="g" />
      </div>
    )}
    {Array.isArray(data.ingredients) && data.ingredients.length > 0 && (
      <div className="flex flex-wrap gap-1.5">
        {data.ingredients.map((ing: string, i: number) => (
          <span
            key={i}
            className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs text-slate-600 dark:text-slate-300"
          >
            {ing}
          </span>
        ))}
      </div>
    )}
  </Card>
);

const HistoryContent = ({ data }: { data: any }) => {
  if (Array.isArray(data?.suggestions)) {
    return (
      <div className="space-y-3">
        {data.suggestions.map((r: Recipe, i: number) => (
          <RecipeCard key={i} recipe={r} />
        ))}
        {data.tip && (
          <p className="text-sm text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/10 rounded-lg p-2">
            {data.tip}
          </p>
        )}
      </div>
    );
  }
  if (data?.weekly_plan || data?.phases) {
    return <ProgramView program={data as TrainingProgram} />;
  }
  if (data?.food_name) {
    return <NutritionView data={data} />;
  }
  if (data?.name && (data?.calories != null || data?.ingredients)) {
    return <RecipeCard recipe={data as Recipe} />;
  }
  return <PrettyJson value={data} />;
};

const HistoryCard = ({ item }: { item: HistoryItem }) => {
  const [expanded, setExpanded] = useState(false);
  const style = historyTypeStyles[item.type] ?? historyTypeStyles.general;
  const date = new Date(item.createdAt).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
  const data = useMemo(() => parseContent(item.content), [item.content]);
  const title = data
    ? summarizeHistory(data)
    : item.content.length > 80
      ? item.content.slice(0, 80) + "…"
      : item.content;

  return (
    <Card>
      <div className="flex items-center justify-between mb-1">
        <span className={`px-2 py-0.5 rounded-lg text-xs font-medium ${style.cls}`}>
          {style.label}
        </span>
        <span className="text-xs text-slate-400">{date}</span>
      </div>

      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full text-left flex items-center justify-between gap-2 py-1"
      >
        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{title}</span>
        <ChevronDownIcon
          className={`size-4 shrink-0 text-slate-400 transition-transform ${expanded ? "rotate-180" : ""}`}
        />
      </button>

      {expanded && (
        <div className="mt-3">
          {data ? (
            <HistoryContent data={data} />
          ) : (
            <pre className="text-xs whitespace-pre-wrap break-words bg-slate-50 dark:bg-slate-800 rounded-lg p-3 text-slate-600 dark:text-slate-300">
              {item.content}
            </pre>
          )}
        </div>
      )}

      <p className="text-[10px] text-slate-400 mt-2">{item.aiModel}</p>
    </Card>
  );
};

const ExerciseLine = ({ ex }: { ex: Exercise }) => (
  <li className="text-sm text-slate-500 dark:text-slate-400">
    • {ex.name}
    {ex.sets ? ` — ${ex.sets}×${ex.reps ?? ""}` : ex.reps ? ` — ${ex.reps}` : ""}
    {ex.duration_min ? ` — ${ex.duration_min} min` : ""}
    {ex.duration_sec ? ` — ${ex.duration_sec} s` : ""}
    {ex.notes ? <span className="text-slate-400 italic"> ({ex.notes})</span> : null}
  </li>
);

const ProgramView = ({ program }: { program: TrainingProgram }) => (
  <Card>
    <div className="mb-3">
      <h3 className="font-semibold text-slate-800 dark:text-white">
        {program.program_name ?? program.workout_name ?? "Programme"}
      </h3>
      <p className="text-xs text-slate-400">
        {[
          program.difficulty,
          program.type,
          program.weekly_sessions ? `${program.weekly_sessions} séances/sem.` : null,
          program.duration_min ? `${program.duration_min} min` : null,
        ]
          .filter(Boolean)
          .join(" · ")}
      </p>
    </div>

    {program.warm_up && program.warm_up.length > 0 && (
      <p className="text-sm text-slate-600 dark:text-slate-300 mb-2">
        <span className="font-medium">Échauffement : </span>
        {program.warm_up.join(", ")}
      </p>
    )}

    {/* Programme hebdomadaire */}
    {program.weekly_plan && (
      <div className="space-y-3 mt-2">
        {Object.entries(program.weekly_plan).map(([day, session]) => (
          <div key={day} className="border-b border-slate-100 dark:border-slate-800 pb-3 last:border-0">
            <div className="flex items-center justify-between">
              <p className="font-medium text-emerald-600 dark:text-emerald-400 capitalize">
                {dayLabels[day] ?? day}
              </p>
              {session.duration_min != null && (
                <span className="text-xs text-slate-400">{session.duration_min} min</span>
              )}
            </div>
            <p className="text-sm text-slate-700 dark:text-slate-200">
              {session.name ?? session.type}
            </p>
            {session.exercises && session.exercises.length > 0 && (
              <ul className="mt-1 space-y-0.5">
                {session.exercises.map((ex, i) => (
                  <ExerciseLine key={i} ex={ex} />
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    )}

    {/* Entraînement express (phases) */}
    {program.phases && (
      <div className="space-y-3 mt-2">
        {program.phases.map((phase, idx) => (
          <div key={idx} className="border-b border-slate-100 dark:border-slate-800 pb-3 last:border-0">
            <div className="flex items-center justify-between">
              <p className="font-medium text-emerald-600 dark:text-emerald-400 capitalize">
                {phase.phase}
              </p>
              {phase.duration_min != null && (
                <span className="text-xs text-slate-400">{phase.duration_min} min</span>
              )}
            </div>
            {phase.exercises && phase.exercises.length > 0 && (
              <ul className="mt-1 space-y-0.5">
                {phase.exercises.map((ex, i) => (
                  <ExerciseLine key={i} ex={ex} />
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    )}

    {program.coach_tip && (
      <p className="text-sm text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/10 rounded-lg p-2 mt-3">
        {program.coach_tip}
      </p>
    )}
  </Card>
);

export default Coach;

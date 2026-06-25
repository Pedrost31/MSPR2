"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRecommendationHistory = exports.getQuickWorkout = exports.getTrainingProgram = exports.getDietAnalysis = exports.getDietPlan = exports.getDietMacros = exports.generateRecipeFromIngredients = exports.getRecipeSuggestions = exports.analyzeFoodImage = exports.generateRecommendation = void 0;
const crypto_1 = __importDefault(require("crypto"));
const database_1 = require("../config/database");
const Recommendation_1 = require("../models/Recommendation");
const AILog_1 = require("../models/AILog");
const env_1 = require("../config/env");
const error_middleware_1 = require("../middlewares/error.middleware");
const buildPrompt = (profile, type, context) => {
    const lines = [
        `Nom : ${profile.name}`,
        profile.age ? `Âge : ${profile.age} ans` : null,
        profile.weight ? `Poids : ${profile.weight} kg` : null,
        profile.height ? `Taille : ${profile.height} cm` : null,
        profile.gender ? `Genre : ${profile.gender}` : null,
        profile.activityLevel ? `Niveau d'activité : ${profile.activityLevel}` : null,
        profile.goal ? `Objectif : ${profile.goal} du poids` : null,
        profile.dailyCalorieTarget ? `Cible calorique : ${profile.dailyCalorieTarget} kcal/jour` : null,
    ].filter(Boolean).join('\n');
    const typeInstructions = {
        nutrition: 'Fournis des conseils nutritionnels personnalisés et un plan alimentaire journalier.',
        activity: 'Fournis un programme d\'activité physique personnalisé pour la semaine.',
        general: 'Fournis des conseils santé et bien-être globaux.',
    };
    return `Tu es HealthAI Coach, un expert en nutrition et santé.

Profil utilisateur :
${lines}
${context ? `\nContexte supplémentaire : ${context}` : ''}

${typeInstructions[type] ?? typeInstructions['general']}
Sois précis, pratique et encourageant. Structure ta réponse avec des sections claires.
Limite ta réponse à 400 mots maximum.`;
};
const mockResponse = (type) => {
    const responses = {
        nutrition: `## Conseils nutritionnels\n\n**Répartition calorique recommandée :**\n- Protéines : 30 % (viandes maigres, légumineuses, œufs)\n- Glucides complexes : 40 % (riz complet, avoine, patate douce)\n- Lipides sains : 30 % (avocat, noix, huile d'olive)\n\n**Plan alimentaire type :**\n- Petit-déjeuner : flocons d'avoine + fruits + protéines\n- Déjeuner : protéine maigre + légumes + féculent\n- Dîner : léger, riche en légumes et protéines\n- Collation : fruits ou yaourt grec\n\n**Conseils clés :**\n- Boire 2 L d'eau par jour\n- Éviter les sucres transformés\n- Planifier les repas à l'avance`,
        activity: `## Programme d'activité\n\n**Planning hebdomadaire :**\n- Lundi : cardio 30 min (course ou vélo)\n- Mercredi : musculation full-body 45 min\n- Vendredi : cardio 30 min + étirements\n- Dimanche : marche active 45 min\n\n**Conseils :**\n- Échauffement 5-10 min avant chaque séance\n- Récupération active entre les séances\n- Augmenter progressivement l'intensité (+10 %/semaine)\n- Dormir 7-9 h pour optimiser la récupération`,
        general: `## Conseils santé globaux\n\n**Nutrition :** Privilégie les aliments entiers et non transformés. Mange à heures régulières.\n\n**Activité physique :** Vise 150 min d'activité modérée par semaine. La régularité prime sur l'intensité.\n\n**Sommeil :** 7-9 h par nuit sont essentielles à la récupération et au contrôle du poids.\n\n**Stress :** Pratique la respiration profonde ou la méditation 10 min/jour.\n\n**Hydratation :** 2-3 L d'eau quotidiennement, davantage lors de l'effort.`,
    };
    return responses[type] ?? responses['general'];
};
const callOpenAI = async (prompt, type) => {
    if (!env_1.env.OPENAI_API_KEY) {
        return { content: mockResponse(type), model: 'mock' };
    }
    try {
        const { default: OpenAI } = await Promise.resolve().then(() => __importStar(require('openai')));
        const client = new OpenAI({ apiKey: env_1.env.OPENAI_API_KEY });
        const response = await client.chat.completions.create({
            model: env_1.env.OPENAI_MODEL,
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 700,
            temperature: 0.7,
        });
        return {
            content: response.choices[0]?.message?.content ?? mockResponse(type),
            model: response.model,
            tokens: response.usage?.total_tokens,
        };
    }
    catch {
        return { content: mockResponse(type), model: 'mock-fallback' };
    }
};
const generateRecommendation = async (input) => {
    const { userId, type, context } = input;
    const requestId = crypto_1.default.randomUUID();
    const t0 = Date.now();
    const user = await database_1.prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, age: true, weight: true, height: true, gender: true, activityLevel: true, goal: true, dailyCalorieTarget: true },
    });
    if (!user)
        throw new error_middleware_1.AppError('Utilisateur introuvable', 404);
    const prompt = buildPrompt(user, type, context);
    try {
        const result = await callOpenAI(prompt, type);
        const latency = Date.now() - t0;
        const recommendation = await Recommendation_1.Recommendation.create({
            userId, type, prompt, content: result.content, aiModel: result.model, tokens: result.tokens,
        });
        await AILog_1.AILog.create({
            userId, requestId, service: 'openai', status: 'success',
            input: { type, context }, output: result.content, latencyMs: latency,
        });
        return recommendation;
    }
    catch (err) {
        await AILog_1.AILog.create({
            userId, requestId, service: 'openai', status: 'error',
            input: { type, context },
            error: err instanceof Error ? err.message : 'Erreur inconnue',
            latencyMs: Date.now() - t0,
        });
        throw err;
    }
};
exports.generateRecommendation = generateRecommendation;
const analyzeFoodImage = async (userId, imageBase64) => {
    const requestId = crypto_1.default.randomUUID();
    const t0 = Date.now();
    const safeLog = (entry) => AILog_1.AILog.create({ userId, requestId, service: 'food-recognition', ...entry }).catch(() => undefined);
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5 * 60 * 1000);
        let response;
        try {
            response = await fetch(`${env_1.env.AI_FOOD_SERVICE_URL}/api/v1/food/analyze-image`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image_base64: imageBase64, user_id: userId }),
                signal: controller.signal,
            });
        }
        finally {
            clearTimeout(timeout);
        }
        if (!response.ok) {
            const detail = await response.text().catch(() => '');
            throw new error_middleware_1.AppError(`Service d'analyse d'image indisponible (${response.status}) ${detail}`.trim(), 502);
        }
        const data = (await response.json());
        await safeLog({
            status: 'success',
            input: { type: 'image_analysis' },
            output: JSON.stringify(data.analysis),
            latencyMs: Date.now() - t0,
        });
        return data;
    }
    catch (err) {
        await safeLog({
            status: 'error',
            input: { type: 'image_analysis' },
            error: err instanceof Error ? err.message : 'Erreur inconnue',
            latencyMs: Date.now() - t0,
        });
        if (err instanceof error_middleware_1.AppError)
            throw err;
        throw new error_middleware_1.AppError("Impossible d'analyser l'image. Vérifiez que le service IA (port 8001) est démarré.", 503);
    }
};
exports.analyzeFoodImage = analyzeFoodImage;
// ── Proxy générique vers les microservices IA (FastAPI) ─────────────────────────
const callAiService = async (url, errorContext, options = {}) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4 * 60 * 1000);
    try {
        const response = await fetch(url, {
            method: options.method ?? 'GET',
            headers: options.body ? { 'Content-Type': 'application/json' } : undefined,
            body: options.body ? JSON.stringify(options.body) : undefined,
            signal: controller.signal,
        });
        if (!response.ok) {
            const detail = await response.text().catch(() => '');
            // 404 = profil utilisateur introuvable, 422 = profil incomplet → on remonte tel quel
            const status = response.status === 404 || response.status === 422 ? response.status : 502;
            throw new error_middleware_1.AppError(`${errorContext} : ${detail || `erreur ${response.status}`}`, status);
        }
        return await response.json();
    }
    catch (err) {
        if (err instanceof error_middleware_1.AppError)
            throw err;
        throw new error_middleware_1.AppError(`${errorContext} : service IA injoignable.`, 503);
    }
    finally {
        clearTimeout(timeout);
    }
};
const getRecipeSuggestions = (userId, mealType) => callAiService(`${env_1.env.AI_RECIPE_SERVICE_URL}/api/v2/recipes/suggest/${userId}?meal_type=${mealType}`, 'Suggestions de recettes');
exports.getRecipeSuggestions = getRecipeSuggestions;
const generateRecipeFromIngredients = (userId, ingredients, goal) => callAiService(`${env_1.env.AI_RECIPE_SERVICE_URL}/api/v2/recipes/generate`, 'Génération de recette', { method: 'POST', body: { user_id: userId, ingredients, goal } });
exports.generateRecipeFromIngredients = generateRecipeFromIngredients;
const getDietMacros = (userId) => callAiService(`${env_1.env.AI_DIET_SERVICE_URL}/api/v3/diet/macros/${userId}`, 'Calcul des macros');
exports.getDietMacros = getDietMacros;
const getDietPlan = (userId) => callAiService(`${env_1.env.AI_DIET_SERVICE_URL}/api/v3/diet/plan/${userId}`, 'Plan alimentaire');
exports.getDietPlan = getDietPlan;
const getDietAnalysis = (userId, days) => callAiService(`${env_1.env.AI_DIET_SERVICE_URL}/api/v3/diet/analyze/${userId}?days=${days}`, 'Analyse nutritionnelle');
exports.getDietAnalysis = getDietAnalysis;
const getTrainingProgram = (userId) => callAiService(`${env_1.env.AI_TRAINING_SERVICE_URL}/api/v4/training/program/${userId}`, "Programme d'entraînement");
exports.getTrainingProgram = getTrainingProgram;
const getQuickWorkout = (workoutType, durationMin, equipment) => callAiService(`${env_1.env.AI_TRAINING_SERVICE_URL}/api/v4/training/quick-workout`, 'Entraînement express', { method: 'POST', body: { workout_type: workoutType, duration_min: durationMin, equipment } });
exports.getQuickWorkout = getQuickWorkout;
const getRecommendationHistory = async (userId, type, limit = 10) => {
    const filter = { userId };
    if (type)
        filter['type'] = type;
    return Recommendation_1.Recommendation.find(filter).sort({ createdAt: -1 }).limit(limit).lean();
};
exports.getRecommendationHistory = getRecommendationHistory;
//# sourceMappingURL=ai.service.js.map
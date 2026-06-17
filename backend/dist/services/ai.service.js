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
exports.getRecommendationHistory = exports.generateRecommendation = void 0;
const crypto_1 = __importDefault(require("crypto"));
const database_1 = require("../config/database");
const Recommendation_1 = require("../models/Recommendation");
const AILog_1 = require("../models/AILog");
const env_1 = require("../config/env");
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
        throw new Error('Utilisateur introuvable');
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
const getRecommendationHistory = async (userId, type, limit = 10) => {
    const filter = { userId };
    if (type)
        filter['type'] = type;
    return Recommendation_1.Recommendation.find(filter).sort({ createdAt: -1 }).limit(limit).lean();
};
exports.getRecommendationHistory = getRecommendationHistory;
//# sourceMappingURL=ai.service.js.map
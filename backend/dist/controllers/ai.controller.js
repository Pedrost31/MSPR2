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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRecommendationHistoryController = exports.getQuickWorkoutController = exports.getTrainingProgramController = exports.getDietAnalysisController = exports.getDietPlanController = exports.getDietMacrosController = exports.generateRecipeController = exports.getRecipeSuggestionsController = exports.analyzeFoodImageController = exports.getRecommendationController = void 0;
const zod_1 = require("zod");
const aiService = __importStar(require("../services/ai.service"));
const response_utils_1 = require("../utils/response.utils");
const recommendSchema = zod_1.z.object({
    type: zod_1.z.enum(['nutrition', 'activity', 'general']).default('general'),
    context: zod_1.z.string().max(500).optional(),
});
const analyzeImageSchema = zod_1.z.object({
    imageBase64: zod_1.z.string().min(1, 'Image requise'),
});
const mealTypeSchema = zod_1.z.enum(['breakfast', 'lunch', 'dinner', 'snack']);
const generateRecipeSchema = zod_1.z.object({
    ingredients: zod_1.z.array(zod_1.z.string().min(1)).min(1, 'Au moins un ingrédient').max(20),
    goal: zod_1.z.string().max(100).optional(),
});
const quickWorkoutSchema = zod_1.z.object({
    workoutType: zod_1.z.enum(['cardio', 'strength', 'hiit', 'flexibility', 'yoga']).default('cardio'),
    durationMin: zod_1.z.number().int().min(10).max(180).default(30),
    equipment: zod_1.z.array(zod_1.z.string()).max(20).default([]),
});
const getRecommendationController = async (req, res, next) => {
    try {
        const { type, context } = recommendSchema.parse(req.body);
        const rec = await aiService.generateRecommendation({ userId: req.user.userId, type, context });
        (0, response_utils_1.sendSuccess)(res, rec, 200, 'Recommandation générée');
    }
    catch (err) {
        next(err);
    }
};
exports.getRecommendationController = getRecommendationController;
const analyzeFoodImageController = async (req, res, next) => {
    try {
        const { imageBase64 } = analyzeImageSchema.parse(req.body);
        const result = await aiService.analyzeFoodImage(req.user.userId, imageBase64);
        (0, response_utils_1.sendSuccess)(res, result, 200, 'Image analysée');
    }
    catch (err) {
        next(err);
    }
};
exports.analyzeFoodImageController = analyzeFoodImageController;
const getRecipeSuggestionsController = async (req, res, next) => {
    try {
        const mealType = mealTypeSchema.parse(req.query['mealType']);
        const result = await aiService.getRecipeSuggestions(req.user.userId, mealType);
        (0, response_utils_1.sendSuccess)(res, result, 200, 'Recettes suggérées');
    }
    catch (err) {
        next(err);
    }
};
exports.getRecipeSuggestionsController = getRecipeSuggestionsController;
const generateRecipeController = async (req, res, next) => {
    try {
        const { ingredients, goal } = generateRecipeSchema.parse(req.body);
        const result = await aiService.generateRecipeFromIngredients(req.user.userId, ingredients, goal ?? 'maintenir le poids');
        (0, response_utils_1.sendSuccess)(res, result, 200, 'Recette générée');
    }
    catch (err) {
        next(err);
    }
};
exports.generateRecipeController = generateRecipeController;
const getDietMacrosController = async (req, res, next) => {
    try {
        const result = await aiService.getDietMacros(req.user.userId);
        (0, response_utils_1.sendSuccess)(res, result);
    }
    catch (err) {
        next(err);
    }
};
exports.getDietMacrosController = getDietMacrosController;
const getDietPlanController = async (req, res, next) => {
    try {
        const result = await aiService.getDietPlan(req.user.userId);
        (0, response_utils_1.sendSuccess)(res, result, 200, 'Plan alimentaire généré');
    }
    catch (err) {
        next(err);
    }
};
exports.getDietPlanController = getDietPlanController;
const getDietAnalysisController = async (req, res, next) => {
    try {
        const days = req.query['days'] ? parseInt(req.query['days'], 10) : 7;
        const result = await aiService.getDietAnalysis(req.user.userId, days);
        (0, response_utils_1.sendSuccess)(res, result, 200, 'Analyse nutritionnelle générée');
    }
    catch (err) {
        next(err);
    }
};
exports.getDietAnalysisController = getDietAnalysisController;
const getTrainingProgramController = async (req, res, next) => {
    try {
        const result = await aiService.getTrainingProgram(req.user.userId);
        (0, response_utils_1.sendSuccess)(res, result, 200, "Programme d'entraînement généré");
    }
    catch (err) {
        next(err);
    }
};
exports.getTrainingProgramController = getTrainingProgramController;
const getQuickWorkoutController = async (req, res, next) => {
    try {
        const { workoutType, durationMin, equipment } = quickWorkoutSchema.parse(req.body);
        const result = await aiService.getQuickWorkout(workoutType, durationMin, equipment);
        (0, response_utils_1.sendSuccess)(res, result, 200, 'Entraînement express généré');
    }
    catch (err) {
        next(err);
    }
};
exports.getQuickWorkoutController = getQuickWorkoutController;
const getRecommendationHistoryController = async (req, res, next) => {
    try {
        const type = req.query['type'];
        const limit = req.query['limit'] ? parseInt(req.query['limit'], 10) : 10;
        const history = await aiService.getRecommendationHistory(req.user.userId, type, limit);
        (0, response_utils_1.sendSuccess)(res, history);
    }
    catch (err) {
        next(err);
    }
};
exports.getRecommendationHistoryController = getRecommendationHistoryController;
//# sourceMappingURL=ai.controller.js.map
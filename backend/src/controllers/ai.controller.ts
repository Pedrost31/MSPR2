import { Response, NextFunction } from 'express';
import { z } from 'zod';
import * as aiService from '../services/ai.service';
import { sendSuccess } from '../utils/response.utils';
import { AuthRequest } from '../types';

const recommendSchema = z.object({
  type:    z.enum(['nutrition', 'activity', 'general']).default('general'),
  context: z.string().max(500).optional(),
});

const analyzeImageSchema = z.object({
  imageBase64: z.string().min(1, 'Image requise'),
});

const mealTypeSchema = z.enum(['breakfast', 'lunch', 'dinner', 'snack']);

const generateRecipeSchema = z.object({
  ingredients: z.array(z.string().min(1)).min(1, 'Au moins un ingrédient').max(20),
  goal: z.string().max(100).optional(),
});

const quickWorkoutSchema = z.object({
  workoutType: z.enum(['cardio', 'strength', 'hiit', 'flexibility', 'yoga']).default('cardio'),
  durationMin: z.number().int().min(10).max(180).default(30),
  equipment: z.array(z.string()).max(20).default([]),
});

export const getRecommendationController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { type, context } = recommendSchema.parse(req.body);
    const rec = await aiService.generateRecommendation({ userId: req.user!.userId, type, context });
    sendSuccess(res, rec, 200, 'Recommandation générée');
  } catch (err) { next(err); }
};

export const analyzeFoodImageController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { imageBase64 } = analyzeImageSchema.parse(req.body);
    const result = await aiService.analyzeFoodImage(req.user!.userId, imageBase64);
    sendSuccess(res, result, 200, 'Image analysée');
  } catch (err) { next(err); }
};

export const getRecipeSuggestionsController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const mealType = mealTypeSchema.parse(req.query['mealType']);
    const result = await aiService.getRecipeSuggestions(req.user!.userId, mealType);
    sendSuccess(res, result, 200, 'Recettes suggérées');
  } catch (err) { next(err); }
};

export const generateRecipeController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { ingredients, goal } = generateRecipeSchema.parse(req.body);
    const result = await aiService.generateRecipeFromIngredients(
      req.user!.userId,
      ingredients,
      goal ?? 'maintenir le poids',
    );
    sendSuccess(res, result, 200, 'Recette générée');
  } catch (err) { next(err); }
};

export const getDietMacrosController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await aiService.getDietMacros(req.user!.userId);
    sendSuccess(res, result);
  } catch (err) { next(err); }
};

export const getDietPlanController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await aiService.getDietPlan(req.user!.userId);
    sendSuccess(res, result, 200, 'Plan alimentaire généré');
  } catch (err) { next(err); }
};

export const getDietAnalysisController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const days = req.query['days'] ? parseInt(req.query['days'] as string, 10) : 7;
    const result = await aiService.getDietAnalysis(req.user!.userId, days);
    sendSuccess(res, result, 200, 'Analyse nutritionnelle générée');
  } catch (err) { next(err); }
};

export const getTrainingProgramController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await aiService.getTrainingProgram(req.user!.userId);
    sendSuccess(res, result, 200, "Programme d'entraînement généré");
  } catch (err) { next(err); }
};

export const getQuickWorkoutController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { workoutType, durationMin, equipment } = quickWorkoutSchema.parse(req.body);
    const result = await aiService.getQuickWorkout(workoutType, durationMin, equipment);
    sendSuccess(res, result, 200, 'Entraînement express généré');
  } catch (err) { next(err); }
};

export const getRecommendationHistoryController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const type  = req.query['type']  as 'nutrition' | 'activity' | 'general' | undefined;
    const limit = req.query['limit'] ? parseInt(req.query['limit'] as string, 10) : 10;
    const history = await aiService.getRecommendationHistory(req.user!.userId, type, limit);
    sendSuccess(res, history);
  } catch (err) { next(err); }
};

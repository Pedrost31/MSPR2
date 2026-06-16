import { Response, NextFunction } from 'express';
import * as foodService from '../services/food.service';
import { sendSuccess } from '../utils/response.utils';
import { AuthRequest } from '../types';

export const createFoodEntryController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const entry = await foodService.createFoodEntry(req.user!.userId, req.body);
    sendSuccess(res, entry, 201);
  } catch (err) { next(err); }
};

export const getFoodEntriesController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await foodService.getFoodEntries(req.user!.userId, {
      startDate: req.query['startDate'] as string | undefined,
      endDate:   req.query['endDate']   as string | undefined,
      mealType:  req.query['mealType']  as string | undefined,
      page:      req.query['page']  ? parseInt(req.query['page']  as string, 10) : 1,
      limit:     req.query['limit'] ? parseInt(req.query['limit'] as string, 10) : 50,
    });
    sendSuccess(res, result);
  } catch (err) { next(err); }
};

export const getFoodEntryByIdController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const entry = await foodService.getFoodEntryById(req.params['id']!, req.user!.userId);
    sendSuccess(res, entry);
  } catch (err) { next(err); }
};

export const updateFoodEntryController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const entry = await foodService.updateFoodEntry(req.params['id']!, req.user!.userId, req.body);
    sendSuccess(res, entry);
  } catch (err) { next(err); }
};

export const deleteFoodEntryController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await foodService.deleteFoodEntry(req.params['id']!, req.user!.userId);
    sendSuccess(res, null, 200, 'Entrée supprimée');
  } catch (err) { next(err); }
};

export const getDailySummaryController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const date = (req.query['date'] as string | undefined) ?? new Date().toISOString().split('T')[0]!;
    const summary = await foodService.getDailyNutritionSummary(req.user!.userId, date);
    sendSuccess(res, summary);
  } catch (err) { next(err); }
};

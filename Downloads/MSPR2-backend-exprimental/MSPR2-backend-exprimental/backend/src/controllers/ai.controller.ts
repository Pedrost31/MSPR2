import { Response, NextFunction } from 'express';
import { z } from 'zod';
import * as aiService from '../services/ai.service';
import { sendSuccess } from '../utils/response.utils';
import { AuthRequest } from '../types';

const recommendSchema = z.object({
  type:    z.enum(['nutrition', 'activity', 'general']).default('general'),
  context: z.string().max(500).optional(),
});

export const getRecommendationController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { type, context } = recommendSchema.parse(req.body);
    const rec = await aiService.generateRecommendation({ userId: req.user!.userId, type, context });
    sendSuccess(res, rec, 200, 'Recommandation générée');
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

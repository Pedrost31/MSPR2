import { Response, NextFunction } from 'express';
import * as goalService from '../services/goal.service';
import { sendSuccess } from '../utils/response.utils';
import { AuthRequest } from '../types';

export const getGoalsController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const goals = await goalService.getGoals(req.user!.userId);
    sendSuccess(res, goals);
  } catch (err) { next(err); }
};

export const updateGoalsController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const goals = await goalService.updateGoals(req.user!.userId, req.body);
    sendSuccess(res, goals, 200, 'Objectifs mis à jour');
  } catch (err) { next(err); }
};

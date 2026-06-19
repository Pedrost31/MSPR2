import { Response, NextFunction } from 'express';
import * as activityService from '../services/activity.service';
import { sendSuccess } from '../utils/response.utils';
import { AuthRequest } from '../types';

export const createActivityController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const entry = await activityService.createActivity(req.user!.userId, req.body);
    sendSuccess(res, entry, 201);
  } catch (err) { next(err); }
};

export const getActivitiesController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await activityService.getActivities(req.user!.userId, {
      startDate: req.query['startDate'] as string | undefined,
      endDate:   req.query['endDate']   as string | undefined,
      type:      req.query['type']      as string | undefined,
      page:      req.query['page']  ? parseInt(req.query['page']  as string, 10) : 1,
      limit:     req.query['limit'] ? parseInt(req.query['limit'] as string, 10) : 50,
    });
    sendSuccess(res, result);
  } catch (err) { next(err); }
};

export const getActivityByIdController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const entry = await activityService.getActivityById(req.params['id']!, req.user!.userId);
    sendSuccess(res, entry);
  } catch (err) { next(err); }
};

export const updateActivityController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const entry = await activityService.updateActivity(req.params['id']!, req.user!.userId, req.body);
    sendSuccess(res, entry);
  } catch (err) { next(err); }
};

export const deleteActivityController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await activityService.deleteActivity(req.params['id']!, req.user!.userId);
    sendSuccess(res, null, 200, 'Activité supprimée');
  } catch (err) { next(err); }
};

export const getWeeklySummaryController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const summary = await activityService.getWeeklyActivitySummary(req.user!.userId);
    sendSuccess(res, summary);
  } catch (err) { next(err); }
};

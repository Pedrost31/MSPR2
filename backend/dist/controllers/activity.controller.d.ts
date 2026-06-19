import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
export declare const createActivityController: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const getActivitiesController: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const getActivityByIdController: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const updateActivityController: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const deleteActivityController: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const getWeeklySummaryController: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;

import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
export declare const getRecommendationController: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const getRecommendationHistoryController: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;

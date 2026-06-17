import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
export declare const getGoalsController: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const updateGoalsController: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;

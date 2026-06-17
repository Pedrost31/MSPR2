import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
export declare const createFoodEntryController: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const getFoodEntriesController: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const getFoodEntryByIdController: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const updateFoodEntryController: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const deleteFoodEntryController: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const getDailySummaryController: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;

import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
export declare const getMeController: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const updateMeController: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const deleteMeController: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;

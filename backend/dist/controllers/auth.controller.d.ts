import { Request, Response, NextFunction } from 'express';
export declare const registerController: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const loginController: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const refreshController: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const logoutController: (req: Request, res: Response, next: NextFunction) => Promise<void>;

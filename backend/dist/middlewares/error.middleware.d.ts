import { Request, Response, NextFunction } from 'express';
export declare class AppError extends Error {
    message: string;
    statusCode: number;
    errors?: string[] | undefined;
    constructor(message: string, statusCode?: number, errors?: string[] | undefined);
}
export declare const errorMiddleware: (err: Error, _req: Request, res: Response, _next: NextFunction) => void;

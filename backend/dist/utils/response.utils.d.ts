import { Response } from 'express';
export declare const sendSuccess: <T>(res: Response, data: T, statusCode?: number, message?: string) => Response;
export declare const sendError: (res: Response, message: string, statusCode?: number, errors?: string[]) => Response;

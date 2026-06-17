import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { sendError } from '../utils/response.utils';

export class AppError extends Error {
  constructor(
    public override message: string,
    public statusCode: number = 400,
    public errors?: string[],
  ) {
    super(message);
    this.name = 'AppError';
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const errorMiddleware = (err: Error, _req: Request, res: Response, _next: NextFunction): void => {
  if (err instanceof ZodError) {
    const errors = err.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
    sendError(res, 'Validation error', 422, errors);
    return;
  }

  if (err instanceof AppError) {
    sendError(res, err.message, err.statusCode, err.errors);
    return;
  }

  console.error('[Error]', err);
  sendError(res, 'Internal server error', 500);
};

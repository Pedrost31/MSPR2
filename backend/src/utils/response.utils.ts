import { Response } from 'express';
import { ApiResponse } from '../types';

export const sendSuccess = <T>(
  res: Response,
  data: T,
  statusCode = 200,
  message?: string,
): Response => {
  const body: ApiResponse<T> = { success: true, data, ...(message ? { message } : {}) };
  return res.status(statusCode).json(body);
};

export const sendError = (
  res: Response,
  message: string,
  statusCode = 400,
  errors?: string[],
): Response => {
  const body: ApiResponse = { success: false, message, ...(errors ? { errors } : {}) };
  return res.status(statusCode).json(body);
};

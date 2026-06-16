import { Request, Response, NextFunction } from 'express';
import * as authService from '../services/auth.service';
import { sendSuccess } from '../utils/response.utils';

export const registerController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await authService.register(req.body);
    sendSuccess(res, result, 201, 'Inscription réussie');
  } catch (err) { next(err); }
};

export const loginController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await authService.login(req.body);
    sendSuccess(res, result, 200, 'Connexion réussie');
  } catch (err) { next(err); }
};

export const refreshController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await authService.refreshTokens(req.body.refreshToken as string);
    sendSuccess(res, result);
  } catch (err) { next(err); }
};

export const logoutController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await authService.logout(req.body.refreshToken as string);
    sendSuccess(res, null, 200, 'Déconnexion réussie');
  } catch (err) { next(err); }
};

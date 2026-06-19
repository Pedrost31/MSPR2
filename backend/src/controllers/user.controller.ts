import { Response, NextFunction } from 'express';
import * as userService from '../services/user.service';
import { sendSuccess } from '../utils/response.utils';
import { AuthRequest } from '../types';

export const getMeController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await userService.getUserById(req.user!.userId);
    sendSuccess(res, user);
  } catch (err) { next(err); }
};

export const updateMeController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await userService.updateUser(req.user!.userId, req.body);
    sendSuccess(res, user, 200, 'Profil mis à jour');
  } catch (err) { next(err); }
};

export const deleteMeController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await userService.deleteUser(req.user!.userId);
    sendSuccess(res, null, 200, 'Compte supprimé');
  } catch (err) { next(err); }
};

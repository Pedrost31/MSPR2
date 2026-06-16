import { z } from 'zod';

export const registerSchema = z.object({
  email:         z.string().email('Email invalide'),
  password:      z.string().min(8, 'Mot de passe : 8 caractères minimum'),
  name:          z.string().min(1).max(100),
  age:           z.number().int().min(1).max(150).optional(),
  weight:        z.number().positive().optional(),
  height:        z.number().positive().optional(),
  gender:        z.enum(['male', 'female', 'other']).optional(),
  activityLevel: z.enum(['sedentary', 'light', 'moderate', 'active', 'very_active']).optional(),
  goal:          z.enum(['lose', 'maintain', 'gain']).optional(),
});

export const loginSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(1),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput    = z.infer<typeof loginSchema>;

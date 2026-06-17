import { z } from 'zod';

export const updateUserSchema = z.object({
  name:              z.string().min(1).max(100).optional(),
  age:               z.number().int().min(1).max(150).optional(),
  weight:            z.number().positive().optional(),
  height:            z.number().positive().optional(),
  gender:            z.enum(['male', 'female', 'other']).optional(),
  activityLevel:     z.enum(['sedentary', 'light', 'moderate', 'active', 'very_active']).optional(),
  goal:              z.enum(['lose', 'maintain', 'gain']).optional(),
  dailyCalorieTarget:z.number().int().positive().optional(),
  password:          z.string().min(8).optional(),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;

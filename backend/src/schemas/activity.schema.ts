import { z } from 'zod';

export const createActivitySchema = z.object({
  name:          z.string().min(1).max(200),
  duration:      z.number().int().positive('Durée en minutes requise'),
  caloriesBurned:z.number().nonnegative(),
  type:          z.enum(['cardio', 'strength', 'flexibility', 'sports', 'other']).optional(),
  date:          z.string().datetime().optional(),
});

export const updateActivitySchema = createActivitySchema.partial();

export type CreateActivityInput = z.infer<typeof createActivitySchema>;
export type UpdateActivityInput = z.infer<typeof updateActivitySchema>;

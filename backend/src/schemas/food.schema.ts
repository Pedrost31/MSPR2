import { z } from 'zod';

export const createFoodEntrySchema = z.object({
  name:     z.string().min(1).max(200),
  calories: z.number().nonnegative(),
  protein:  z.number().nonnegative().optional(),
  carbs:    z.number().nonnegative().optional(),
  fat:      z.number().nonnegative().optional(),
  fiber:    z.number().nonnegative().optional(),
  mealType: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
  date:     z.string().datetime().optional(),
});

export const updateFoodEntrySchema = createFoodEntrySchema.partial();

export type CreateFoodEntryInput = z.infer<typeof createFoodEntrySchema>;
export type UpdateFoodEntryInput = z.infer<typeof updateFoodEntrySchema>;

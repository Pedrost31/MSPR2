import { z } from 'zod';

export const updateGoalSchema = z.object({
  dailyCalorieTarget:  z.number().int().positive().optional(),
  dailyProteinTarget:  z.number().positive().optional(),
  dailyCarbsTarget:    z.number().positive().optional(),
  dailyFatTarget:      z.number().positive().optional(),
  weeklyWorkoutTarget: z.number().int().positive().optional(),
  targetWeight:        z.number().positive().optional(),
});

export type UpdateGoalInput = z.infer<typeof updateGoalSchema>;

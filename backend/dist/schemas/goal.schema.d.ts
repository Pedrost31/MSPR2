import { z } from 'zod';
export declare const updateGoalSchema: z.ZodObject<{
    dailyCalorieTarget: z.ZodOptional<z.ZodNumber>;
    dailyProteinTarget: z.ZodOptional<z.ZodNumber>;
    dailyCarbsTarget: z.ZodOptional<z.ZodNumber>;
    dailyFatTarget: z.ZodOptional<z.ZodNumber>;
    weeklyWorkoutTarget: z.ZodOptional<z.ZodNumber>;
    targetWeight: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    dailyCalorieTarget?: number | undefined;
    dailyProteinTarget?: number | undefined;
    dailyCarbsTarget?: number | undefined;
    dailyFatTarget?: number | undefined;
    weeklyWorkoutTarget?: number | undefined;
    targetWeight?: number | undefined;
}, {
    dailyCalorieTarget?: number | undefined;
    dailyProteinTarget?: number | undefined;
    dailyCarbsTarget?: number | undefined;
    dailyFatTarget?: number | undefined;
    weeklyWorkoutTarget?: number | undefined;
    targetWeight?: number | undefined;
}>;
export type UpdateGoalInput = z.infer<typeof updateGoalSchema>;

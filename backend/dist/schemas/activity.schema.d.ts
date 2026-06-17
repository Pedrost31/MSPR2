import { z } from 'zod';
export declare const createActivitySchema: z.ZodObject<{
    name: z.ZodString;
    duration: z.ZodNumber;
    caloriesBurned: z.ZodNumber;
    type: z.ZodOptional<z.ZodEnum<["cardio", "strength", "flexibility", "sports", "other"]>>;
    date: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name: string;
    duration: number;
    caloriesBurned: number;
    type?: "other" | "cardio" | "strength" | "flexibility" | "sports" | undefined;
    date?: string | undefined;
}, {
    name: string;
    duration: number;
    caloriesBurned: number;
    type?: "other" | "cardio" | "strength" | "flexibility" | "sports" | undefined;
    date?: string | undefined;
}>;
export declare const updateActivitySchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    duration: z.ZodOptional<z.ZodNumber>;
    caloriesBurned: z.ZodOptional<z.ZodNumber>;
    type: z.ZodOptional<z.ZodOptional<z.ZodEnum<["cardio", "strength", "flexibility", "sports", "other"]>>>;
    date: z.ZodOptional<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    type?: "other" | "cardio" | "strength" | "flexibility" | "sports" | undefined;
    date?: string | undefined;
    duration?: number | undefined;
    caloriesBurned?: number | undefined;
}, {
    name?: string | undefined;
    type?: "other" | "cardio" | "strength" | "flexibility" | "sports" | undefined;
    date?: string | undefined;
    duration?: number | undefined;
    caloriesBurned?: number | undefined;
}>;
export type CreateActivityInput = z.infer<typeof createActivitySchema>;
export type UpdateActivityInput = z.infer<typeof updateActivitySchema>;

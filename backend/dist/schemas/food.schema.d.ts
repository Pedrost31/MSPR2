import { z } from 'zod';
export declare const createFoodEntrySchema: z.ZodObject<{
    name: z.ZodString;
    calories: z.ZodNumber;
    protein: z.ZodOptional<z.ZodNumber>;
    carbs: z.ZodOptional<z.ZodNumber>;
    fat: z.ZodOptional<z.ZodNumber>;
    fiber: z.ZodOptional<z.ZodNumber>;
    mealType: z.ZodEnum<["breakfast", "lunch", "dinner", "snack"]>;
    date: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name: string;
    calories: number;
    mealType: "breakfast" | "lunch" | "dinner" | "snack";
    protein?: number | undefined;
    carbs?: number | undefined;
    fat?: number | undefined;
    fiber?: number | undefined;
    date?: string | undefined;
}, {
    name: string;
    calories: number;
    mealType: "breakfast" | "lunch" | "dinner" | "snack";
    protein?: number | undefined;
    carbs?: number | undefined;
    fat?: number | undefined;
    fiber?: number | undefined;
    date?: string | undefined;
}>;
export declare const updateFoodEntrySchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    calories: z.ZodOptional<z.ZodNumber>;
    protein: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    carbs: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    fat: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    fiber: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    mealType: z.ZodOptional<z.ZodEnum<["breakfast", "lunch", "dinner", "snack"]>>;
    date: z.ZodOptional<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    calories?: number | undefined;
    protein?: number | undefined;
    carbs?: number | undefined;
    fat?: number | undefined;
    fiber?: number | undefined;
    mealType?: "breakfast" | "lunch" | "dinner" | "snack" | undefined;
    date?: string | undefined;
}, {
    name?: string | undefined;
    calories?: number | undefined;
    protein?: number | undefined;
    carbs?: number | undefined;
    fat?: number | undefined;
    fiber?: number | undefined;
    mealType?: "breakfast" | "lunch" | "dinner" | "snack" | undefined;
    date?: string | undefined;
}>;
export type CreateFoodEntryInput = z.infer<typeof createFoodEntrySchema>;
export type UpdateFoodEntryInput = z.infer<typeof updateFoodEntrySchema>;

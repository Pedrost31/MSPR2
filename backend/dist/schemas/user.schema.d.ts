import { z } from 'zod';
export declare const updateUserSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    age: z.ZodOptional<z.ZodNumber>;
    weight: z.ZodOptional<z.ZodNumber>;
    height: z.ZodOptional<z.ZodNumber>;
    gender: z.ZodOptional<z.ZodEnum<["male", "female", "other"]>>;
    activityLevel: z.ZodOptional<z.ZodEnum<["sedentary", "light", "moderate", "active", "very_active"]>>;
    goal: z.ZodOptional<z.ZodEnum<["lose", "maintain", "gain"]>>;
    dailyCalorieTarget: z.ZodOptional<z.ZodNumber>;
    password: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    password?: string | undefined;
    name?: string | undefined;
    age?: number | undefined;
    weight?: number | undefined;
    height?: number | undefined;
    gender?: "other" | "male" | "female" | undefined;
    activityLevel?: "sedentary" | "light" | "moderate" | "active" | "very_active" | undefined;
    goal?: "lose" | "maintain" | "gain" | undefined;
    dailyCalorieTarget?: number | undefined;
}, {
    password?: string | undefined;
    name?: string | undefined;
    age?: number | undefined;
    weight?: number | undefined;
    height?: number | undefined;
    gender?: "other" | "male" | "female" | undefined;
    activityLevel?: "sedentary" | "light" | "moderate" | "active" | "very_active" | undefined;
    goal?: "lose" | "maintain" | "gain" | undefined;
    dailyCalorieTarget?: number | undefined;
}>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;

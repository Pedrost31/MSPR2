import { z } from 'zod';
export declare const registerSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
    name: z.ZodString;
    age: z.ZodOptional<z.ZodNumber>;
    weight: z.ZodOptional<z.ZodNumber>;
    height: z.ZodOptional<z.ZodNumber>;
    gender: z.ZodOptional<z.ZodEnum<["male", "female", "other"]>>;
    activityLevel: z.ZodOptional<z.ZodEnum<["sedentary", "light", "moderate", "active", "very_active"]>>;
    goal: z.ZodOptional<z.ZodEnum<["lose", "maintain", "gain"]>>;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
    name: string;
    age?: number | undefined;
    weight?: number | undefined;
    height?: number | undefined;
    gender?: "other" | "male" | "female" | undefined;
    activityLevel?: "sedentary" | "light" | "moderate" | "active" | "very_active" | undefined;
    goal?: "lose" | "maintain" | "gain" | undefined;
}, {
    email: string;
    password: string;
    name: string;
    age?: number | undefined;
    weight?: number | undefined;
    height?: number | undefined;
    gender?: "other" | "male" | "female" | undefined;
    activityLevel?: "sedentary" | "light" | "moderate" | "active" | "very_active" | undefined;
    goal?: "lose" | "maintain" | "gain" | undefined;
}>;
export declare const loginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
}, {
    email: string;
    password: string;
}>;
export declare const refreshTokenSchema: z.ZodObject<{
    refreshToken: z.ZodString;
}, "strip", z.ZodTypeAny, {
    refreshToken: string;
}, {
    refreshToken: string;
}>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

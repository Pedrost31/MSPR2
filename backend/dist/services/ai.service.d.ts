export declare const generateRecommendation: (input: {
    userId: string;
    type: "nutrition" | "activity" | "general";
    context?: string;
}) => Promise<import("mongoose").Document<unknown, {}, import("../models/Recommendation").IRecommendation, {}, {}> & import("../models/Recommendation").IRecommendation & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}>;
export declare const analyzeFoodImage: (userId: string, imageBase64: string) => Promise<{
    request_id?: string;
    analysis: unknown;
    latency_ms?: number;
}>;
export declare const getRecipeSuggestions: (userId: string, mealType: string) => Promise<unknown>;
export declare const generateRecipeFromIngredients: (userId: string, ingredients: string[], goal: string) => Promise<unknown>;
export declare const getDietMacros: (userId: string) => Promise<unknown>;
export declare const getDietPlan: (userId: string) => Promise<unknown>;
export declare const getDietAnalysis: (userId: string, days: number) => Promise<unknown>;
export declare const getTrainingProgram: (userId: string) => Promise<unknown>;
export declare const getQuickWorkout: (workoutType: string, durationMin: number, equipment: string[]) => Promise<unknown>;
export declare const getRecommendationHistory: (userId: string, type?: string, limit?: number) => Promise<(import("mongoose").FlattenMaps<import("../models/Recommendation").IRecommendation> & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
})[]>;

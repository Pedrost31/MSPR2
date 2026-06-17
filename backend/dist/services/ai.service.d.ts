export declare const generateRecommendation: (input: {
    userId: string;
    type: "nutrition" | "activity" | "general";
    context?: string;
}) => Promise<import("mongoose").Document<unknown, {}, import("../models/Recommendation").IRecommendation, {}, {}> & import("../models/Recommendation").IRecommendation & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}>;
export declare const getRecommendationHistory: (userId: string, type?: string, limit?: number) => Promise<(import("mongoose").FlattenMaps<import("../models/Recommendation").IRecommendation> & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
})[]>;

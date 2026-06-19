import mongoose, { Document } from 'mongoose';
export interface IRecommendation extends Document {
    userId: string;
    type: 'nutrition' | 'activity' | 'general';
    prompt: string;
    content: string;
    aiModel: string;
    tokens?: number;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Recommendation: mongoose.Model<IRecommendation, {}, {}, {}, mongoose.Document<unknown, {}, IRecommendation, {}, {}> & IRecommendation & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;

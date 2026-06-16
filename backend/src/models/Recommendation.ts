import mongoose, { Schema, Document } from 'mongoose';

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

const RecommendationSchema = new Schema<IRecommendation>(
  {
    userId:  { type: String, required: true, index: true },
    type:    { type: String, enum: ['nutrition', 'activity', 'general'], required: true },
    prompt:  { type: String, required: true },
    content: { type: String, required: true },
    aiModel: { type: String, required: true },
    tokens:  { type: Number },
  },
  { timestamps: true },
);

export const Recommendation = mongoose.model<IRecommendation>(
  'Recommendation',
  RecommendationSchema,
);

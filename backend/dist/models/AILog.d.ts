import mongoose, { Document } from 'mongoose';
export interface IAILog extends Document {
    userId: string;
    requestId: string;
    service: string;
    status: 'success' | 'error';
    input: object;
    output?: string;
    error?: string;
    latencyMs?: number;
    createdAt: Date;
}
export declare const AILog: mongoose.Model<IAILog, {}, {}, {}, mongoose.Document<unknown, {}, IAILog, {}, {}> & IAILog & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;

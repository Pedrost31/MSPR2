import mongoose, { Schema, Document } from 'mongoose';

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

const AILogSchema = new Schema<IAILog>(
  {
    userId:    { type: String, required: true, index: true },
    requestId: { type: String, required: true },
    service:   { type: String, required: true },
    status:    { type: String, enum: ['success', 'error'], required: true },
    input:     { type: Schema.Types.Mixed, required: true },
    output:    { type: String },
    error:     { type: String },
    latencyMs: { type: Number },
  },
  { timestamps: true },
);

export const AILog = mongoose.model<IAILog>('AILog', AILogSchema);

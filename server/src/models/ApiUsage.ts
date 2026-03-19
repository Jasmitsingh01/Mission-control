import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IApiUsage extends Document {
  userId: mongoose.Types.ObjectId;
  date: string;
  requestCount: number;
  tokensUsed: number;
  costEstimate: number;
}

const apiUsageSchema = new Schema<IApiUsage>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    date: { type: String, required: true, index: true },
    requestCount: { type: Number, default: 0 },
    tokensUsed: { type: Number, default: 0 },
    costEstimate: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Compound unique index
apiUsageSchema.index({ userId: 1, date: 1 }, { unique: true });

const ApiUsage: Model<IApiUsage> = mongoose.model<IApiUsage>('ApiUsage', apiUsageSchema);

export default ApiUsage;

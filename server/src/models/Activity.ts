import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IActivity extends Document {
  eventType: string;
  workspaceId?: string;
  actorType: 'user' | 'agent' | 'system';
  actorId?: string;
  targetType?: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

const activitySchema = new Schema<IActivity>({
  eventType: { type: String, required: true },
  workspaceId: { type: String },
  actorType: { type: String, enum: ['user', 'agent', 'system'], required: true },
  actorId: { type: String },
  targetType: { type: String },
  targetId: { type: String },
  metadata: { type: Schema.Types.Mixed },
}, { timestamps: { createdAt: true, updatedAt: false } });

const Activity: Model<IActivity> = mongoose.model<IActivity>('Activity', activitySchema);
export default Activity;

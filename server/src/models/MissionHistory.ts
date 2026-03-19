import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IMissionAgent {
  name: string;
  role: string;
  provider: string;
  model: string;
}

export interface IMissionTask {
  title: string;
  description: string;
  priority: string;
  status: string;
  assignedAgentRole: string;
}

export interface IMissionHistory extends Document {
  userId: mongoose.Types.ObjectId;
  missionName: string;
  description: string;
  summary: string;
  agents: IMissionAgent[];
  tasks: IMissionTask[];
  estimatedPhases: string[];
  status: 'completed' | 'failed' | 'archived';
  completedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const missionAgentSchema = new Schema(
  {
    name: { type: String },
    role: { type: String },
    provider: { type: String },
    model: { type: String },
  },
  { _id: false }
);

const missionTaskSchema = new Schema(
  {
    title: { type: String },
    description: { type: String },
    priority: { type: String },
    status: { type: String },
    assignedAgentRole: { type: String },
  },
  { _id: false }
);

const missionHistorySchema = new Schema<IMissionHistory>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    missionName: { type: String },
    description: { type: String },
    summary: { type: String },
    agents: [missionAgentSchema],
    tasks: [missionTaskSchema],
    estimatedPhases: [{ type: String }],
    status: {
      type: String,
      enum: ['completed', 'failed', 'archived'],
      default: 'completed',
    },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

// Compound index for efficient queries
missionHistorySchema.index({ userId: 1, createdAt: -1 });

const MissionHistory: Model<IMissionHistory> = mongoose.model<IMissionHistory>(
  'MissionHistory',
  missionHistorySchema
);

export default MissionHistory;

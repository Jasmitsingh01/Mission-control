import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IAgent extends Document {
  name: string;
  status: 'provisioning' | 'active' | 'offline' | 'degraded' | 'deleting';
  color?: string;
  initial?: string;
  workspaceId?: mongoose.Types.ObjectId;
  gatewayId?: mongoose.Types.ObjectId;
  openclawSessionId?: string;
  agentTokenHash?: string;
  heartbeatConfig?: Record<string, unknown>;
  identityProfile?: Record<string, unknown>;
  identityTemplate?: string;
  soulTemplate?: string;
  provisionRequestedAt?: Date;
  provisionConfirmTokenHash?: string;
  provisionAction?: string;
  deleteRequestedAt?: Date;
  deleteConfirmTokenHash?: string;
  lastSeenAt?: Date;
  lifecycleGeneration: number;
  wakeAttempts: number;
  lastWakeSentAt?: Date;
  checkinDeadlineAt?: Date;
  lastProvisionError?: string;
  isBoardLead: boolean;
  isGatewayMain: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const agentSchema = new Schema<IAgent>({
  name: { type: String, required: true, index: true },
  status: {
    type: String,
    default: 'provisioning',
    enum: ['provisioning', 'active', 'offline', 'degraded', 'deleting'],
  },
  color: { type: String },
  initial: { type: String, maxlength: 1 },
  workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace' },
  gatewayId: { type: Schema.Types.ObjectId, ref: 'Gateway' },
  openclawSessionId: { type: String, index: true },
  agentTokenHash: { type: String, index: true },
  heartbeatConfig: { type: Schema.Types.Mixed },
  identityProfile: { type: Schema.Types.Mixed },
  identityTemplate: { type: String },
  soulTemplate: { type: String },
  provisionRequestedAt: { type: Date },
  provisionConfirmTokenHash: { type: String },
  provisionAction: { type: String },
  deleteRequestedAt: { type: Date },
  deleteConfirmTokenHash: { type: String },
  lastSeenAt: { type: Date },
  lifecycleGeneration: { type: Number, default: 0 },
  wakeAttempts: { type: Number, default: 0 },
  lastWakeSentAt: { type: Date },
  checkinDeadlineAt: { type: Date },
  lastProvisionError: { type: String },
  isBoardLead: { type: Boolean, default: false },
  isGatewayMain: { type: Boolean, default: false },
}, { timestamps: true });

const Agent: Model<IAgent> = mongoose.model<IAgent>('Agent', agentSchema);
export default Agent;

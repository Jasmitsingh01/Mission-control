import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IWorkspace extends Document {
  name: string;
  members: mongoose.Types.ObjectId[];
  description?: string;
  avatar?: string;
  tasks: mongoose.Types.ObjectId[];
  agents: Array<{
    name: string;
    skills?: Array<{ name: string; file: string }>;
  }>;
  createdby: mongoose.Types.ObjectId;
  slug?: string;
  boardType?: string;
  objective?: string;
  gatewayId?: mongoose.Types.ObjectId;
  boardGroupId?: mongoose.Types.ObjectId;
  organizationId?: mongoose.Types.ObjectId;
  requireApprovalForDone?: boolean;
  maxAgents?: number;
  openclawSession?: {
    sessionKey: string;
    sessionTitle: string;
    sessionId: string;
    createdAt: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

const workspaceSchema = new Schema<IWorkspace>({
  name: { type: String, required: true },
  members: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  description: { type: String },
  avatar: { type: String },
  tasks: [{ type: Schema.Types.ObjectId, ref: 'Task' }],
  agents: [{
    name: { type: String },
    skills: [{ name: String, file: String }],
  }],
  createdby: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  slug: { type: String },
  boardType: { type: String },
  objective: { type: String },
  gatewayId: { type: Schema.Types.ObjectId, ref: 'Gateway' },
  boardGroupId: { type: Schema.Types.ObjectId, ref: 'BoardGroup' },
  organizationId: { type: Schema.Types.ObjectId, ref: 'Organization' },
  requireApprovalForDone: { type: Boolean, default: false },
  maxAgents: { type: Number },
  openclawSession: {
    sessionKey: { type: String },
    sessionTitle: { type: String },
    sessionId: { type: String },
    createdAt: { type: Date },
  },
}, { timestamps: true });

const Workspace: Model<IWorkspace> = mongoose.model<IWorkspace>('Workspace', workspaceSchema);
export default Workspace;

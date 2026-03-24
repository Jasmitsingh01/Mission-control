import mongoose, { Document, Schema, Model } from 'mongoose';

export interface ITask extends Document {
  title: string;
  desc: string;
  status: 'backlog' | 'todo' | 'inprogress' | 'review' | 'done';
  assignee: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  progress: number;
  created: number;
  tags: string[];
  subtasks: number[];
  comments: number;
  workspaceId: mongoose.Types.ObjectId;
  dueAt?: Date;
  inProgressAt?: Date;
  previousInProgressAt?: Date;
  createdByUserId?: mongoose.Types.ObjectId;
  assignedAgentId?: mongoose.Types.ObjectId;
  autoCreated: boolean;
  autoReason?: string;
  dependsOnTaskIds: mongoose.Types.ObjectId[];
  isBlocked: boolean;
  customFieldValues?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const taskSchema = new Schema<ITask>({
  title: { type: String, required: true },
  desc: { type: String, required: true },
  status: {
    type: String,
    required: true,
    enum: ['backlog', 'todo', 'inprogress', 'review', 'done'],
    default: 'todo'
  },
  assignee: { type: String, required: true },
  priority: {
    type: String,
    required: true,
    enum: ['critical', 'high', 'medium', 'low'],
    default: 'medium'
  },
  progress: { type: Number, min: 0, max: 100, default: 0 },
  created: { type: Number, default: () => Date.now() },
  tags: [String],
  subtasks: [Number],
  comments: { type: Number, default: 0 },
  workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true },
  dueAt: { type: Date },
  inProgressAt: { type: Date },
  previousInProgressAt: { type: Date },
  createdByUserId: { type: Schema.Types.ObjectId, ref: 'User' },
  assignedAgentId: { type: Schema.Types.ObjectId, ref: 'Agent' },
  autoCreated: { type: Boolean, default: false },
  autoReason: { type: String },
  dependsOnTaskIds: [{ type: Schema.Types.ObjectId, ref: 'Task' }],
  isBlocked: { type: Boolean, default: false },
  customFieldValues: { type: Schema.Types.Mixed },
}, { timestamps: true });

const Task: Model<ITask> = mongoose.model<ITask>('Task', taskSchema);
export default Task;

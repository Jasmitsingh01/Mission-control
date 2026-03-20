import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IExecutionLog {
  timestamp: Date;
  type: 'text' | 'tool_use' | 'tool_result' | 'error' | 'system';
  content: string;
  toolName?: string;
  toolInput?: any;
}

export interface IExecution extends Document {
  userId: mongoose.Types.ObjectId;
  orgId: mongoose.Types.ObjectId;
  taskTitle: string;
  prompt: string;
  status: 'queued' | 'running' | 'completed' | 'failed' | 'aborted';
  result?: string;
  error?: string;
  claudeSessionId?: string;
  pid?: number;
  claudeModel: string;
  allowedTools: string[];
  workingDirectory: string;
  logs: IExecutionLog[];
  usage: {
    inputTokens: number;
    outputTokens: number;
    costUsd: number;
    durationMs: number;
    totalTurns: number;
  };
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const executionLogSchema = new Schema<IExecutionLog>(
  {
    timestamp: { type: Date, default: Date.now },
    type: { type: String, enum: ['text', 'tool_use', 'tool_result', 'error', 'system'], required: true },
    content: { type: String, required: true },
    toolName: { type: String },
    toolInput: { type: Schema.Types.Mixed },
  },
  { _id: false }
);

const executionSchema = new Schema<IExecution>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    orgId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    taskTitle: { type: String, required: true },
    prompt: { type: String, required: true },
    status: {
      type: String,
      enum: ['queued', 'running', 'completed', 'failed', 'aborted'],
      default: 'queued',
    },
    result: { type: String },
    error: { type: String },
    claudeSessionId: { type: String },
    pid: { type: Number },
    claudeModel: { type: String, default: 'claude-sonnet-4-6' },
    allowedTools: { type: [String], default: ['Read', 'Edit', 'Write', 'Bash', 'Glob', 'Grep'] },
    workingDirectory: { type: String, default: process.cwd() },
    logs: { type: [executionLogSchema], default: [] },
    usage: {
      type: {
        inputTokens: { type: Number, default: 0 },
        outputTokens: { type: Number, default: 0 },
        costUsd: { type: Number, default: 0 },
        durationMs: { type: Number, default: 0 },
        totalTurns: { type: Number, default: 0 },
      },
      default: () => ({ inputTokens: 0, outputTokens: 0, costUsd: 0, durationMs: 0, totalTurns: 0 }),
    },
    startedAt: { type: Date },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

executionSchema.index({ orgId: 1, createdAt: -1 });
executionSchema.index({ userId: 1, status: 1 });
executionSchema.index({ orgId: 1, status: 1 });

const Execution: Model<IExecution> = mongoose.model<IExecution>('Execution', executionSchema);

export default Execution;

import mongoose, { Document, Schema, Model } from 'mongoose';

export interface ITaskComment extends Document {
  taskId: mongoose.Types.ObjectId;
  message: string;
  agentId?: mongoose.Types.ObjectId;
  userId?: mongoose.Types.ObjectId;
  createdAt: Date;
}

const taskCommentSchema = new Schema<ITaskComment>({
  taskId: { type: Schema.Types.ObjectId, ref: 'Task', required: true },
  message: { type: String, required: true },
  agentId: { type: Schema.Types.ObjectId, ref: 'Agent' },
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: { createdAt: true, updatedAt: false } });

const TaskComment: Model<ITaskComment> = mongoose.model<ITaskComment>('TaskComment', taskCommentSchema);
export default TaskComment;

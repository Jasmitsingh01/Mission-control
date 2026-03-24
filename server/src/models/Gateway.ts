import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IGateway extends Document {
  name: string;
  url: string;
  token?: string;
  disableDevicePairing: boolean;
  workspaceRoot?: string;
  allowInsecureTls: boolean;
  organizationId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const gatewaySchema = new Schema<IGateway>({
  name: { type: String, required: true },
  url: { type: String, required: true },
  token: { type: String },
  disableDevicePairing: { type: Boolean, default: false },
  workspaceRoot: { type: String },
  allowInsecureTls: { type: Boolean, default: false },
  organizationId: { type: Schema.Types.ObjectId, ref: 'Organization' },
}, { timestamps: true });

const Gateway: Model<IGateway> = mongoose.model<IGateway>('Gateway', gatewaySchema);
export default Gateway;

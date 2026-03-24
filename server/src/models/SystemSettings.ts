import mongoose, { Document, Schema, Model } from 'mongoose';

export interface ISystemSettings extends Document {
  maintenanceMode: boolean;
  allowSignups: boolean;
  defaultModel: string;
  announcement?: string;
  updatedBy?: string;
}

const systemSettingsSchema = new Schema<ISystemSettings>(
  {
    maintenanceMode: { type: Boolean, default: false },
    allowSignups: { type: Boolean, default: true },
    defaultModel: { type: String, default: 'google/gemini-2.0-flash-001' },
    announcement: { type: String },
    updatedBy: { type: String },
  },
  { timestamps: true, capped: { size: 1024, max: 1 } } // Singleton collection
);

const SystemSettings: Model<ISystemSettings> = mongoose.model<ISystemSettings>(
  'SystemSettings',
  systemSettingsSchema
);

export default SystemSettings;

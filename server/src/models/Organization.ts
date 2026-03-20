import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IOrgSettings {
  maxMembers: number;
  maxAgents: number;
  maxTasksPerMonth: number;
  allowedProviders: string[];
}

export interface IOrganization extends Document {
  name: string;
  slug: string;
  ownerId: mongoose.Types.ObjectId;
  plan: 'free' | 'pro' | 'enterprise';
  settings: IOrgSettings;
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PLAN_LIMITS: Record<string, IOrgSettings> = {
  free: { maxMembers: 3, maxAgents: 5, maxTasksPerMonth: 100, allowedProviders: ['google', 'local'] },
  pro: { maxMembers: 20, maxAgents: 50, maxTasksPerMonth: 5000, allowedProviders: ['openai', 'anthropic', 'google', 'local', 'custom'] },
  enterprise: { maxMembers: -1, maxAgents: -1, maxTasksPerMonth: -1, allowedProviders: ['openai', 'anthropic', 'google', 'local', 'custom'] },
};

const orgSettingsSchema = new Schema<IOrgSettings>(
  {
    maxMembers: { type: Number, default: 3 },
    maxAgents: { type: Number, default: 5 },
    maxTasksPerMonth: { type: Number, default: 100 },
    allowedProviders: { type: [String], default: ['google', 'local'] },
  },
  { _id: false }
);

const organizationSchema = new Schema<IOrganization>(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'],
      maxlength: 60,
    },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    plan: {
      type: String,
      enum: ['free', 'pro', 'enterprise'],
      default: 'free',
    },
    settings: {
      type: orgSettingsSchema,
      default: () => ({ ...PLAN_LIMITS.free }),
    },
    avatarUrl: { type: String },
  },
  { timestamps: true }
);

organizationSchema.index({ ownerId: 1, createdAt: -1 });

// Auto-set plan limits when plan changes
organizationSchema.pre('save', function () {
  if (this.isModified('plan')) {
    const limits = PLAN_LIMITS[this.plan];
    if (limits) {
      this.settings = { ...limits, ...this.settings, ...limits };
    }
  }
});

export { PLAN_LIMITS };

const Organization: Model<IOrganization> = mongoose.model<IOrganization>(
  'Organization',
  organizationSchema
);

export default Organization;

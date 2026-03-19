import mongoose, { Document, Schema, Model } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUserSettings {
  openrouterApiKey?: string;
  preferredModel: string;
  maxTokens: number;
  temperature: number;
}

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  avatar: string;
  plan: 'free' | 'pro' | 'enterprise';
  settings: IUserSettings;
  currentOrgId?: string;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidate: string): Promise<boolean>;
}

const userSettingsSchema = new Schema(
  {
    openrouterApiKey: { type: String },
    preferredModel: { type: String, default: 'google/gemini-2.0-flash-001' },
    maxTokens: { type: Number, default: 4096 },
    temperature: { type: Number, default: 0.4 },
  },
  { _id: false }
);

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    avatar: { type: String },
    plan: {
      type: String,
      enum: ['free', 'pro', 'enterprise'],
      default: 'free',
    },
    settings: {
      type: userSettingsSchema,
      default: () => ({}),
    },
    currentOrgId: { type: String },
  },
  { timestamps: true }
);

// Generate 2-letter initials for avatar before saving
userSchema.pre('save', async function () {
  // Generate avatar initials from name
  if (this.isModified('name') || !this.avatar) {
    const parts = this.name.trim().split(/\s+/);
    if (parts.length >= 2) {
      this.avatar = (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    } else if (parts.length === 1 && parts[0].length >= 2) {
      this.avatar = parts[0].substring(0, 2).toUpperCase();
    } else {
      this.avatar = (parts[0][0] || 'U').toUpperCase() + 'U';
    }
  }

  // Hash password if modified
  if (!this.isModified('password')) {
    return;
  }

  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method
userSchema.methods.comparePassword = async function (candidate: string): Promise<boolean> {
  return bcrypt.compare(candidate, this.password);
};

// Strip password from JSON output
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

const User: Model<IUser> = mongoose.model<IUser>('User', userSchema);

export default User;

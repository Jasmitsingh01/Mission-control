import mongoose, { Document, Schema, Model } from 'mongoose';
import crypto from 'crypto';
import type { OrgRole } from './OrgMember';

export interface IInvitation extends Document {
  orgId: mongoose.Types.ObjectId;
  email: string;
  role: OrgRole;
  token: string;
  invitedBy: mongoose.Types.ObjectId;
  status: 'pending' | 'accepted' | 'expired' | 'revoked';
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const invitationSchema = new Schema<IInvitation>(
  {
    orgId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    role: {
      type: String,
      enum: ['admin', 'member', 'viewer'],
      default: 'member',
    },
    token: {
      type: String,
      required: true,
      unique: true,
      default: () => crypto.randomBytes(32).toString('hex'),
    },
    invitedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'expired', 'revoked'],
      default: 'pending',
    },
    expiresAt: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
  },
  { timestamps: true }
);

invitationSchema.index({ orgId: 1, email: 1 });
invitationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL auto-cleanup

const Invitation: Model<IInvitation> = mongoose.model<IInvitation>('Invitation', invitationSchema);

export default Invitation;

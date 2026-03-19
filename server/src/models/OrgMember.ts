import mongoose, { Document, Schema, Model } from 'mongoose';

export type OrgRole = 'owner' | 'admin' | 'member' | 'viewer';

// Permission hierarchy: owner > admin > member > viewer
export const ROLE_HIERARCHY: Record<OrgRole, number> = {
  owner: 100,
  admin: 75,
  member: 50,
  viewer: 25,
};

export interface IOrgMember extends Document {
  orgId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  role: OrgRole;
  invitedBy: mongoose.Types.ObjectId;
  joinedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const orgMemberSchema = new Schema<IOrgMember>(
  {
    orgId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    role: {
      type: String,
      enum: ['owner', 'admin', 'member', 'viewer'],
      default: 'member',
    },
    invitedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    joinedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Unique membership per org+user
orgMemberSchema.index({ orgId: 1, userId: 1 }, { unique: true });
orgMemberSchema.index({ userId: 1, orgId: 1 });
orgMemberSchema.index({ orgId: 1, role: 1 });

const OrgMember: Model<IOrgMember> = mongoose.model<IOrgMember>('OrgMember', orgMemberSchema);

export default OrgMember;

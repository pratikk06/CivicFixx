// server/src/models/UserProfile.js
import { Schema, model } from 'mongoose';

const UserProfileSchema = new Schema(
  {
    authUserId: { type: String, required: true, unique: true }, // Supabase UID
    displayName: { type: String, required: true },
    avatarUrl: { type: String },
    role: { type: String, enum: ['citizen', 'authority', 'admin'], default: 'citizen' },
    isPublicProfile: { type: Boolean, default: true },
    organizationName: { type: String },
  },
  { timestamps: true }
);

export default model('UserProfile', UserProfileSchema);

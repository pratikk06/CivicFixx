// server/src/models/IssueSupport.js
import { Schema, model } from 'mongoose';

const IssueSupportSchema = new Schema(
  {
    issueId: { type: Schema.Types.ObjectId, ref: 'Issue', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'UserProfile', required: true },
  },
  { timestamps: true }
);

// Prevent duplicate support entries
IssueSupportSchema.index({ issueId: 1, userId: 1 }, { unique: true });

export default model('IssueSupport', IssueSupportSchema);

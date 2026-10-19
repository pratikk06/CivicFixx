// server/src/models/IssueFollow.js
import { Schema, model } from 'mongoose';

const IssueFollowSchema = new Schema(
  {
    issueId: { type: Schema.Types.ObjectId, ref: 'Issue', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'UserProfile', required: true },
  },
  { timestamps: true }
);

// Prevent duplicate follow entries
IssueFollowSchema.index({ issueId: 1, userId: 1 }, { unique: true });

export default model('IssueFollow', IssueFollowSchema);

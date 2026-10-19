// server/src/models/AuthorityUpdate.js
import { Schema, model } from 'mongoose';

const AuthorityUpdateSchema = new Schema(
  {
    issueId: { type: Schema.Types.ObjectId, ref: 'Issue', required: true },
    authorityId: { type: Schema.Types.ObjectId, ref: 'UserProfile', required: true },
    departmentId: { type: Schema.Types.ObjectId, ref: 'Department', required: true },
    message: { type: String, required: true },
    actionDescription: { type: String },
    expectedCompletionAt: { type: Date },
  },
  { timestamps: true }
);

export default model('AuthorityUpdate', AuthorityUpdateSchema);

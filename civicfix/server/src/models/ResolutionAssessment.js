// server/src/models/ResolutionAssessment.js
import { Schema, model } from 'mongoose';

const ResolutionAssessmentSchema = new Schema(
  {
    issueId: { type: Schema.Types.ObjectId, ref: 'Issue', required: true },
    afterImagePath: { type: String },
    resolutionScore: { type: Number, min: 0, max: 100, required: true },
    confidence: { type: Number, min: 0, max: 100, required: true },
    beforeCondition: { type: String },
    afterCondition: { type: String },
    explanation: { type: String },
  },
  { timestamps: true }
);

export default model('ResolutionAssessment', ResolutionAssessmentSchema);

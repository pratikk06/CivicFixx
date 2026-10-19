// server/src/models/Issue.js
import { Schema, model } from 'mongoose';

const IssueSchema = new Schema(
  {
    title: { type: String, required: true },
    userDescription: { type: String },
    aiSummary: { type: String },
    category: {
      type: String,
      enum: ['pothole', 'garbage', 'broken_streetlight', 'water_leakage', 'damaged_infrastructure', 'other'],
      required: true,
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      required: true,
    },
    aiConfidence: { type: Number, min: 0, max: 100 },
    aiReasoning: { type: String },
    riskDescription: { type: String },
    // location as GeoJSON point for 2dsphere index
    // Optional location – will be set when coords are provided
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], required: false }, // [lng, lat]
      address: { type: String },
      locality: { type: String },
      locationSource: { type: String, enum: ['geolocation', 'exif', 'manual'] },
    },
    beforeImagePath: { type: String },
    // reporter
    createdBy: { type: Schema.Types.ObjectId, ref: 'UserProfile' },
    isAnonymous: { type: Boolean, default: false },
    // routing
    departmentId: { type: Schema.Types.ObjectId, ref: 'Department' },
    assignedAuthorityId: { type: Schema.Types.ObjectId, ref: 'UserProfile' },
    // status workflow
    status: {
      type: String,
      enum: ['reported', 'acknowledged', 'action_in_progress', 'resolved'],
      default: 'reported',
    },
    priorityScore: { type: Number, min: 0, max: 100, default: 0 },
    supportCount: { type: Number, default: 0 },
    followerCount: { type: Number, default: 0 },
    // timestamps
    acknowledgedAt: { type: Date },
    resolvedAt: { type: Date },
  },
  { timestamps: true }
);

// Geospatial index for nearby queries
IssueSchema.index({ 'location.coordinates': '2dsphere' });
// Additional useful indexes
IssueSchema.index({ createdAt: 1 });
IssueSchema.index({ status: 1 });
IssueSchema.index({ category: 1 });
IssueSchema.index({ departmentId: 1 });
IssueSchema.index({ priorityScore: -1 });

export default model('Issue', IssueSchema);

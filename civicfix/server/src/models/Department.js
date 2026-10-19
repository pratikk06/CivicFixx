// server/src/models/Department.js
import { Schema, model } from 'mongoose';

const DepartmentSchema = new Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String },
    supportedCategories: {
      type: [{ type: String, enum: ['pothole','garbage','broken_streetlight','water_leakage','damaged_infrastructure','other'] }],
      default: [],
    },
    authorityUserIds: { type: [{ type: Schema.Types.ObjectId, ref: 'UserProfile' }], default: [] },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default model('Department', DepartmentSchema);

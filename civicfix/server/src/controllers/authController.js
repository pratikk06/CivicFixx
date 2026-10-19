// server/src/controllers/authController.js
import UserProfile from '../models/UserProfile.js';

/**
 * GET /api/v1/auth/me
 * Returns minimal auth info for the currently authenticated user.
 * Requires a valid Supabase access token.
 */
export async function getAuthMe(req, res) {
  // authenticateUser middleware already attached req.user
  const { id, email, role } = req.user;
  return res.json({
    success: true,
    data: { authUserId: id, email, role },
  });
}

/**
 * GET /api/v1/profile/me
 * Returns the full UserProfile document for the authenticated user.
 */
export async function getProfileMe(req, res) {
  const profile = await UserProfile.findOne({ authUserId: req.user.id }).select('-__v');
  if (!profile) {
    return res.status(404).json({ success: false, message: 'User profile not found' });
  }
  return res.json({ success: true, data: profile });
}

/**
 * PATCH /api/v1/profile/me
 * Allows users to update only permitted fields.
 * Allowed fields: displayName, avatarUrl, isPublicProfile.
 * Role cannot be changed via this endpoint.
 */
export async function updateProfileMe(req, res) {
  const allowed = ['displayName', 'avatarUrl', 'isPublicProfile'];
  const updates = {};
  for (const key of allowed) {
    if (key in req.body) updates[key] = req.body[key];
  }
  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ success: false, message: 'No valid fields to update' });
  }
  const profile = await UserProfile.findOneAndUpdate(
    { authUserId: req.user.id },
    { $set: updates },
    { new: true }
  ).select('-__v');
  return res.json({ success: true, data: profile });
}

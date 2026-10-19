// server/src/middleware/auth.js
import { supabase } from '../config/supabaseClient.js';
import UserProfile from '../models/UserProfile.js';

/**
 * Verify Supabase JWT access token and attach user info to request.
 * Expects Authorization: Bearer <token> header.
 * Uses Supabase service role key to verify token signature and claims.
 */
export async function authenticateUser(req, res, next) {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Missing Authorization header' });
  }
  const token = authHeader.split(' ')[1];
  try {
    // Supabase verifies token signature and expiration when using the service role key
    const { data: supabaseUser, error } = await supabase.auth.api.getUser(token);
    if (error || !supabaseUser) {
      return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }
    // Sync UserProfile (create if missing)
    let profile = await UserProfile.findOne({ authUserId: supabaseUser.id });
    if (!profile) {
      profile = await UserProfile.create({
        authUserId: supabaseUser.id,
        displayName: supabaseUser.user_metadata?.full_name || supabaseUser.email || 'Unnamed',
        avatarUrl: supabaseUser.user_metadata?.avatar_url || null,
        role: 'citizen', // default role; admin/authority must be set manually by admin later
        isPublicProfile: true,
      });
    }
    // Attach combined info to request
    req.user = {
      id: supabaseUser.id,
      email: supabaseUser.email,
      role: profile.role,
      profileId: profile._id,
    };
    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    return res.status(500).json({ success: false, message: 'Authentication error' });
  }
}

/**
 * Optional authentication – attaches req.user if a valid token is present, otherwise proceeds with null.
 */
export async function optionalAuthentication(req, res, next) {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }
  const token = authHeader.split(' ')[1];
  try {
    const { data: supabaseUser, error } = await supabase.auth.api.getUser(token);
    if (error || !supabaseUser) {
      req.user = null;
      return next();
    }
    let profile = await UserProfile.findOne({ authUserId: supabaseUser.id });
    if (!profile) {
      profile = await UserProfile.create({
        authUserId: supabaseUser.id,
        displayName: supabaseUser.user_metadata?.full_name || supabaseUser.email || 'Unnamed',
        avatarUrl: supabaseUser.user_metadata?.avatar_url || null,
        role: 'citizen',
        isPublicProfile: true,
      });
    }
    req.user = {
      id: supabaseUser.id,
      email: supabaseUser.email,
      role: profile.role,
      profileId: profile._id,
    };
    next();
  } catch (err) {
    console.error('Optional auth error:', err);
    req.user = null;
    next();
  }
}

/**
 * Role‑based authorization middleware.
 * Usage: requireRole('admin') or requireRole(['authority', 'admin'])
 */
export function requireRole(allowedRoles) {
  const rolesArray = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthenticated' });
    }
    if (!rolesArray.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Forbidden: insufficient role' });
    }
    next();
  };
}

/**
 * Department access check – ensures the user belongs to (or is admin of) the department they are accessing.
 * Expects departmentId param in req.params or body.
 */
export async function requireDepartmentAccess(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Unauthenticated' });
  }
  if (req.user.role === 'admin') return next(); // admin bypasses department check
  const departmentId = req.params.departmentId || req.body.departmentId;
  if (!departmentId) {
    return res.status(400).json({ success: false, message: 'Department ID required' });
  }
  try {
    const profile = await UserProfile.findById(req.user.profileId);
    if (!profile) {
      return res.status(404).json({ success: false, message: 'User profile not found' });
    }
    // Assuming authority users have a field `departmentId` (could be added later). For now, block non‑admin.
    if (profile.role !== 'authority') {
      return res.status(403).json({ success: false, message: 'Forbidden: not an authority user' });
    }
    // Placeholder: in real app you would compare profile.departmentId == departmentId
    next();
  } catch (err) {
    console.error('Dept access error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}

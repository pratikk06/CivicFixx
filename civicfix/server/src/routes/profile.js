// server/src/routes/profile.js
import { Router } from 'express';
import { getProfileMe, updateProfileMe } from '../controllers/authController.js';
import { authenticateUser } from '../middleware/auth.js';

const router = Router();

// Get authenticated user's profile
router.get('/me', authenticateUser, getProfileMe);

// Update authenticated user's profile (allowed fields only)
router.patch('/me', authenticateUser, updateProfileMe);

export default router;

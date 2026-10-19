// server/src/routes/auth.js
import { Router } from 'express';
import { getAuthMe } from '../controllers/authController.js';
import { authenticateUser } from '../middleware/auth.js';

const router = Router();

// Returns minimal auth info for the logged‑in user
router.get('/me', authenticateUser, getAuthMe);

export default router;

// server/src/routes/issues.js
import express from 'express';
import { authenticateUser } from '../middleware/auth.js';
import {
  createIssue,
  getIssues,
  getIssueById,
  getMyIssues,
} from '../controllers/issueController.js';
import {
  supportIssue,
  unsupportIssue,
  followIssue,
  unfollowIssue,
  getTrendingIssues,
} from '../controllers/supportController.js';

const router = express.Router();

// Public endpoints
router.get('/', getIssues);
router.get('/trending', getTrendingIssues);
router.get('/me', authenticateUser, getMyIssues);
router.get('/:issueId', getIssueById);
router.post('/', authenticateUser, createIssue);

// Support endpoints
router.post('/:issueId/support', authenticateUser, supportIssue);
router.delete('/:issueId/support', authenticateUser, unsupportIssue);

// Follow endpoints
router.post('/:issueId/follow', authenticateUser, followIssue);
router.delete('/:issueId/follow', authenticateUser, unfollowIssue);

export default router;

// server/src/controllers/supportController.js
import Issue from '../models/Issue.js';
import IssueSupport from '../models/IssueSupport.js';
import IssueFollow from '../models/IssueFollow.js';
import UserProfile from '../models/UserProfile.js';

/** Helper: compute priority score (0‑100) */
function computePriorityScore(issue) {
  const severityWeights = { critical: 40, high: 30, medium: 20, low: 10 };
  const severityScore = severityWeights[issue.severity] || 0;
  const supportScore = Math.min(issue.supportCount * 0.5, 30); // up to 30 pts
  let timeScore = 0;
  if (issue.status !== 'resolved') {
    const days = Math.floor((Date.now() - new Date(issue.createdAt)) / (1000 * 60 * 60 * 24));
    timeScore = Math.min(days * 0.2, 20); // up to 20 pts for long‑unresolved
  }
  let total = severityScore + supportScore + timeScore;
  if (total > 100) total = 100;
  return total;
}

/** Helper: compute trending score (higher = more trending) */
function computeTrendingScore(issue) {
  const supportWeight = 0.5;
  const recencyWeight = 0.3; // newer issues get boost
  const unresolvedWeight = 0.2;

  const supportScore = issue.supportCount * supportWeight;
  const ageDays = Math.floor((Date.now() - new Date(issue.createdAt)) / (1000 * 60 * 60 * 24));
  const recencyScore = Math.max(0, (30 - ageDays)) * recencyWeight; // decline after 30 days
  const unresolvedScore = issue.status !== 'resolved' ? 10 * unresolvedWeight : 0;

  return supportScore + recencyScore + unresolvedScore;
}

/** POST /api/v1/issues/:issueId/support */
export async function supportIssue(req, res) {
  const { issueId } = req.params;
  const userId = req.user.id;
  const profile = await UserProfile.findOne({ authUserId: userId });
  if (!profile) return res.status(404).json({ success: false, message: 'User profile not found' });

  try {
    await IssueSupport.create({ issueId, userId: profile._id }); // unique index prevents dup
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ success: false, message: 'Already supported' });
    }
    console.error('Support error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }

  // Increment supportCount and recompute priority
  const issue = await Issue.findByIdAndUpdate(issueId, { $inc: { supportCount: 1 } }, { new: true });
  if (!issue) return res.status(404).json({ success: false, message: 'Issue not found' });
  const newPriority = computePriorityScore(issue);
  await Issue.findByIdAndUpdate(issueId, { $set: { priorityScore: newPriority } });

  return res.json({ success: true, data: { supportCount: issue.supportCount } });
}

/** DELETE /api/v1/issues/:issueId/support */
export async function unsupportIssue(req, res) {
  const { issueId } = req.params;
  const userId = req.user.id;
  const profile = await UserProfile.findOne({ authUserId: userId });
  if (!profile) return res.status(404).json({ success: false, message: 'User profile not found' });

  const deleted = await IssueSupport.findOneAndDelete({ issueId, userId: profile._id });
  if (!deleted) return res.status(404).json({ success: false, message: 'Support not found' });

  const issue = await Issue.findByIdAndUpdate(issueId, { $inc: { supportCount: -1 } }, { new: true });
  if (!issue) return res.status(404).json({ success: false, message: 'Issue not found' });
  const newPriority = computePriorityScore(issue);
  await Issue.findByIdAndUpdate(issueId, { $set: { priorityScore: newPriority } });

  return res.json({ success: true, data: { supportCount: issue.supportCount } });
}

/** POST /api/v1/issues/:issueId/follow */
export async function followIssue(req, res) {
  const { issueId } = req.params;
  const userId = req.user.id;
  const profile = await UserProfile.findOne({ authUserId: userId });
  if (!profile) return res.status(404).json({ success: false, message: 'User profile not found' });

  try {
    await IssueFollow.create({ issueId, userId: profile._id });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ success: false, message: 'Already followed' });
    }
    console.error('Follow error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }

  const issue = await Issue.findByIdAndUpdate(issueId, { $inc: { followerCount: 1 } }, { new: true });
  if (!issue) return res.status(404).json({ success: false, message: 'Issue not found' });

  return res.json({ success: true, data: { followerCount: issue.followerCount } });
}

/** DELETE /api/v1/issues/:issueId/follow */
export async function unfollowIssue(req, res) {
  const { issueId } = req.params;
  const userId = req.user.id;
  const profile = await UserProfile.findOne({ authUserId: userId });
  if (!profile) return res.status(404).json({ success: false, message: 'User profile not found' });

  const deleted = await IssueFollow.findOneAndDelete({ issueId, userId: profile._id });
  if (!deleted) return res.status(404).json({ success: false, message: 'Follow not found' });

  const issue = await Issue.findByIdAndUpdate(issueId, { $inc: { followerCount: -1 } }, { new: true });
  if (!issue) return res.status(404).json({ success: false, message: 'Issue not found' });

  return res.json({ success: true, data: { followerCount: issue.followerCount } });
}

/** GET /api/v1/issues/trending */
export async function getTrendingIssues(req, res) {
  const { page = 1, limit = 20 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const issues = await Issue.find()
    .sort({ createdAt: -1 }) // initial sort, will be re‑ordered by score
    .skip(skip)
    .limit(Number(limit))
    .populate('departmentId', 'name slug')
    .lean();

  // Compute trending score for each
  const enriched = issues.map((iss) => {
    const trendingScore = computeTrendingScore(iss);
    return { ...iss, trendingScore };
  });

  // Sort descending by trendingScore
  enriched.sort((a, b) => b.trendingScore - a.trendingScore);

  return res.json({ success: true, data: enriched });
}

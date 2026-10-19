// server/src/controllers/issueController.js
import Issue from '../models/Issue.js';
import Department from '../models/Department.js';
import IssueSupport from '../models/IssueSupport.js';
import IssueFollow from '../models/IssueFollow.js';
import UserProfile from '../models/UserProfile.js';

/** Helper to validate latitude/longitude */
function isValidLat(lat) {
  return typeof lat === 'number' && lat >= -90 && lat <= 90;
}
function isValidLng(lng) {
  return typeof lng === 'number' && lng >= -180 && lng <= 180;
}

/** POST /api/v1/issues */
export async function createIssue(req, res) {
  const {
    title,
    userDescription,
    beforeImagePath,
    latitude,
    longitude,
    address,
    locality,
    locationSource,
    category,
    severity,
    isAnonymous = false,
  } = req.body;

  // Basic required fields validation
  if (!title || !userDescription || !category || !severity) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }

  // Image path validation – must start with issue-images/ (uploaded via our upload endpoint)
  if (beforeImagePath && !/^issue-images\/.+/.test(beforeImagePath)) {
    return res.status(400).json({ success: false, message: 'Invalid beforeImagePath' });
  }

  // Optional coordinate validation
  let location = undefined;
  if (latitude !== undefined || longitude !== undefined) {
    if (!isValidLat(Number(latitude)) || !isValidLng(Number(longitude))) {
      return res.status(400).json({ success: false, message: 'Invalid latitude/longitude' });
    }
    location = {
      coordinates: [Number(longitude), Number(latitude)],
      address: address || null,
      locality: locality || null,
      locationSource: locationSource || 'manual',
    };
  }

  // Authenticated user must be present (middleware guarantees)
  const userId = req.user.id;
  const profile = await UserProfile.findOne({ authUserId: userId });
  if (!profile) {
    return res.status(404).json({ success: false, message: 'User profile not found' });
  }

  const issue = new Issue({
    title,
    userDescription,
    beforeImagePath: beforeImagePath || null,
    location,
    category,
    severity,
    isAnonymous: Boolean(isAnonymous),
    createdBy: profile._id,
    // status defaults to 'reported' via schema default
  });

  await issue.save();
  return res.status(201).json({ success: true, data: issue });
}

/** GET /api/v1/issues (public feed) */
export async function getIssues(req, res) {
  const {
    sort = 'latest', // latest | priority
    category,
    status,
    departmentId,
    page = 1,
    limit = 20,
    latitude,
    longitude,
    radius, // km
  } = req.query;

  const query = {};
  if (category) query.category = category;
  if (status) query.status = status;
  if (departmentId) query.departmentId = departmentId;

  // Geospatial filter if radius & coords provided
  if (radius && latitude && longitude) {
    const rad = Number(radius) / 6378.1; // radius in radians (Earth radius km)
    query['location.coordinates'] = {
      $geoWithin: { $centerSphere: [[Number(longitude), Number(latitude)], rad] },
    };
  }

  const sortObj = sort === 'priority' ? { priorityScore: -1 } : { createdAt: -1 };

  const skip = (Number(page) - 1) * Number(limit);

  const issues = await Issue.find(query)
    .sort(sortObj)
    .skip(skip)
    .limit(Number(limit))
    .populate('departmentId', 'name slug')
    .lean();

  // Enrich each issue with support/follower counts and reporter info
  const enriched = await Promise.all(
    issues.map(async (iss) => {
      const supportCount = await IssueSupport.countDocuments({ issueId: iss._id });
      const followerCount = await IssueFollow.countDocuments({ issueId: iss._id });
      const reporterProfile = await UserProfile.findById(iss.createdBy).select('displayName avatarUrl isPublicProfile');
      const reporter = iss.isAnonymous
        ? { displayName: 'Anonymous Citizen', isAnonymous: true }
        : {
            displayName: reporterProfile?.displayName || 'Unknown',
            avatarUrl: reporterProfile?.avatarUrl || null,
            isAnonymous: false,
          };
      // Build image access info (signed URL placeholder)
      const imageInfo = iss.beforeImagePath
        ? { path: iss.beforeImagePath, signedUrl: null } // client can request signed URL via separate endpoint later
        : null;
      return {
        id: iss._id,
        title: iss.title,
        userDescription: iss.userDescription,
        aiSummary: iss.aiSummary || null,
        image: imageInfo,
        locality: iss.location?.locality || null,
        coordinates: iss.location?.coordinates || null,
        category: iss.category,
        severity: iss.severity,
        department: iss.departmentId,
        status: iss.status,
        priorityScore: iss.priorityScore,
        supportCount,
        followerCount,
        reporter,
        createdAt: iss.createdAt,
      };
    })
  );

  return res.json({ success: true, data: enriched });
}

/** GET /api/v1/issues/:id */
export async function getIssueById(req, res) {
  const { issueId } = req.params;
  const issue = await Issue.findById(issueId)
    .populate('departmentId', 'name slug')
    .lean();
  if (!issue) {
    return res.status(404).json({ success: false, message: 'Issue not found' });
  }
  const supportCount = await IssueSupport.countDocuments({ issueId: issue._id });
  const followerCount = await IssueFollow.countDocuments({ issueId: issue._id });
  const reporterProfile = await UserProfile.findById(issue.createdBy).select('displayName avatarUrl');
  const reporter = issue.isAnonymous
    ? { displayName: 'Anonymous Citizen', isAnonymous: true }
    : { displayName: reporterProfile?.displayName || 'Unknown', avatarUrl: reporterProfile?.avatarUrl || null };

  const response = {
    id: issue._id,
    title: issue.title,
    userDescription: issue.userDescription,
    aiSummary: issue.aiSummary || null,
    image: issue.beforeImagePath ? { path: issue.beforeImagePath, signedUrl: null } : null,
    locality: issue.location?.locality || null,
    coordinates: issue.location?.coordinates || null,
    category: issue.category,
    severity: issue.severity,
    department: issue.departmentId,
    status: issue.status,
    priorityScore: issue.priorityScore,
    supportCount,
    followerCount,
    reporter,
    createdAt: issue.createdAt,
    // latest official update placeholder (not implemented yet)
    latestUpdate: null,
    // timeline placeholder (future events)
    timeline: [],
  };
  return res.json({ success: true, data: response });
}

/** GET /api/v1/issues/me */
export async function getMyIssues(req, res) {
  const userId = req.user.id;
  const profile = await UserProfile.findOne({ authUserId: userId });
  if (!profile) {
    return res.status(404).json({ success: false, message: 'User profile not found' });
  }
  const issues = await Issue.find({ createdBy: profile._id })
    .sort({ createdAt: -1 })
    .populate('departmentId', 'name slug')
    .lean();

  const enriched = await Promise.all(
    issues.map(async (iss) => {
      const supportCount = await IssueSupport.countDocuments({ issueId: iss._id });
      const followerCount = await IssueFollow.countDocuments({ issueId: iss._id });
      return {
        id: iss._id,
        title: iss.title,
        status: iss.status,
        isAnonymous: iss.isAnonymous,
        supportCount,
        followerCount,
        createdAt: iss.createdAt,
      };
    })
  );

  return res.json({ success: true, data: enriched });
}

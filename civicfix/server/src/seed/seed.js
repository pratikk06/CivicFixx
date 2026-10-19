// server/src/seed/seed.js
import { connectDB, closeDB } from '../config/db.js';
import Department from '../models/Department.js';
import Issue from '../models/Issue.js';
import UserProfile from '../models/UserProfile.js';

async function runSeed() {
  await connectDB();

  // ----- Departments (upsert) -----
  const departments = [
    { name: 'Roads and Public Works', slug: 'roads-public-works', description: 'Handles roads, potholes, infrastructure.' },
    { name: 'Sanitation', slug: 'sanitation', description: 'Garbage collection and recycling.' },
    { name: 'Electricity and Street Lighting', slug: 'electricity-street-lighting', description: 'Streetlights and electric repairs.' },
    { name: 'Water Department', slug: 'water-department', description: 'Water leaks and supply issues.' },
    { name: 'Municipal Infrastructure', slug: 'municipal-infrastructure', description: 'General infrastructure maintenance.' },
  ];

  for (const dep of departments) {
    await Department.findOneAndUpdate({ slug: dep.slug }, dep, { upsert: true, new: true });
  }

  // ----- Sample Users -----
  const citizen = await UserProfile.findOneAndUpdate(
    { authUserId: 'citizen-uid-1' },
    { displayName: 'Jane Doe', role: 'citizen' },
    { upsert: true, new: true }
  );

  const authority = await UserProfile.findOneAndUpdate(
    { authUserId: 'authority-uid-1' },
    { displayName: 'Mayor Office', role: 'authority' },
    { upsert: true, new: true }
  );

  // ----- Sample Issues -----
  const sampleIssues = [
    {
      title: 'Pothole on Main St',
      category: 'pothole',
      severity: 'high',
      location: { coordinates: [-122.4194, 37.7749], address: 'Main St, City', locality: 'Downtown', locationSource: 'manual' },
      createdBy: citizen._id,
      departmentId: (await Department.findOne({ slug: 'roads-public-works' }))._id,
      status: 'reported',
    },
    {
      title: 'Overflowing garbage bin',
      category: 'garbage',
      severity: 'medium',
      location: { coordinates: [-122.4180, 37.7755], address: '2nd Ave, City', locality: 'Uptown', locationSource: 'geolocation' },
      createdBy: citizen._id,
      departmentId: (await Department.findOne({ slug: 'sanitation' }))._id,
      status: 'acknowledged',
    },
  ];

  for (const issueData of sampleIssues) {
    await Issue.findOneAndUpdate({ title: issueData.title }, issueData, { upsert: true, new: true });
  }

  console.log('✅ Seed data inserted/updated');
  await closeDB();
  process.exit(0);
}

runSeed().catch((err) => {
  console.error('❌ Seed error:', err);
  process.exit(1);
});

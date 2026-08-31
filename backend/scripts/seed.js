import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Department from '../models/Department.js';

await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/civicfix');
const departmentSeeds = [
  { name: 'Roads and Public Works', categories: ['Road Damage', 'Potholes', 'Drainage Issue'] },
  { name: 'Water Authority', categories: ['Water Leakage'] },
  { name: 'Waste Management', categories: ['Garbage Overflow', 'Illegal Waste Disposal'] },
  { name: 'Electrical and Streetlights', categories: ['Broken Streetlight', 'Traffic Signal Problem'] },
  { name: 'Parks and Recreation', categories: ['Park Maintenance', 'Tree Fall'] }
];
await Department.bulkWrite(departmentSeeds.map(item => ({ updateOne: { filter: { name: item.name }, update: { $set: { categories: item.categories, active: true } }, upsert: true } })));
if (process.env.SEED_ADMIN_EMAIL && process.env.SEED_ADMIN_PASSWORD) {
  const email = process.env.SEED_ADMIN_EMAIL.toLowerCase();
  const admin = await User.findOne({ email }).select('+password');
  if (admin) {
    admin.name = admin.name || 'CivicFix Administrator';
    admin.password = process.env.SEED_ADMIN_PASSWORD;
    admin.role = 'admin';
    await admin.save();
  } else {
    await User.create({ name: 'CivicFix Administrator', email, password: process.env.SEED_ADMIN_PASSWORD, role: 'admin' });
  }
}
console.log('Seed completed');
await mongoose.disconnect();

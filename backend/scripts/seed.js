import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Department from '../models/Department.js';

await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/civicfix');
await Department.bulkWrite([
  'Roads and Public Works', 'Water Authority', 'Waste Management', 'Electrical and Streetlights', 'Parks and Recreation'
].map(name => ({ updateOne: { filter: { name }, update: { $setOnInsert: { name, active: true } }, upsert: true } })));
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

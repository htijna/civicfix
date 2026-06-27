import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  description: String,
  ward: String,
  email: String,
  active: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model('Department', schema);

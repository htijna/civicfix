import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  localAuthority: { type: mongoose.Schema.Types.ObjectId, ref: 'LocalAuthority', required: true },
  description: String,
  ward: String,
  email: String,
  categories: [{ type: String, trim: true }],
  active: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model('Department', schema);

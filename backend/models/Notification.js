import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  message: { type: String, required: true },
  type: { type: String, enum: ['submitted', 'updated', 'resolved', 'remark', 'system'], default: 'system' },
  complaint: { type: mongoose.Schema.Types.ObjectId, ref: 'Complaint' },
  read: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model('Notification', schema);

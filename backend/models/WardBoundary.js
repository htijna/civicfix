import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  number: { type: String, trim: true },
  code: { type: String, required: true, unique: true, trim: true },
  district: { type: String, enum: ['Thrissur', 'Ernakulam'], required: true },
  localAuthority: { type: mongoose.Schema.Types.ObjectId, ref: 'LocalAuthority', required: true },
  boundary: {
    type: {
      type: String,
      enum: ['Polygon', 'MultiPolygon'],
      required: true
    },
    coordinates: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    }
  },
  status: { type: Boolean, default: true }
}, { timestamps: true });

schema.index({ boundary: '2dsphere' });
schema.index({ localAuthority: 1, status: 1 });

export default mongoose.model('WardBoundary', schema);

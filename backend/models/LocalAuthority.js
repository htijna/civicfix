import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  code: { type: String, required: true, unique: true, trim: true },
  district: { type: String, trim: true },
  state: { type: String, trim: true },
  boundary: {
    type: {
      type: String,
      enum: ['Polygon', 'MultiPolygon'],
      required: true
    },
    coordinates: {
      type: mongoose.Schema.Types.Mixed, // Array of arrays for Polygons/MultiPolygons
      required: true
    }
  },
  status: { type: Boolean, default: true }
}, { timestamps: true });

schema.index({ boundary: '2dsphere' });

export default mongoose.model('LocalAuthority', schema);

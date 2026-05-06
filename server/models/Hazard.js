import mongoose from 'mongoose';

const hazardSchema = new mongoose.Schema({
  reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  hazardType: { type: String, enum: ['debris', 'underwater_obstruction', 'shallow_water', 'weather_warning', 'lock_closure', 'obstruction', 'water_level', 'crt_works', 'theft', 'towpath', 'wildlife', 'other'], required: true },
  description: { type: String, required: true },
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
  severity: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  confirmedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', default: [] }],
  confirmationCount: { type: Number, default: 0 },
  resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  isResolved: { type: Boolean, default: false },
  resolvedAt: { type: Date, default: null },
  source: { type: String, enum: ['admin', 'community'], default: 'community' },
  startsAt: { type: Date, default: null },
  expiresAt: { type: Date, required: true },
  photos: [{ type: String }],
  createdAt: { type: Date, default: Date.now }
});

hazardSchema.index({ lat: 1, lng: 1 });
hazardSchema.index({ hazardType: 1 });
hazardSchema.index({ isResolved: 1 });
hazardSchema.index({ expiresAt: 1 });

export default mongoose.model('Hazard', hazardSchema);

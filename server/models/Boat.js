import mongoose from 'mongoose';

const boatSchema = new mongoose.Schema({
  boatIndexNumber: { type: String, required: true, unique: true, uppercase: true, maxlength: 7 },
  boatName: { type: String, required: true },
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  coOwners: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  verificationStatus: { type: String, enum: ['unverified', 'pending_approval', 'verified', 'rejected'], default: 'unverified' },
  verificationNotes: { type: String, default: null },
  ownerContactEmail: { type: String, default: null },
  ownerPhone: { type: String, default: null },
  lastKnownLat: { type: Number, default: null },
  lastKnownLng: { type: Number, default: null },
  lastLocationUpdate: { type: Date, default: null },
  crtUploadedAt: { type: Date, default: null },
  lastVerifiedAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Index for location queries
boatSchema.index({ lastKnownLat: 1, lastKnownLng: 1 });

export default mongoose.model('Boat', boatSchema);

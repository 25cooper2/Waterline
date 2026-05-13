import mongoose from 'mongoose';

const tradeProfileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  categories: [{ type: String }],
  otherCategory: { type: String, default: null },
  businessName: { type: String, default: null },
  businessDescription: { type: String, maxlength: 2000, default: null },
  businessPhotos: [{ type: String }],
  operatesAt: { type: String, default: null },
  operatesLat: { type: Number, default: null },
  operatesLng: { type: Number, default: null },
  travelRadius: { type: Number, default: null },
  liabilityInsuranceUrl: { type: String, default: null },
  tradeCertUrls: [{ type: String }],
  status: { type: String, enum: ['draft', 'pending', 'approved', 'rejected'], default: 'draft' },
  adminNote: { type: String, default: null },
  reviewedAt: { type: Date, default: null },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
}, { timestamps: true });

export default mongoose.model('TradeProfile', tradeProfileSchema);

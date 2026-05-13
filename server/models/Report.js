import mongoose from 'mongoose';

const REASONS = [
  'spam_scam',
  'harassment',
  'hate_speech',
  'sexual_content',
  'misinformation',
  'impersonation',
  'off_topic',
  'other',
];

const reportSchema = new mongoose.Schema({
  reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  targetType: { type: String, enum: ['post', 'product', 'user', 'reply'], required: true },
  targetId: { type: mongoose.Schema.Types.ObjectId, required: true },
  replyId: { type: mongoose.Schema.Types.ObjectId, default: null },
  reason: { type: String, enum: REASONS, required: true },
  details: { type: String, maxlength: 500, default: null },
  status: { type: String, enum: ['pending', 'approved', 'dismissed'], default: 'pending' },
  adminNote: { type: String, default: null },
  resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  resolvedAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
});

reportSchema.index({ targetType: 1, targetId: 1 });
reportSchema.index({ status: 1, createdAt: -1 });
// Unique per reporter+target combination (includes replyId for reply reports)
reportSchema.index({ reporter: 1, targetType: 1, targetId: 1, replyId: 1 }, { unique: true });

export const REPORT_REASONS = REASONS;
export default mongoose.model('Report', reportSchema);

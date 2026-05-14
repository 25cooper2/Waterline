import mongoose from 'mongoose';

const adminActionSchema = new mongoose.Schema({
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, required: true },
  targetType: { type: String, required: true },
  targetId: { type: mongoose.Schema.Types.ObjectId },
  details: { type: String },
  createdAt: { type: Date, default: Date.now },
});

adminActionSchema.index({ adminId: 1, createdAt: -1 });
adminActionSchema.index({ targetType: 1, targetId: 1 });
adminActionSchema.index({ createdAt: -1 });

export default mongoose.model('AdminAction', adminActionSchema);

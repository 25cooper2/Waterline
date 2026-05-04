import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  recipientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  isHail: { type: Boolean, default: false },
  senderBoatIndexNumber: { type: String, default: null },
  recipientBoatIndexNumber: { type: String, default: null },
  subject: { type: String, default: null },
  body: { type: String, required: true },
  isRead: { type: Boolean, default: false },
  readAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now }
});

messageSchema.index({ recipientId: 1, isRead: 1 });
messageSchema.index({ senderId: 1, recipientId: 1 });
messageSchema.index({ createdAt: -1 });

export default mongoose.model('Message', messageSchema);

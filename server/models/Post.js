import mongoose from 'mongoose';

const postSchema = new mongoose.Schema({
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  body: { type: String, required: true, maxlength: 2000 },
  tags: [{ type: String, lowercase: true, trim: true, maxlength: 60 }],
  lat: { type: Number, default: null },
  lng: { type: Number, default: null },
  locationName: { type: String, default: null },
  photos: [{ type: String }],
  replies: [{
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    body: { type: String, required: true, maxlength: 1000 },
    createdAt: { type: Date, default: Date.now },
  }],
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  likeCount: { type: Number, default: 0 },
  replyCount: { type: Number, default: 0 },
  reportStatus: { type: String, enum: ['active', 'pending_review', 'removed'], default: 'active' },
  reportedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  reportReasons: [{ type: String }],
  createdAt: { type: Date, default: Date.now },
});

postSchema.index({ createdAt: -1 });
postSchema.index({ tags: 1 });
postSchema.index({ lat: 1, lng: 1 });
postSchema.index({ authorId: 1, createdAt: -1 });

export default mongoose.model('Post', postSchema);

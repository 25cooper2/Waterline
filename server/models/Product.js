import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String },
  listingType: { type: String, enum: ['thing', 'boat', 'service'], default: 'thing' },
  price: { type: Number, required: true, min: 0 },
  sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  condition: { type: String, enum: ['new', 'like_new', 'good', 'fair'], default: 'good' },
  images: [{ type: String, default: [] }],
  location: { type: String, default: null },
  lat: { type: Number, default: null },
  lng: { type: Number, default: null },
  boatIndexNumber: { type: String, default: null },
  isAvailable: { type: Boolean, default: true },
  // Unique viewer tracking: dedup by IP + userAgent to count devices, not clicks
  viewers: [{
    ip: String,
    userAgent: String,
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    viewedAt: { type: Date, default: Date.now },
  }],
  favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', default: [] }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

productSchema.index({ category: 1, price: 1 });
productSchema.index({ sellerId: 1 });
productSchema.index({ createdAt: -1 });

export default mongoose.model('Product', productSchema);

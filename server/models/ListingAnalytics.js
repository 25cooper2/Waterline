import mongoose from 'mongoose';

const listingAnalyticsSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, default: null }, // original listing ID (for reference)
  sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  listingType: { type: String }, // thing / boat / service
  category: { type: String },
  price: { type: Number },
  title: { type: String },
  daysLive: { type: Number }, // days from createdAt to removal
  removalReason: {
    type: String,
    enum: ['sold_waterline', 'sold_elsewhere', 'no_longer_needed'],
    required: true,
  },
  removedAt: { type: Date, default: Date.now },
  createdAt: { type: Date }, // original listing createdAt
});

listingAnalyticsSchema.index({ removalReason: 1 });
listingAnalyticsSchema.index({ sellerId: 1 });
listingAnalyticsSchema.index({ removedAt: -1 });

export default mongoose.model('ListingAnalytics', listingAnalyticsSchema);

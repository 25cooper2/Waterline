import express from 'express';
import Boat from '../models/Boat.js';
import User from '../models/User.js';
import Product from '../models/Product.js';
import Logbook from '../models/Logbook.js';
import Hazard from '../models/Hazard.js';
import ListingAnalytics from '../models/ListingAnalytics.js';
import { adminMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Get pending certifications
router.get('/certifications/pending', adminMiddleware, async (req, res) => {
  try {
    const boats = await Boat.find({ verificationStatus: 'pending_approval' })
      .populate('ownerId', 'email displayName username profilePhotoUrl')
      .sort({ crtUploadedAt: 1 })
      .exec();

    res.json(boats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all verified boats
router.get('/certifications/verified', adminMiddleware, async (req, res) => {
  try {
    const boats = await Boat.find({ verificationStatus: 'verified' })
      .populate('ownerId', 'displayName username profilePhotoUrl')
      .sort({ lastVerifiedAt: -1 })
      .exec();

    res.json(boats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all rejected boats
router.get('/certifications/rejected', adminMiddleware, async (req, res) => {
  try {
    const boats = await Boat.find({ verificationStatus: 'rejected' })
      .populate('ownerId', 'displayName username profilePhotoUrl')
      .sort({ updatedAt: -1 })
      .exec();

    res.json(boats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Approve boat certification
router.post('/certifications/:boatId/approve', adminMiddleware, async (req, res) => {
  try {
    const boat = await Boat.findById(req.params.boatId);
    if (!boat) {
      return res.status(404).json({ error: 'Boat not found' });
    }

    boat.verificationStatus = 'verified';
    boat.lastVerifiedAt = new Date();
    boat.verificationNotes = null;
    await boat.save();

    const user = await User.findById(boat.ownerId);
    if (user) {
      user.isVerified = true;
      user.verificationStatus = 'verified';
      await user.save();
    }

    await boat.populate('ownerId', 'displayName username profilePhotoUrl');

    res.json({ message: 'Certification approved', boat });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Reject boat certification
router.post('/certifications/:boatId/reject', adminMiddleware, async (req, res) => {
  try {
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({ error: 'Rejection reason required' });
    }

    const boat = await Boat.findById(req.params.boatId);
    if (!boat) {
      return res.status(404).json({ error: 'Boat not found' });
    }

    boat.verificationStatus = 'rejected';
    boat.verificationNotes = reason;
    await boat.save();

    const user = await User.findById(boat.ownerId);
    if (user) {
      user.isVerified = false;
      user.verificationStatus = 'rejected';
      await user.save();
    }

    await boat.populate('ownerId', 'displayName username profilePhotoUrl');

    res.json({ message: 'Certification rejected', boat });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get admin statistics (expanded)
router.get('/stats', adminMiddleware, async (req, res) => {
  try {
    const [
      totalUsers, verifiedUsers,
      totalBoats, pendingBoats, verifiedBoats,
      totalListings, activeListings,
      totalLogEntries, totalHazards,
      totalRemovals,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isVerified: true }),
      Boat.countDocuments(),
      Boat.countDocuments({ verificationStatus: 'pending_approval' }),
      Boat.countDocuments({ verificationStatus: 'verified' }),
      Product.countDocuments(),
      Product.countDocuments({ isAvailable: true }),
      Logbook.countDocuments(),
      Hazard.countDocuments(),
      ListingAnalytics.countDocuments(),
    ]);

    // Sign-ups in last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);
    const newUsers30d = await User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } });
    const newListings30d = await Product.countDocuments({ createdAt: { $gte: thirtyDaysAgo } });

    // Removal reason breakdown
    const removalBreakdown = await ListingAnalytics.aggregate([
      { $group: { _id: '$removalReason', count: { $sum: 1 }, avgDaysLive: { $avg: '$daysLive' } } },
    ]);

    // Avg days live overall
    const avgDaysLiveResult = await ListingAnalytics.aggregate([
      { $group: { _id: null, avg: { $avg: '$daysLive' } } },
    ]);
    const avgDaysLive = avgDaysLiveResult[0]?.avg ?? null;

    // Top categories removed
    const topCategories = await ListingAnalytics.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);

    res.json({
      users: { total: totalUsers, verified: verifiedUsers, new30d: newUsers30d },
      boats: { total: totalBoats, pending: pendingBoats, verified: verifiedBoats },
      listings: { total: totalListings, active: activeListings, new30d: newListings30d },
      logbook: { total: totalLogEntries },
      hazards: { total: totalHazards },
      removals: { total: totalRemovals, avgDaysLive, breakdown: removalBreakdown, topCategories },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Recent users
router.get('/users', adminMiddleware, async (req, res) => {
  try {
    const users = await User.find()
      .select('displayName username email isVerified createdAt mooringLocation')
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Recent listings
router.get('/listings', adminMiddleware, async (req, res) => {
  try {
    const listings = await Product.find()
      .populate('sellerId', 'displayName username')
      .select('title listingType category price isAvailable createdAt sellerId')
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(listings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Removal analytics log
router.get('/analytics/removals', adminMiddleware, async (req, res) => {
  try {
    const records = await ListingAnalytics.find()
      .populate('sellerId', 'displayName username')
      .sort({ removedAt: -1 })
      .limit(100);
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Promote user to admin (by email)
router.post('/promote', adminMiddleware, async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOneAndUpdate({ email }, { role: 'admin' }, { new: true });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ message: `${user.email} promoted to admin` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

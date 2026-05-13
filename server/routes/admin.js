import express from 'express';
import Boat from '../models/Boat.js';
import User from '../models/User.js';
import Product from '../models/Product.js';
import Logbook from '../models/Logbook.js';
import Hazard from '../models/Hazard.js';
import ListingAnalytics from '../models/ListingAnalytics.js';
import { adminMiddleware } from '../middleware/auth.js';

const router = express.Router();

/* ─────────────────────────────────────────────────────────────────
 * Whitelists of editable fields per collection.
 * Anything not in this list is silently dropped on PUT so admins
 * cannot accidentally overwrite system fields (passwordHash, _id, etc).
 * ───────────────────────────────────────────────────────────────── */
const EDITABLE = {
  user: [
    'firstName', 'surname', 'displayName', 'username', 'email', 'bio',
    'avatarColor', 'profilePhotoUrl', 'isVerified', 'verificationStatus',
    'role', 'mooringLat', 'mooringLng', 'mooringLocation',
  ],
  boat: [
    'boatIndexNumber', 'boatName', 'boatType', 'boatLength', 'boatYear',
    'verificationStatus', 'verificationNotes', 'ownerContactEmail',
    'ownerPhone', 'lastKnownLat', 'lastKnownLng', 'licenseDocUrl',
    'boatPhotoUrl',
  ],
  product: [
    'title', 'description', 'category', 'listingType', 'price', 'condition',
    'images', 'location', 'lat', 'lng', 'isAvailable', 'removed',
    'removalReason',
  ],
  hazard: [
    'hazardType', 'description', 'severity', 'lat', 'lng', 'isResolved',
    'source', 'startsAt', 'expiresAt', 'photos',
  ],
  logbook: [
    'entryDate', 'endDate', 'startLocation', 'endLocation', 'lat', 'lng',
    'distance', 'locks', 'weather', 'conditions', 'fuelUsed', 'notes',
    'photos', 'highlights',
  ],
};

function pickEditable(kind, body) {
  const allowed = EDITABLE[kind] || [];
  const out = {};
  for (const k of allowed) {
    if (k in body) out[k] = body[k];
  }
  return out;
}

/* ─────────────────────────────────────────────────────────────────
 * Certifications (boat verification queue) — unchanged
 * ───────────────────────────────────────────────────────────────── */

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

router.post('/certifications/:boatId/approve', adminMiddleware, async (req, res) => {
  try {
    const boat = await Boat.findById(req.params.boatId);
    if (!boat) return res.status(404).json({ error: 'Boat not found' });

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

router.post('/certifications/:boatId/reject', adminMiddleware, async (req, res) => {
  try {
    const { reason } = req.body;
    if (!reason) return res.status(400).json({ error: 'Rejection reason required' });

    const boat = await Boat.findById(req.params.boatId);
    if (!boat) return res.status(404).json({ error: 'Boat not found' });

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

/* ─────────────────────────────────────────────────────────────────
 * Stats (Overview)
 * ───────────────────────────────────────────────────────────────── */

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

    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);
    const newUsers30d = await User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } });
    const newListings30d = await Product.countDocuments({ createdAt: { $gte: thirtyDaysAgo } });

    const removalBreakdown = await ListingAnalytics.aggregate([
      { $group: { _id: '$removalReason', count: { $sum: 1 }, avgDaysLive: { $avg: '$daysLive' } } },
    ]);

    const avgDaysLiveResult = await ListingAnalytics.aggregate([
      { $group: { _id: null, avg: { $avg: '$daysLive' } } },
    ]);
    const avgDaysLive = avgDaysLiveResult[0]?.avg ?? null;

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

/* ─────────────────────────────────────────────────────────────────
 * USERS — list / get / update / delete
 * ───────────────────────────────────────────────────────────────── */

router.get('/users', adminMiddleware, async (req, res) => {
  try {
    // Return full documents (passwordHash stripped by toJSON).
    const users = await User.find().sort({ createdAt: -1 }).limit(500);
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/users/:id', adminMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/users/:id', adminMiddleware, async (req, res) => {
  try {
    const updates = pickEditable('user', req.body);
    updates.updatedAt = new Date();
    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/users/:id', adminMiddleware, async (req, res) => {
  try {
    if (String(req.user.userId) === String(req.params.id)) {
      return res.status(400).json({ error: 'Cannot delete your own admin account.' });
    }
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* ─────────────────────────────────────────────────────────────────
 * LISTINGS (Products) — list / get / update / delete
 * ───────────────────────────────────────────────────────────────── */

router.get('/listings', adminMiddleware, async (req, res) => {
  try {
    const listings = await Product.find()
      .populate('sellerId', 'displayName username email')
      .sort({ createdAt: -1 })
      .limit(500);
    res.json(listings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/listings/:id', adminMiddleware, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('sellerId', 'displayName username email');
    if (!product) return res.status(404).json({ error: 'Listing not found' });
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/listings/:id', adminMiddleware, async (req, res) => {
  try {
    const updates = pickEditable('product', req.body);
    updates.updatedAt = new Date();
    const product = await Product.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true })
      .populate('sellerId', 'displayName username email');
    if (!product) return res.status(404).json({ error: 'Listing not found' });
    res.json(product);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/listings/:id', adminMiddleware, async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ error: 'Listing not found' });
    res.json({ message: 'Listing deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* ─────────────────────────────────────────────────────────────────
 * BOATS — list / get / update / delete
 * ───────────────────────────────────────────────────────────────── */

router.get('/boats', adminMiddleware, async (req, res) => {
  try {
    const boats = await Boat.find()
      .populate('ownerId', 'displayName username email')
      .sort({ createdAt: -1 })
      .limit(500);
    res.json(boats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/boats/:id', adminMiddleware, async (req, res) => {
  try {
    const boat = await Boat.findById(req.params.id)
      .populate('ownerId', 'displayName username email');
    if (!boat) return res.status(404).json({ error: 'Boat not found' });
    res.json(boat);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/boats/:id', adminMiddleware, async (req, res) => {
  try {
    const updates = pickEditable('boat', req.body);
    updates.updatedAt = new Date();
    const boat = await Boat.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true })
      .populate('ownerId', 'displayName username email');
    if (!boat) return res.status(404).json({ error: 'Boat not found' });
    res.json(boat);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/boats/:id', adminMiddleware, async (req, res) => {
  try {
    const boat = await Boat.findByIdAndDelete(req.params.id);
    if (!boat) return res.status(404).json({ error: 'Boat not found' });
    res.json({ message: 'Boat deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* ─────────────────────────────────────────────────────────────────
 * HAZARDS — list / get / update / delete
 * ───────────────────────────────────────────────────────────────── */

router.get('/hazards', adminMiddleware, async (req, res) => {
  try {
    const hazards = await Hazard.find()
      .populate('reportedBy', 'displayName username email')
      .populate('resolvedBy', 'displayName username')
      .sort({ createdAt: -1 })
      .limit(500);
    res.json(hazards);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/hazards/:id', adminMiddleware, async (req, res) => {
  try {
    const hazard = await Hazard.findById(req.params.id)
      .populate('reportedBy', 'displayName username email')
      .populate('resolvedBy', 'displayName username');
    if (!hazard) return res.status(404).json({ error: 'Hazard not found' });
    res.json(hazard);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/hazards/:id', adminMiddleware, async (req, res) => {
  try {
    const updates = pickEditable('hazard', req.body);
    const hazard = await Hazard.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true })
      .populate('reportedBy', 'displayName username email');
    if (!hazard) return res.status(404).json({ error: 'Hazard not found' });
    res.json(hazard);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/hazards/:id', adminMiddleware, async (req, res) => {
  try {
    const hazard = await Hazard.findByIdAndDelete(req.params.id);
    if (!hazard) return res.status(404).json({ error: 'Hazard not found' });
    res.json({ message: 'Hazard deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* ─────────────────────────────────────────────────────────────────
 * LOGBOOK — list / get / update / delete
 * ───────────────────────────────────────────────────────────────── */

router.get('/logbooks', adminMiddleware, async (req, res) => {
  try {
    const logs = await Logbook.find()
      .populate({ path: 'boatId', select: 'boatName boatIndexNumber ownerId', populate: { path: 'ownerId', select: 'displayName username' } })
      .sort({ entryDate: -1 })
      .limit(500);
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/logbooks/:id', adminMiddleware, async (req, res) => {
  try {
    const updates = pickEditable('logbook', req.body);
    updates.updatedAt = new Date();
    const log = await Logbook.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!log) return res.status(404).json({ error: 'Log entry not found' });
    res.json(log);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/logbooks/:id', adminMiddleware, async (req, res) => {
  try {
    const log = await Logbook.findByIdAndDelete(req.params.id);
    if (!log) return res.status(404).json({ error: 'Log entry not found' });
    res.json({ message: 'Log entry deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* ─────────────────────────────────────────────────────────────────
 * Removal analytics + promote (unchanged)
 * ───────────────────────────────────────────────────────────────── */

router.get('/analytics/removals', adminMiddleware, async (req, res) => {
  try {
    const records = await ListingAnalytics.find()
      .populate('sellerId', 'displayName username')
      .sort({ removedAt: -1 })
      .limit(500);
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

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

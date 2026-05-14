import express from 'express';
import Boat from '../models/Boat.js';
import User from '../models/User.js';
import Product from '../models/Product.js';
import Logbook from '../models/Logbook.js';
import Hazard from '../models/Hazard.js';
import ListingAnalytics from '../models/ListingAnalytics.js';
import Post from '../models/Post.js';
import Report from '../models/Report.js';
import Message from '../models/Message.js';
import TradeProfile from '../models/TradeProfile.js';
import AdminAction from '../models/AdminAction.js';
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

function logAction(adminId, action, targetType, targetId, details) {
  AdminAction.create({ adminId, action, targetType, targetId, details }).catch(() => {});
}

/* ─────────────────────────────────────────────────────────────────
 * Certifications (boat verification queue)
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

    logAction(req.user.userId, 'approve_certification', 'boat', boat._id, `Approved boat ${boat.boatName}`);

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

    logAction(req.user.userId, 'reject_certification', 'boat', boat._id, `Rejected boat ${boat.boatName}: ${reason}`);

    await boat.populate('ownerId', 'displayName username profilePhotoUrl');
    res.json({ message: 'Certification rejected', boat });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* ─────────────────────────────────────────────────────────────────
 * Stats (Overview) — now includes pending counts for review queue
 * ───────────────────────────────────────────────────────────────── */

router.get('/stats', adminMiddleware, async (req, res) => {
  try {
    const [
      totalUsers, verifiedUsers,
      totalBoats, pendingBoats, verifiedBoats,
      totalListings, activeListings,
      totalLogEntries, totalHazards,
      totalRemovals,
      pendingReports, pendingTradeProfiles,
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
      Report.countDocuments({ status: 'pending' }),
      TradeProfile.countDocuments({ status: 'pending' }),
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
      pendingQueue: {
        certifications: pendingBoats,
        reports: pendingReports,
        tradeProfiles: pendingTradeProfiles,
        total: pendingBoats + pendingReports + pendingTradeProfiles,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* ─────────────────────────────────────────────────────────────────
 * USERS — list (with search) / get / update / delete
 * ───────────────────────────────────────────────────────────────── */

router.get('/users', adminMiddleware, async (req, res) => {
  try {
    const { q } = req.query;
    let filter = {};
    if (q && q.trim()) {
      const re = new RegExp(q.trim(), 'i');
      filter = { $or: [{ displayName: re }, { username: re }, { email: re }, { firstName: re }, { surname: re }] };
    }
    const users = await User.find(filter).sort({ createdAt: -1 }).limit(500);
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
    logAction(req.user.userId, 'update', 'user', user._id, `Updated user ${user.displayName || user.email}`);
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
    logAction(req.user.userId, 'delete', 'user', req.params.id, `Deleted user ${user.displayName || user.email}`);
    res.json({ message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* ─────────────────────────────────────────────────────────────────
 * LISTINGS (Products) — list (with search) / get / update / delete
 * ───────────────────────────────────────────────────────────────── */

router.get('/listings', adminMiddleware, async (req, res) => {
  try {
    const { q } = req.query;
    let filter = {};
    if (q && q.trim()) {
      const re = new RegExp(q.trim(), 'i');
      filter = { $or: [{ title: re }, { description: re }, { category: re }, { location: re }] };
    }
    const listings = await Product.find(filter)
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
    logAction(req.user.userId, 'update', 'listing', product._id, `Updated listing "${product.title}"`);
    res.json(product);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/listings/:id', adminMiddleware, async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ error: 'Listing not found' });
    logAction(req.user.userId, 'delete', 'listing', req.params.id, `Deleted listing "${product.title}"`);
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
    logAction(req.user.userId, 'update', 'boat', boat._id, `Updated boat ${boat.boatName}`);
    res.json(boat);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/boats/:id', adminMiddleware, async (req, res) => {
  try {
    const boat = await Boat.findByIdAndDelete(req.params.id);
    if (!boat) return res.status(404).json({ error: 'Boat not found' });
    logAction(req.user.userId, 'delete', 'boat', req.params.id, `Deleted boat ${boat.boatName}`);
    res.json({ message: 'Boat deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* ─────────────────────────────────────────────────────────────────
 * HAZARDS — list / get / create / update / delete
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

router.post('/hazards', adminMiddleware, async (req, res) => {
  try {
    const { hazardType, description, severity, lat, lng, startsAt, expiresAt, photos } = req.body;
    if (!hazardType || !description || lat == null || lng == null || !expiresAt) {
      return res.status(400).json({ error: 'hazardType, description, lat, lng, and expiresAt are required' });
    }
    const hazard = await Hazard.create({
      reportedBy: req.user.userId,
      hazardType,
      description,
      severity: severity || 'medium',
      lat,
      lng,
      source: 'admin',
      startsAt: startsAt || new Date(),
      expiresAt,
      photos: photos || [],
    });
    logAction(req.user.userId, 'create', 'hazard', hazard._id, `Created hazard: ${hazardType}`);
    const populated = await Hazard.findById(hazard._id)
      .populate('reportedBy', 'displayName username email');
    res.status(201).json(populated);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/hazards/:id', adminMiddleware, async (req, res) => {
  try {
    const updates = pickEditable('hazard', req.body);
    const hazard = await Hazard.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true })
      .populate('reportedBy', 'displayName username email');
    if (!hazard) return res.status(404).json({ error: 'Hazard not found' });
    logAction(req.user.userId, 'update', 'hazard', hazard._id, `Updated hazard ${hazard.hazardType}`);
    res.json(hazard);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/hazards/:id', adminMiddleware, async (req, res) => {
  try {
    const hazard = await Hazard.findByIdAndDelete(req.params.id);
    if (!hazard) return res.status(404).json({ error: 'Hazard not found' });
    logAction(req.user.userId, 'delete', 'hazard', req.params.id, `Deleted hazard ${hazard.hazardType}`);
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
    logAction(req.user.userId, 'update', 'logbook', log._id, 'Updated logbook entry');
    res.json(log);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/logbooks/:id', adminMiddleware, async (req, res) => {
  try {
    const log = await Logbook.findByIdAndDelete(req.params.id);
    if (!log) return res.status(404).json({ error: 'Log entry not found' });
    logAction(req.user.userId, 'delete', 'logbook', req.params.id, 'Deleted logbook entry');
    res.json({ message: 'Log entry deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* ─────────────────────────────────────────────────────────────────
 * Removal analytics + promote
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
    logAction(req.user.userId, 'promote', 'user', user._id, `Promoted ${user.email} to admin`);
    res.json({ message: `${user.email} promoted to admin` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* ─────────────────────────────────────────────────────────────────
 * REPORTS — list / approve / dismiss
 * ───────────────────────────────────────────────────────────────── */

const REASON_LABELS = {
  spam_scam: 'Spam or scam',
  harassment: 'Harassment or abuse',
  hate_speech: 'Hate speech',
  sexual_content: 'Sexual or explicit content',
  misinformation: 'Misinformation',
  impersonation: 'Impersonation',
  off_topic: 'Off-topic / not boating-related',
  other: 'Other',
};

router.get('/reports', adminMiddleware, async (req, res) => {
  try {
    const { status = 'pending' } = req.query;
    const reports = await Report.find({ status })
      .populate('reporter', 'displayName username email profilePhotoUrl _id')
      .populate('resolvedBy', 'displayName username')
      .sort({ createdAt: -1 })
      .limit(500);

    const enriched = await Promise.all(reports.map(async (r) => {
      let target = null;
      let replySnapshot = null;
      try {
        if (r.targetType === 'post') {
          target = await Post.findById(r.targetId)
            .populate('authorId', 'displayName username email profilePhotoUrl _id')
            .lean();
        } else if (r.targetType === 'reply') {
          const post = await Post.findById(r.targetId)
            .populate('authorId', 'displayName username email profilePhotoUrl _id')
            .populate('replies.authorId', 'displayName username email profilePhotoUrl _id')
            .lean();
          if (post) {
            target = post;
            replySnapshot = post.replies?.find(rr => rr._id?.toString() === r.replyId?.toString()) || null;
          }
        } else if (r.targetType === 'product') {
          target = await Product.findById(r.targetId)
            .populate('sellerId', 'displayName username email profilePhotoUrl _id')
            .lean();
        } else if (r.targetType === 'user') {
          target = await User.findById(r.targetId)
            .select('displayName username email profilePhotoUrl reportStatus _id bio')
            .lean();
        }
      } catch {}
      return { ...r.toObject(), target, replySnapshot };
    }));

    res.json(enriched);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/reports/:id/approve', adminMiddleware, async (req, res) => {
  try {
    const { adminNote } = req.body;
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ error: 'Report not found' });
    if (report.status !== 'pending') return res.status(400).json({ error: 'Report already resolved' });

    report.status = 'approved';
    report.adminNote = adminNote || null;
    report.resolvedBy = req.user.userId;
    report.resolvedAt = new Date();
    await report.save();

    let reportedUserId = null;
    if (report.targetType === 'post') {
      const post = await Post.findById(report.targetId);
      if (post) {
        reportedUserId = post.authorId;
        post.reportStatus = 'removed';
        await post.save();
      }
    } else if (report.targetType === 'product') {
      const product = await Product.findById(report.targetId);
      if (product) {
        reportedUserId = product.sellerId;
        product.reportStatus = 'removed';
        product.isAvailable = false;
        await product.save();
      }
    } else if (report.targetType === 'user') {
      const user = await User.findById(report.targetId);
      if (user) {
        reportedUserId = user._id;
        user.reportStatus = 'removed';
        await user.save();
      }
    }

    if (report.targetType === 'reply') {
      const post = await Post.findById(report.targetId);
      if (post && report.replyId) {
        const reply = post.replies.id(report.replyId);
        if (reply) {
          reportedUserId = reply.authorId;
          reply.deleteOne();
          post.replyCount = post.replies.length;
          await post.save();
        }
      }
    }

    if (reportedUserId) {
      const typeLabel = report.targetType === 'post' ? 'post' : report.targetType === 'product' ? 'listing' : report.targetType === 'reply' ? 'reply' : 'profile';
      const noteText = adminNote ? ` Admin note: "${adminNote}".` : '';
      await Message.create({
        senderId: req.user.userId,
        recipientId: reportedUserId,
        subject: 'Content removed following a report',
        body: `Hi — your ${typeLabel} was reviewed following a community report and has been removed for violating our community guidelines (reason: ${REASON_LABELS[report.reason] || report.reason}).${noteText} If you have questions, please reply to this message.`,
      });
    }

    logAction(req.user.userId, 'approve_report', 'report', report._id, `Approved report (${report.targetType}): ${report.reason}`);
    res.json({ message: 'Report approved, content removed, user notified' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/reports/:id/dismiss', adminMiddleware, async (req, res) => {
  try {
    const { adminNote } = req.body;
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ error: 'Report not found' });
    if (report.status !== 'pending') return res.status(400).json({ error: 'Report already resolved' });

    report.status = 'dismissed';
    report.adminNote = adminNote || null;
    report.resolvedBy = req.user.userId;
    report.resolvedAt = new Date();
    await report.save();

    if (report.targetType === 'post') {
      await Post.findByIdAndUpdate(report.targetId, { reportStatus: 'active' });
    } else if (report.targetType === 'product') {
      await Product.findByIdAndUpdate(report.targetId, { reportStatus: 'active', isAvailable: true });
    } else if (report.targetType === 'user') {
      await User.findByIdAndUpdate(report.targetId, { reportStatus: 'active' });
    }

    await Message.create({
      senderId: req.user.userId,
      recipientId: report.reporter,
      subject: 'Update on your report',
      body: `Thanks for flagging that content. We've reviewed your report and found it doesn't violate our community guidelines, so no action was taken. We appreciate you helping keep Waterline safe.`,
    });

    logAction(req.user.userId, 'dismiss_report', 'report', report._id, `Dismissed report (${report.targetType}): ${report.reason}`);
    res.json({ message: 'Report dismissed, content restored, reporter notified' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/* ─────────────────────────────────────────────────────────────────
 * TRADE PROFILES — review queue
 * ───────────────────────────────────────────────────────────────── */

router.get('/trade-profiles', adminMiddleware, async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};
    const profiles = await TradeProfile.find(filter)
      .populate('userId', 'displayName username email profilePhotoUrl _id')
      .populate('reviewedBy', 'displayName username')
      .sort({ updatedAt: -1 })
      .limit(200);
    res.json(profiles);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/trade-profiles/:id/approve', adminMiddleware, async (req, res) => {
  try {
    const { adminNote } = req.body;
    const profile = await TradeProfile.findById(req.params.id).populate('userId', '_id displayName username email');
    if (!profile) return res.status(404).json({ error: 'Trade profile not found' });

    profile.status = 'approved';
    profile.adminNote = adminNote || null;
    profile.reviewedBy = req.user.userId;
    profile.reviewedAt = new Date();
    await profile.save();

    if (profile.userId?._id) {
      const noteText = adminNote ? ` Note: "${adminNote}".` : '';
      await Message.create({
        senderId: req.user.userId,
        recipientId: profile.userId._id,
        subject: 'Your trade profile has been approved',
        body: `Great news — your Waterline trade profile has been reviewed and approved. You're now listed in the Services marketplace and boaters can find and contact you directly.${noteText}`,
      });
    }

    logAction(req.user.userId, 'approve_trade_profile', 'trade_profile', profile._id, `Approved trade profile for ${profile.businessName}`);
    res.json({ message: 'Trade profile approved', profile });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/trade-profiles/:id/reject', adminMiddleware, async (req, res) => {
  try {
    const { reason } = req.body;
    if (!reason) return res.status(400).json({ error: 'Rejection reason required' });

    const profile = await TradeProfile.findById(req.params.id).populate('userId', '_id displayName username email');
    if (!profile) return res.status(404).json({ error: 'Trade profile not found' });

    profile.status = 'rejected';
    profile.adminNote = reason;
    profile.reviewedBy = req.user.userId;
    profile.reviewedAt = new Date();
    await profile.save();

    if (profile.userId?._id) {
      await Message.create({
        senderId: req.user.userId,
        recipientId: profile.userId._id,
        subject: 'Your trade profile needs updating',
        body: `Thanks for submitting your Waterline trade profile. After review, we weren't able to approve it at this time. Reason: "${reason}". Please update your profile and resubmit.`,
      });
    }

    logAction(req.user.userId, 'reject_trade_profile', 'trade_profile', profile._id, `Rejected trade profile for ${profile.businessName}: ${reason}`);
    res.json({ message: 'Trade profile rejected', profile });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;

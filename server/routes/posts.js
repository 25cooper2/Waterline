import express from 'express';
import Post from '../models/Post.js';
import Follow from '../models/Follow.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Haversine miles
function milesBetween(lat1, lng1, lat2, lng2) {
  const R = 3958.8;
  const toRad = d => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

const parseTags = (raw) => {
  if (!raw) return [];
  const norm = (t) => String(t).replace(/^#/, '').toLowerCase().trim();
  if (Array.isArray(raw)) return raw.map(norm).filter(Boolean).slice(0, 8);
  return String(raw).split(',').map(norm).filter(Boolean).slice(0, 8);
};

// Create post
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { body, tags, lat, lng, locationName, photos } = req.body;
    if (!body || !body.trim()) return res.status(400).json({ error: 'Post body required' });

    const post = new Post({
      authorId: req.user.userId,
      body: body.trim(),
      tags: parseTags(tags),
      lat: lat ?? null,
      lng: lng ?? null,
      locationName: locationName || null,
      photos: Array.isArray(photos) ? photos.slice(0, 3) : [],
    });
    await post.save();
    await post.populate('authorId', 'displayName username profilePhotoUrl boatIndexNumber boatName');
    res.status(201).json(post);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// List posts. Query: lat, lng, radius (miles), tag, q (text), followingOnly, authorId, limit
// Public — no auth required to read the feed.
router.get('/', async (req, res) => {
  try {
    const { lat, lng, radius, tag, q, followingOnly, authorId, limit } = req.query;
    const filter = { reportStatus: 'active' };

    let currentUserId = null;
    if (req.headers.authorization) {
      try {
        const jwt = (await import('jsonwebtoken')).default;
        const token = req.headers.authorization.replace('Bearer ', '');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
        currentUserId = decoded.userId;
      } catch {}
    }

    if (tag) filter.tags = String(tag).toLowerCase().trim();
    if (authorId) filter.authorId = authorId;
    if (q) filter.$or = [
      { body: { $regex: q, $options: 'i' } },
      { tags: { $regex: q.replace(/^#/, '').toLowerCase(), $options: 'i' } },
    ];

    if (followingOnly === 'true' && currentUserId) {
      const follows = await Follow.find({ followerId: currentUserId }).select('followingId');
      const ids = follows.map(f => f.followingId);
      ids.push(currentUserId);
      filter.authorId = { $in: ids };
    }

    let posts = await Post.find(filter)
      .populate('authorId', 'displayName username profilePhotoUrl boatIndexNumber boatName')
      .sort({ createdAt: -1 })
      .limit(Math.min(parseInt(limit) || 100, 200))
      .exec();

    if (lat && lng && radius) {
      const lat0 = parseFloat(lat), lng0 = parseFloat(lng), r = parseFloat(radius);
      posts = posts.filter(p => {
        if (p.lat == null || p.lng == null) return false;
        return milesBetween(lat0, lng0, p.lat, p.lng) <= r;
      });
    }

    const out = posts.map(p => {
      const obj = p.toObject();
      obj.likedByMe = currentUserId ? p.likes.some(id => id.toString() === currentUserId) : false;
      return obj;
    });
    res.json(out);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Single post (with replies populated)
router.get('/:postId', async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId)
      .populate('authorId', 'displayName username profilePhotoUrl boatIndexNumber boatName')
      .populate('replies.authorId', 'displayName username profilePhotoUrl boatIndexNumber');
    if (!post) return res.status(404).json({ error: 'Post not found' });
    res.json(post);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Reply to a post
router.post('/:postId/reply', authMiddleware, async (req, res) => {
  try {
    const { body } = req.body;
    if (!body || !body.trim()) return res.status(400).json({ error: 'Reply body required' });
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    if (post.reportStatus !== 'active') return res.status(403).json({ error: 'Post unavailable' });
    post.replies.push({ authorId: req.user.userId, body: body.trim() });
    post.replyCount = post.replies.length;
    await post.save();
    await post.populate('replies.authorId', 'displayName username profilePhotoUrl boatIndexNumber');
    res.status(201).json(post.replies[post.replies.length - 1]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Like / unlike a post (toggle)
router.post('/:postId/like', authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    const uid = req.user.userId;
    const idx = post.likes.findIndex(id => id.toString() === uid);
    if (idx === -1) {
      post.likes.push(uid);
    } else {
      post.likes.splice(idx, 1);
    }
    post.likeCount = post.likes.length;
    await post.save();
    res.json({ likeCount: post.likeCount, likedByMe: idx === -1 });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Report a post — delegates to the unified /api/reports endpoint logic
router.post('/:postId/report', authMiddleware, async (req, res) => {
  try {
    const { reason, details } = req.body || {};
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ error: 'Post not found' });

    // Update inline fields on post
    if (!post.reportedBy.some(id => id.toString() === req.user.userId)) {
      post.reportedBy.push(req.user.userId);
    }
    if (reason) post.reportReasons.push(String(reason).slice(0, 200));
    post.reportStatus = 'pending_review';
    await post.save();

    // Create Report document for admin queue (ignore if duplicate)
    const Report = (await import('../models/Report.js')).default;
    const VALID_REASONS = ['spam_scam', 'harassment', 'hate_speech', 'sexual_content', 'misinformation', 'impersonation', 'off_topic', 'other'];
    const safeReason = VALID_REASONS.includes(reason) ? reason : 'other';
    await Report.findOneAndUpdate(
      { reporter: req.user.userId, targetType: 'post', targetId: req.params.postId },
      { $setOnInsert: { reporter: req.user.userId, targetType: 'post', targetId: req.params.postId, reason: safeReason, details: details ? String(details).slice(0, 500) : null } },
      { upsert: true, new: false }
    ).catch(() => {}); // swallow duplicate key errors silently

    res.json({ message: 'Reported. Post hidden pending review.' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Report a reply inside a post
router.post('/:postId/replies/:replyId/report', authMiddleware, async (req, res) => {
  try {
    const { reason, details } = req.body || {};
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ error: 'Post not found' });

    const reply = post.replies.id(req.params.replyId);
    if (!reply) return res.status(404).json({ error: 'Reply not found' });

    if (reply.authorId.toString() === req.user.userId) {
      return res.status(400).json({ error: 'You cannot report your own reply' });
    }

    const Report = (await import('../models/Report.js')).default;
    const VALID_REASONS = ['spam_scam', 'harassment', 'hate_speech', 'sexual_content', 'misinformation', 'impersonation', 'off_topic', 'other'];
    const safeReason = VALID_REASONS.includes(reason) ? reason : 'other';

    await Report.findOneAndUpdate(
      { reporter: req.user.userId, targetType: 'reply', targetId: post._id, replyId: reply._id },
      { $setOnInsert: {
        reporter: req.user.userId,
        targetType: 'reply',
        targetId: post._id,
        replyId: reply._id,
        reason: safeReason,
        details: details ? String(details).slice(0, 500) : null,
      }},
      { upsert: true, new: false }
    ).catch(() => {});

    res.json({ message: 'Reply reported. Our team will review it.' });
  } catch (e) {
    if (e.code === 11000) return res.status(409).json({ error: 'You have already reported this reply' });
    res.status(500).json({ error: e.message });
  }
});

// Tag autocomplete — returns matching tags by prefix
router.get('/_/tags/search', async (req, res) => {
  try {
    const q = String(req.query.q || '').replace(/^#/, '').toLowerCase().trim();
    if (!q) return res.json([]);
    const results = await Post.aggregate([
      { $match: { reportStatus: 'active', tags: { $regex: '^' + q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') } } },
      { $unwind: '$tags' },
      { $match: { tags: { $regex: '^' + q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') } } },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 8 },
    ]);
    res.json(results.map(r => ({ tag: r._id, count: r.count })));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Trending tags (top 20 in last 30 days)
router.get('/_/tags/trending', async (req, res) => {
  try {
    const since = new Date(Date.now() - 30 * 86400000);
    const result = await Post.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 20 },
    ]);
    res.json(result.map(r => ({ tag: r._id, count: r.count })));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Delete (author only)
router.delete('/:postId', authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    if (post.authorId.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    await Post.deleteOne({ _id: post._id });
    res.json({ message: 'Post deleted' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;

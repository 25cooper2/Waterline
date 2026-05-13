import express from 'express';
import Report, { REPORT_REASONS } from '../models/Report.js';
import Post from '../models/Post.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

async function getTarget(targetType, targetId) {
  if (targetType === 'post') return Post.findById(targetId);
  if (targetType === 'product') return Product.findById(targetId);
  if (targetType === 'user') return User.findById(targetId);
  return null;
}

// POST /api/reports — file a report against a post, product, or user
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { targetType, targetId, reason, details } = req.body;

    if (!['post', 'product', 'user'].includes(targetType)) {
      return res.status(400).json({ error: 'Invalid targetType' });
    }
    if (!REPORT_REASONS.includes(reason)) {
      return res.status(400).json({ error: 'Invalid reason' });
    }
    if (!targetId) {
      return res.status(400).json({ error: 'targetId required' });
    }

    // Cannot report yourself
    if (targetType === 'user' && targetId === req.user.userId) {
      return res.status(400).json({ error: 'You cannot report yourself' });
    }

    const target = await getTarget(targetType, targetId);
    if (!target) return res.status(404).json({ error: 'Content not found' });

    // Deduplicate: one report per user per target
    const existing = await Report.findOne({
      reporter: req.user.userId,
      targetType,
      targetId,
    });
    if (existing) {
      return res.status(409).json({ error: 'You have already reported this content' });
    }

    // Create report doc
    const report = new Report({
      reporter: req.user.userId,
      targetType,
      targetId,
      reason,
      details: details ? String(details).slice(0, 500) : null,
    });
    await report.save();

    // Update target's reportStatus
    if (targetType === 'post') {
      if (!target.reportedBy.some(id => id.toString() === req.user.userId)) {
        target.reportedBy.push(req.user.userId);
      }
      if (reason) target.reportReasons.push(reason);
      target.reportStatus = 'pending_review';
      await target.save();
    } else if (targetType === 'product') {
      if (!target.reportedBy.some(id => id.toString() === req.user.userId)) {
        target.reportedBy.push(req.user.userId);
      }
      target.reportStatus = 'pending_review';
      await target.save();
    } else if (targetType === 'user') {
      target.reportStatus = 'pending_review';
      await target.save();
    }

    res.status(201).json({ message: 'Report submitted. Our team will review it shortly.' });
  } catch (e) {
    if (e.code === 11000) {
      return res.status(409).json({ error: 'You have already reported this content' });
    }
    res.status(500).json({ error: e.message });
  }
});

export default router;

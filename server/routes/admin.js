import express from 'express';
import Boat from '../models/Boat.js';
import User from '../models/User.js';
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

// Get admin statistics
router.get('/stats', adminMiddleware, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const verifiedUsers = await User.countDocuments({ isVerified: true });
    const totalBoats = await Boat.countDocuments();
    const pendingBoats = await Boat.countDocuments({ verificationStatus: 'pending_approval' });
    const verifiedBoats = await Boat.countDocuments({ verificationStatus: 'verified' });

    res.json({
      users: {
        total: totalUsers,
        verified: verifiedUsers
      },
      boats: {
        total: totalBoats,
        pending: pendingBoats,
        verified: verifiedBoats
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

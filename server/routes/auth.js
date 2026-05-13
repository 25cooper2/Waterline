import express from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.js';
import Boat from '../models/Boat.js';
import Product from '../models/Product.js';
import Logbook from '../models/Logbook.js';
import TradeProfile from '../models/TradeProfile.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  try {
    const { email, password, displayName } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already in use' });
    }

    const user = new User({
      email,
      passwordHash: password,
      displayName: displayName || null
    });

    await user.save();

    const token = jwt.sign(
      { userId: user._id, role: user.role, isVerified: user.isVerified },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      user: user.toJSON(),
      token
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role, isVerified: user.isVerified },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      user: user.toJSON(),
      token
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get current user
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    const userData = user.toJSON();
    const tp = await TradeProfile.findOne({ userId: req.user.userId });
    if (tp) {
      userData.tradeProfileStatus = tp.status;
      userData.isTrader = tp.status === 'approved';
    }
    const boat = await Boat.findOne({
      $or: [{ ownerId: req.user.userId }, { coOwners: req.user.userId }]
    });
    if (boat) {
      userData.boatId = boat._id;
      userData.boatIndexNumber = boat.boatIndexNumber;
      userData.boatName = boat.boatName;
      userData.isBoatOwner = boat.ownerId.toString() === req.user.userId;

      // Lazy-backfill: if user has no mooring saved, pull from latest open logbook entry
      if (user.mooringLat == null && boat._id) {
        const openEntry = await Logbook.findOne({
          boatId: boat._id,
          endDate: null,
          lat: { $ne: null },
        }).sort({ entryDate: -1 });
        if (openEntry?.lat != null) {
          await User.findByIdAndUpdate(req.user.userId, {
            mooringLat: openEntry.lat,
            mooringLng: openEntry.lng,
            mooringLocation: openEntry.startLocation || null,
          });
          userData.mooringLat = openEntry.lat;
          userData.mooringLng = openEntry.lng;
          userData.mooringLocation = openEntry.startLocation || null;
        }
      }
    }
    res.json(userData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Check username availability
router.get('/check-username', async (req, res) => {
  try {
    const { username } = req.query;
    if (!username || username.length < 3) return res.json({ available: false });
    const normalized = username.toLowerCase();
    // Exclude the requesting user's own username if authenticated
    let excludeId = null;
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const payload = jwt.verify(authHeader.slice(7), process.env.JWT_SECRET);
        excludeId = payload.userId;
      } catch { /* ignore invalid token */ }
    }
    const query = { username: normalized };
    if (excludeId) query._id = { $ne: excludeId };
    const existing = await User.findOne(query).select('_id');
    res.json({ available: !existing });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update current user profile
router.put('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const { firstName, surname, displayName, username, bio, profilePhotoUrl, avatarColor } = req.body;
    if (firstName !== undefined) user.firstName = firstName || null;
    if (surname !== undefined) user.surname = surname || null;
    if (displayName !== undefined) user.displayName = displayName;
    if (username !== undefined) user.username = username ? username.toLowerCase() : null;
    if (bio !== undefined) user.bio = bio;
    if (profilePhotoUrl !== undefined) user.profilePhotoUrl = profilePhotoUrl;
    if (avatarColor !== undefined) user.avatarColor = avatarColor;
    user.updatedAt = new Date();
    await user.save();
    res.json(user.toJSON());
  } catch (error) {
    if (error.code === 11000) return res.status(400).json({ error: 'Username already taken' });
    res.status(500).json({ error: error.message });
  }
});

// Delete account
router.delete('/me', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Remove boats owned by this user and their associated data
    const boats = await Boat.find({ ownerId: userId });
    for (const boat of boats) {
      await Product.deleteMany({ boatId: boat._id });
      await Logbook.deleteMany({ boatId: boat._id });
    }
    await Boat.deleteMany({ ownerId: userId });

    // Remove user's own listings
    await Product.deleteMany({ sellerId: userId });

    // Remove user account
    await User.findByIdAndDelete(userId);
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Forgot password — generate reset token. Returns the reset URL in the response
// (no email service configured; in production this would be emailed).
router.post('/forgot', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });
    const user = await User.findOne({ email: email.toLowerCase() });
    // Always return success to avoid leaking which emails exist
    if (!user) return res.json({ ok: true, message: 'If that email exists, a reset link has been generated.' });
    const token = crypto.randomBytes(24).toString('hex');
    user.passwordResetToken = token;
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1h
    await user.save();
    // Return the reset link directly so the user can click it (stub for missing email service)
    const origin = req.headers.origin || '';
    const resetUrl = `${origin}/reset-password?token=${token}`;
    res.json({ ok: true, message: 'Reset link generated.', resetUrl });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Reset password — verify token, set new password
router.post('/reset', async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ error: 'Token and new password required' });
    if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: new Date() },
    });
    if (!user) return res.status(400).json({ error: 'Invalid or expired reset link' });
    user.passwordHash = password; // pre-save hook hashes
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    await user.save();
    res.json({ ok: true, message: 'Password reset successfully. You can now log in.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

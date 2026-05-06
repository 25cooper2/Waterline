import express from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.js';
import Boat from '../models/Boat.js';
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
    const boat = await Boat.findOne({
      $or: [{ ownerId: req.user.userId }, { coOwners: req.user.userId }]
    });
    if (boat) {
      userData.boatId = boat._id;
      userData.boatIndexNumber = boat.boatIndexNumber;
      userData.boatName = boat.boatName;
      userData.isBoatOwner = boat.ownerId.toString() === req.user.userId;
    }
    res.json(userData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update current user profile (displayName, username, bio, profilePhotoUrl, avatarColor)
router.put('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const { displayName, username, bio, profilePhotoUrl, avatarColor } = req.body;
    if (displayName !== undefined) user.displayName = displayName;
    if (username !== undefined) user.username = username || null;
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

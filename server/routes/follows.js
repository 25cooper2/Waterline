import express from 'express';
import Follow from '../models/Follow.js';
import User from '../models/User.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Follow user
router.post('/:userId/follow', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;

    if (userId === req.user.userId) {
      return res.status(400).json({ error: 'Cannot follow yourself' });
    }

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const existingFollow = await Follow.findOne({
      followerId: req.user.userId,
      followingId: userId
    });

    if (existingFollow) {
      return res.status(400).json({ error: 'Already following this user' });
    }

    const follow = new Follow({
      followerId: req.user.userId,
      followingId: userId
    });

    await follow.save();
    res.status(201).json(follow);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Unfollow user
router.delete('/:userId/follow', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await Follow.findOneAndDelete({
      followerId: req.user.userId,
      followingId: userId
    });

    if (!result) {
      return res.status(404).json({ error: 'Follow relationship not found' });
    }

    res.json({ message: 'Unfollowed' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get following list
router.get('/:userId/following', async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const following = await Follow.find({ followerId: userId })
      .populate('followingId', 'displayName username profilePhotoUrl isVerified')
      .sort({ createdAt: -1 })
      .exec();

    res.json(following.map(f => f.followingId));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get followers list
router.get('/:userId/followers', async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const followers = await Follow.find({ followingId: userId })
      .populate('followerId', 'displayName username profilePhotoUrl isVerified')
      .sort({ createdAt: -1 })
      .exec();

    res.json(followers.map(f => f.followerId));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Check if following
router.get('/:userId/is-following', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;

    const follow = await Follow.findOne({
      followerId: req.user.userId,
      followingId: userId
    });

    res.json({ isFollowing: !!follow });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

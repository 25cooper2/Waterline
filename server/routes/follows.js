import express from 'express';
import Follow from '../models/Follow.js';
import User from '../models/User.js';
import FriendRequest from '../models/FriendRequest.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Search users by username, display name, or boat name (must be before :userId)
router.get('/_search', authMiddleware, async (req, res) => {
  try {
    const q = String(req.query.q || '').trim();
    if (q.length < 2) return res.json([]);
    const re = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    const users = await User.find({
      _id: { $ne: req.user.userId },
      $or: [
        { username: re },
        { displayName: re },
        { boatName: re },
        { boatIndexNumber: re },
      ],
    }).select('displayName username profilePhotoUrl boatIndexNumber boatName').limit(15);
    res.json(users);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── Friend requests (all /me routes must come before /:userId) ──────────────

// Get my accepted friends
router.get('/me/friends', authMiddleware, async (req, res) => {
  try {
    const myId = req.user.userId;
    const accepted = await FriendRequest.find({
      status: 'accepted',
      $or: [{ sender: myId }, { receiver: myId }],
    }).populate('sender receiver', 'displayName username profilePhotoUrl boatName boatIndexNumber mooringLat mooringLng');

    const friends = accepted.map(fr =>
      String(fr.sender._id) === myId ? fr.receiver : fr.sender
    );
    res.json(friends);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Get pending incoming friend requests (sent TO me)
router.get('/me/friend-requests', authMiddleware, async (req, res) => {
  try {
    const requests = await FriendRequest.find({
      receiver: req.user.userId,
      status: 'pending',
    }).populate('sender', 'displayName username profilePhotoUrl boatName boatIndexNumber');
    res.json(requests);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Public profile (safe fields only)
router.get('/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .select('displayName username profilePhotoUrl bio boatId boatName boatIndexNumber boatType isVerified createdAt');
    if (!user) return res.status(404).json({ error: 'User not found' });
    const followerCount = await Follow.countDocuments({ followingId: user._id });
    const followingCount = await Follow.countDocuments({ followerId: user._id });
    res.json({ ...user.toObject(), followerCount, followingCount });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

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

// Get friend status with a specific user
router.get('/:userId/friend-status', authMiddleware, async (req, res) => {
  try {
    const myId = req.user.userId;
    const { userId } = req.params;
    const fr = await FriendRequest.findOne({
      $or: [
        { sender: myId, receiver: userId },
        { sender: userId, receiver: myId },
      ],
    });
    if (!fr) return res.json({ status: 'none' });
    // From my perspective:
    if (fr.status === 'accepted') return res.json({ status: 'friends' });
    if (fr.status === 'pending' && String(fr.sender) === myId) return res.json({ status: 'sent' });
    if (fr.status === 'pending' && String(fr.receiver) === myId) return res.json({ status: 'received' });
    res.json({ status: fr.status });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Send a friend request
router.post('/:userId/friend-request', authMiddleware, async (req, res) => {
  try {
    const myId = req.user.userId;
    const { userId } = req.params;
    if (myId === userId) return res.status(400).json({ error: 'Cannot friend yourself' });

    const existing = await FriendRequest.findOne({
      $or: [
        { sender: myId, receiver: userId },
        { sender: userId, receiver: myId },
      ],
    });
    if (existing) return res.status(400).json({ error: 'Request already exists', status: existing.status });

    const fr = await FriendRequest.create({ sender: myId, receiver: userId });
    res.status(201).json(fr);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Accept a friend request from userId
router.put('/:userId/friend-request/accept', authMiddleware, async (req, res) => {
  try {
    const myId = req.user.userId;
    const { userId } = req.params;
    const fr = await FriendRequest.findOneAndUpdate(
      { sender: userId, receiver: myId, status: 'pending' },
      { status: 'accepted' },
      { new: true }
    );
    if (!fr) return res.status(404).json({ error: 'Friend request not found' });
    res.json(fr);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Decline a friend request from userId
router.put('/:userId/friend-request/decline', authMiddleware, async (req, res) => {
  try {
    const myId = req.user.userId;
    const { userId } = req.params;
    const fr = await FriendRequest.findOneAndDelete(
      { sender: userId, receiver: myId, status: 'pending' }
    );
    if (!fr) return res.status(404).json({ error: 'Friend request not found' });
    res.json({ message: 'Declined' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Remove a friend (cancel request or unfriend)
router.delete('/:userId/friend', authMiddleware, async (req, res) => {
  try {
    const myId = req.user.userId;
    const { userId } = req.params;
    await FriendRequest.findOneAndDelete({
      $or: [
        { sender: myId, receiver: userId },
        { sender: userId, receiver: myId },
      ],
    });
    res.json({ message: 'Removed' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;

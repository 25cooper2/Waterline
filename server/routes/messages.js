import express from 'express';
import Message from '../models/Message.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Send message or hail
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { recipientId, body, isHail, senderBoatIndexNumber, recipientBoatIndexNumber, subject } = req.body;

    if (!recipientId || !body) {
      return res.status(400).json({ error: 'Recipient ID and message body required' });
    }

    const message = new Message({
      senderId: req.user.userId,
      recipientId,
      body,
      isHail: isHail || false,
      senderBoatIndexNumber: senderBoatIndexNumber || null,
      recipientBoatIndexNumber: recipientBoatIndexNumber || null,
      subject: subject || null
    });

    await message.save();
    await message.populate('senderId', 'displayName username profilePhotoUrl');

    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all messages for current user (inbox)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { unreadOnly } = req.query;
    const filter = { recipientId: req.user.userId };

    if (unreadOnly === 'true') {
      filter.isRead = false;
    }

    const messages = await Message.find(filter)
      .populate('senderId', 'displayName username profilePhotoUrl')
      .sort({ createdAt: -1 })
      .exec();

    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get conversation with specific user
router.get('/conversation/:otherUserId', authMiddleware, async (req, res) => {
  try {
    const { otherUserId } = req.params;

    const messages = await Message.find({
      $or: [
        { senderId: req.user.userId, recipientId: otherUserId },
        { senderId: otherUserId, recipientId: req.user.userId }
      ]
    })
      .populate('senderId', 'displayName username profilePhotoUrl')
      .populate('recipientId', 'displayName username profilePhotoUrl')
      .sort({ createdAt: 1 })
      .exec();

    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mark message as read
router.put('/:messageId/read', authMiddleware, async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    if (message.recipientId.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    message.isRead = true;
    message.readAt = new Date();
    await message.save();

    res.json(message);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete message
router.delete('/:messageId', authMiddleware, async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    if (message.senderId.toString() !== req.user.userId && message.recipientId.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await Message.findByIdAndDelete(req.params.messageId);
    res.json({ message: 'Message deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

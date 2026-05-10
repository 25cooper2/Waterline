import express from 'express';
import Message from '../models/Message.js';
import Boat from '../models/Boat.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Send hail by CRT boat index number
router.post('/hail', authMiddleware, async (req, res) => {
  try {
    const { recipientBoatIndexNumber, body } = req.body;

    if (!recipientBoatIndexNumber || !body) {
      return res.status(400).json({ error: 'Boat index number and message body required' });
    }

    const boat = await Boat.findOne({ boatIndexNumber: recipientBoatIndexNumber.toUpperCase() });

    if (!boat) {
      return res.status(404).json({
        error: 'boat_not_found',
        message: `No boat with index number "${recipientBoatIndexNumber.toUpperCase()}" is on Waterline yet.`
      });
    }

    if (boat.ownerId.toString() === req.user.userId) {
      return res.status(400).json({ error: 'You cannot hail your own boat' });
    }

    const message = new Message({
      senderId: req.user.userId,
      recipientId: boat.ownerId,
      body,
      isHail: true,
      recipientBoatIndexNumber: recipientBoatIndexNumber.toUpperCase(),
    });

    await message.save();
    await message.populate('senderId', 'displayName username profilePhotoUrl');

    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Send message or hail
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { recipientId, body, isHail, senderBoatIndexNumber, recipientBoatIndexNumber, subject, listingId } = req.body;

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
      subject: subject || null,
      listingId: listingId || null,
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

    // unreadOnly is used for the badge count — only received unread messages
    if (unreadOnly === 'true') {
      const unread = await Message.find({ recipientId: req.user.userId, isRead: false })
        .populate('senderId', 'displayName username profilePhotoUrl')
        .sort({ createdAt: -1 })
        .exec();
      return res.json(unread);
    }

    // Full inbox: include both sent and received so threads can be fully reconstructed
    const filter = {
      $or: [
        { recipientId: req.user.userId },
        { senderId: req.user.userId },
      ],
    };

    const messages = await Message.find(filter)
      .populate('senderId', 'displayName username profilePhotoUrl')
      .populate('recipientId', 'displayName username profilePhotoUrl')
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

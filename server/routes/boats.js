import express from 'express';
import Boat from '../models/Boat.js';
import User from '../models/User.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Create boat
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { boatIndexNumber, boatName, boatType } = req.body;

    if (!boatIndexNumber || !boatName) {
      return res.status(400).json({ error: 'Boat index number and name required' });
    }

    const existingBoat = await Boat.findOne({ boatIndexNumber });
    if (existingBoat) {
      return res.status(400).json({ error: 'Boat index number already registered' });
    }

    const boat = new Boat({
      boatIndexNumber,
      boatName,
      ownerId: req.user.userId
    });

    await boat.save();
    res.status(201).json(boat);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get boat
router.get('/:boatId', async (req, res) => {
  try {
    const boat = await Boat.findById(req.params.boatId).populate('ownerId', 'displayName username profilePhotoUrl');
    if (!boat) {
      return res.status(404).json({ error: 'Boat not found' });
    }
    res.json(boat);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update boat details
router.put('/:boatId', authMiddleware, async (req, res) => {
  try {
    const boat = await Boat.findById(req.params.boatId);
    if (!boat) {
      return res.status(404).json({ error: 'Boat not found' });
    }

    if (boat.ownerId.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const { boatName, ownerContactEmail, ownerPhone } = req.body;
    if (boatName) boat.boatName = boatName;
    if (ownerContactEmail) boat.ownerContactEmail = ownerContactEmail;
    if (ownerPhone) boat.ownerPhone = ownerPhone;
    boat.updatedAt = new Date();

    await boat.save();
    res.json(boat);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update location
router.post('/:boatId/update-location', authMiddleware, async (req, res) => {
  try {
    const { lat, lng } = req.body;

    if (lat === undefined || lng === undefined) {
      return res.status(400).json({ error: 'Latitude and longitude required' });
    }

    const boat = await Boat.findById(req.params.boatId);
    if (!boat) {
      return res.status(404).json({ error: 'Boat not found' });
    }

    if (boat.ownerId.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    boat.lastKnownLat = lat;
    boat.lastKnownLng = lng;
    boat.lastLocationUpdate = new Date();

    await boat.save();
    res.json(boat);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Upload certificate (marks boat as pending_approval)
router.post('/:boatId/upload-certificate', authMiddleware, async (req, res) => {
  try {
    const boat = await Boat.findById(req.params.boatId);
    if (!boat) {
      return res.status(404).json({ error: 'Boat not found' });
    }

    if (boat.ownerId.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // For MVP: just mark as pending approval. Admin will review manually.
    boat.verificationStatus = 'pending_approval';
    boat.crtUploadedAt = new Date();

    await boat.save();

    // Mark user as verified in their profile
    const user = await User.findById(req.user.userId);
    if (user) {
      user.isVerified = true;
      user.verificationStatus = 'verified';
      await user.save();
    }

    res.json({ message: 'Certificate submitted for review', boat });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

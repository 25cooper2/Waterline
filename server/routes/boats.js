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

    const normalised = boatIndexNumber.toUpperCase();
    const existingBoat = await Boat.findOne({ boatIndexNumber: normalised });
    if (existingBoat) {
      const alreadyOwner = existingBoat.ownerId.toString() === req.user.userId;
      const alreadyCoOwner = existingBoat.coOwners.some(id => id.toString() === req.user.userId);
      if (alreadyOwner || alreadyCoOwner) {
        return res.status(400).json({ error: 'You are already registered on this boat' });
      }
      existingBoat.coOwners.push(req.user.userId);
      await existingBoat.save();
      return res.status(200).json({ ...existingBoat.toObject(), attached: true });
    }

    const boat = new Boat({
      boatIndexNumber: normalised,
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

    const { boatName, ownerContactEmail, ownerPhone, boatType, boatLength, boatYear, boatPhotoUrl } = req.body;
    if (boatName !== undefined) boat.boatName = boatName;
    if (ownerContactEmail !== undefined) boat.ownerContactEmail = ownerContactEmail;
    if (ownerPhone !== undefined) boat.ownerPhone = ownerPhone;
    if (boatType !== undefined) boat.boatType = boatType;
    if (boatLength !== undefined) boat.boatLength = boatLength;
    if (boatYear !== undefined) boat.boatYear = boatYear;
    if (boatPhotoUrl !== undefined) boat.boatPhotoUrl = boatPhotoUrl;
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
    const { licenseDocUrl } = req.body || {};
    const boat = await Boat.findById(req.params.boatId);
    if (!boat) {
      return res.status(404).json({ error: 'Boat not found' });
    }

    if (boat.ownerId.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    if (licenseDocUrl) boat.licenseDocUrl = licenseDocUrl;
    boat.verificationStatus = 'pending_approval';
    boat.crtUploadedAt = new Date();
    await boat.save();

    // User is NOT marked verified until admin approves.
    res.json({ message: 'Certificate submitted for review', boat });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete boat (owner only)
router.delete('/:boatId', authMiddleware, async (req, res) => {
  try {
    const boat = await Boat.findById(req.params.boatId);
    if (!boat) return res.status(404).json({ error: 'Boat not found' });
    if (boat.ownerId.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    await Boat.deleteOne({ _id: boat._id });
    const user = await User.findById(req.user.userId);
    if (user) {
      // If user's primary boat was this one, clear flags
      if (String(user.boatId) === String(boat._id)) {
        user.boatId = null;
        user.boatIndexNumber = null;
        user.boatName = null;
      }
      user.isVerified = false;
      user.verificationStatus = 'unverified';
      await user.save();
    }
    res.json({ message: 'Boat deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

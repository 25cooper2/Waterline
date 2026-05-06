import express from 'express';
import Hazard from '../models/Hazard.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Report hazard
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { hazardType, description, lat, lng, severity, startsAt, endsAt, photos } = req.body;

    if (!hazardType || !description || lat === undefined || lng === undefined) {
      return res.status(400).json({ error: 'Hazard type, description, latitude, and longitude required' });
    }

    const expiresAt = endsAt ? new Date(endsAt) : (() => {
      const d = new Date(); d.setDate(d.getDate() + 30); return d;
    })();

    const hazard = new Hazard({
      reportedBy: req.user.userId,
      hazardType,
      description,
      lat,
      lng,
      severity: severity || 'medium',
      source: req.user.role === 'admin' ? 'admin' : 'community',
      startsAt: startsAt ? new Date(startsAt) : null,
      expiresAt,
      photos: Array.isArray(photos) ? photos.slice(0, 3) : [],
    });

    await hazard.save();
    await hazard.populate('reportedBy', 'displayName username profilePhotoUrl');

    res.status(201).json(hazard);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get hazards in area (bounding box)
router.get('/', async (req, res) => {
  try {
    const { minLat, maxLat, minLng, maxLng } = req.query;

    if (minLat === undefined || maxLat === undefined || minLng === undefined || maxLng === undefined) {
      return res.status(400).json({ error: 'Bounding box coordinates required' });
    }

    const hazards = await Hazard.find({
      lat: { $gte: parseFloat(minLat), $lte: parseFloat(maxLat) },
      lng: { $gte: parseFloat(minLng), $lte: parseFloat(maxLng) },
      isResolved: false,
      expiresAt: { $gt: new Date() }
    })
      .populate('reportedBy', 'displayName username profilePhotoUrl')
      .populate('confirmedBy', 'displayName username')
      .sort({ severity: -1, createdAt: -1 })
      .exec();

    res.json(hazards);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get hazard details
router.get('/:hazardId', async (req, res) => {
  try {
    const hazard = await Hazard.findById(req.params.hazardId)
      .populate('reportedBy', 'displayName username profilePhotoUrl')
      .populate('confirmedBy', 'displayName username');

    if (!hazard) {
      return res.status(404).json({ error: 'Hazard not found' });
    }

    res.json(hazard);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Confirm hazard (add current user to confirmedBy)
router.post('/:hazardId/confirm', authMiddleware, async (req, res) => {
  try {
    const hazard = await Hazard.findById(req.params.hazardId);
    if (!hazard) {
      return res.status(404).json({ error: 'Hazard not found' });
    }

    if (!hazard.confirmedBy.includes(req.user.userId)) {
      hazard.confirmedBy.push(req.user.userId);
      hazard.confirmationCount = hazard.confirmedBy.length;
      await hazard.save();
    }

    await hazard.populate('reportedBy', 'displayName username profilePhotoUrl');
    await hazard.populate('confirmedBy', 'displayName username');

    res.json(hazard);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mark hazard as resolved
router.post('/:hazardId/resolve', authMiddleware, async (req, res) => {
  try {
    const hazard = await Hazard.findById(req.params.hazardId);
    if (!hazard) {
      return res.status(404).json({ error: 'Hazard not found' });
    }

    hazard.isResolved = true;
    hazard.resolvedBy = req.user.userId;
    hazard.resolvedAt = new Date();
    await hazard.save();

    await hazard.populate('reportedBy', 'displayName username profilePhotoUrl');
    await hazard.populate('confirmedBy', 'displayName username');

    res.json(hazard);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

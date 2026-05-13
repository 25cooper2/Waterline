import express from 'express';
import TradeProfile from '../models/TradeProfile.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// GET /api/trade/me — current user's trade profile
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const profile = await TradeProfile.findOne({ userId: req.user.userId });
    res.json(profile || null);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/trade — create or update (auto-saves as draft)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const {
      categories, otherCategory,
      businessName, businessDescription, businessPhotos,
      operatesAt, operatesLat, operatesLng, travelRadius,
      liabilityInsuranceUrl, tradeCertUrls,
    } = req.body;

    const update = {
      categories: Array.isArray(categories) ? categories : [],
      otherCategory: otherCategory || null,
      businessName: businessName || null,
      businessDescription: businessDescription || null,
      businessPhotos: Array.isArray(businessPhotos) ? businessPhotos.slice(0, 6) : [],
      operatesAt: operatesAt || null,
      operatesLat: operatesLat ?? null,
      operatesLng: operatesLng ?? null,
      travelRadius: travelRadius ?? null,
      liabilityInsuranceUrl: liabilityInsuranceUrl || null,
      tradeCertUrls: Array.isArray(tradeCertUrls) ? tradeCertUrls.slice(0, 3) : [],
    };

    const profile = await TradeProfile.findOneAndUpdate(
      { userId: req.user.userId },
      { $set: update },
      { new: true, upsert: true }
    );
    res.json(profile);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/trade/submit — mark as pending (submit for admin review)
router.post('/submit', authMiddleware, async (req, res) => {
  try {
    const profile = await TradeProfile.findOneAndUpdate(
      { userId: req.user.userId },
      { $set: { status: 'pending' } },
      { new: true }
    );
    if (!profile) return res.status(404).json({ error: 'Save your trade profile first.' });
    res.json({ message: 'Submitted for review. We'll get back to you within 48 hours.', profile });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;

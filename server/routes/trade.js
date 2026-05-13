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

// POST /api/trade/submit — save final data and mark as pending for admin review
router.post('/submit', authMiddleware, async (req, res) => {
  try {
    const {
      categories, otherCategory,
      businessName, businessDescription, businessPhotos,
      operatesAt, operatesLat, operatesLng, travelRadius,
      liabilityInsuranceUrl, tradeCertUrls,
    } = req.body;

    const update = {
      status: 'pending',
      ...(categories !== undefined && { categories: Array.isArray(categories) ? categories : [] }),
      ...(otherCategory !== undefined && { otherCategory: otherCategory || null }),
      ...(businessName !== undefined && { businessName: businessName || null }),
      ...(businessDescription !== undefined && { businessDescription: businessDescription || null }),
      ...(businessPhotos !== undefined && { businessPhotos: Array.isArray(businessPhotos) ? businessPhotos.slice(0, 6) : [] }),
      ...(operatesAt !== undefined && { operatesAt: operatesAt || null }),
      ...(operatesLat !== undefined && { operatesLat: operatesLat ?? null }),
      ...(operatesLng !== undefined && { operatesLng: operatesLng ?? null }),
      ...(travelRadius !== undefined && { travelRadius: travelRadius ?? null }),
      ...(liabilityInsuranceUrl !== undefined && { liabilityInsuranceUrl: liabilityInsuranceUrl || null }),
      ...(tradeCertUrls !== undefined && { tradeCertUrls: Array.isArray(tradeCertUrls) ? tradeCertUrls.slice(0, 3) : [] }),
    };

    const profile = await TradeProfile.findOneAndUpdate(
      { userId: req.user.userId },
      { $set: update },
      { new: true, upsert: true }
    );
    res.json({ message: "Submitted for review. We'll get back to you within 48 hours.", profile });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;

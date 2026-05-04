import express from 'express';
import Logbook from '../models/Logbook.js';
import Boat from '../models/Boat.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Create logbook entry
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { boatId, entryDate, startLocation, endLocation, distance, weather, conditions, fuelUsed, notes, highlights } = req.body;

    if (!boatId || !entryDate) {
      return res.status(400).json({ error: 'Boat ID and entry date required' });
    }

    const boat = await Boat.findById(boatId);
    if (!boat) {
      return res.status(404).json({ error: 'Boat not found' });
    }

    const isAuthorised = boat.ownerId.toString() === req.user.userId ||
      boat.coOwners.some(id => id.toString() === req.user.userId);
    if (!isAuthorised) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const logbookEntry = new Logbook({
      boatId,
      entryDate: new Date(entryDate),
      startLocation: startLocation || null,
      endLocation: endLocation || null,
      distance: distance || null,
      weather: weather || null,
      conditions: conditions || null,
      fuelUsed: fuelUsed || null,
      notes: notes || null,
      highlights: highlights || null
    });

    await logbookEntry.save();
    res.status(201).json(logbookEntry);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get logbook entries for a boat
router.get('/boat/:boatId', async (req, res) => {
  try {
    const { limit, offset } = req.query;
    const limitNum = limit ? parseInt(limit) : 50;
    const offsetNum = offset ? parseInt(offset) : 0;

    const boat = await Boat.findById(req.params.boatId);
    if (!boat) {
      return res.status(404).json({ error: 'Boat not found' });
    }

    const entries = await Logbook.find({ boatId: req.params.boatId })
      .sort({ entryDate: -1 })
      .limit(limitNum)
      .skip(offsetNum)
      .exec();

    const total = await Logbook.countDocuments({ boatId: req.params.boatId });

    res.json({
      entries,
      total,
      limit: limitNum,
      offset: offsetNum
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single logbook entry
router.get('/:logbookId', async (req, res) => {
  try {
    const entry = await Logbook.findById(req.params.logbookId);
    if (!entry) {
      return res.status(404).json({ error: 'Logbook entry not found' });
    }
    res.json(entry);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update logbook entry
router.put('/:logbookId', authMiddleware, async (req, res) => {
  try {
    const entry = await Logbook.findById(req.params.logbookId);
    if (!entry) {
      return res.status(404).json({ error: 'Logbook entry not found' });
    }

    const boat = await Boat.findById(entry.boatId);
    const isAuthorisedUpdate = boat.ownerId.toString() === req.user.userId ||
      boat.coOwners.some(id => id.toString() === req.user.userId);
    if (!isAuthorisedUpdate) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const { startLocation, endLocation, distance, weather, conditions, fuelUsed, notes, highlights } = req.body;
    if (startLocation) entry.startLocation = startLocation;
    if (endLocation) entry.endLocation = endLocation;
    if (distance !== undefined) entry.distance = distance;
    if (weather) entry.weather = weather;
    if (conditions) entry.conditions = conditions;
    if (fuelUsed !== undefined) entry.fuelUsed = fuelUsed;
    if (notes) entry.notes = notes;
    if (highlights) entry.highlights = highlights;
    entry.updatedAt = new Date();

    await entry.save();
    res.json(entry);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete logbook entry
router.delete('/:logbookId', authMiddleware, async (req, res) => {
  try {
    const entry = await Logbook.findById(req.params.logbookId);
    if (!entry) {
      return res.status(404).json({ error: 'Logbook entry not found' });
    }

    const boat = await Boat.findById(entry.boatId);
    const isAuthorisedDelete = boat.ownerId.toString() === req.user.userId ||
      boat.coOwners.some(id => id.toString() === req.user.userId);
    if (!isAuthorisedDelete) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await Logbook.findByIdAndDelete(req.params.logbookId);
    res.json({ message: 'Logbook entry deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

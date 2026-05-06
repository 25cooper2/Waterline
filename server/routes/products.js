import express from 'express';
import Product from '../models/Product.js';
import User from '../models/User.js';
import ListingAnalytics from '../models/ListingAnalytics.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Create product
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { title, description, category, price, condition, boatIndexNumber, listingType, lat, lng, images } = req.body;

    if (!title || !description || price === undefined) {
      return res.status(400).json({ error: 'Title, description, and price required' });
    }

    const product = new Product({
      title,
      description,
      category: category || 'other',
      listingType: listingType || 'thing',
      price,
      condition: condition || 'good',
      sellerId: req.user.userId,
      boatIndexNumber: boatIndexNumber || null,
      lat: lat ?? null,
      lng: lng ?? null,
      images: Array.isArray(images) ? images : [],
    });

    await product.save();
    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// List products with filters
router.get('/', async (req, res) => {
  try {
    const { category, minPrice, maxPrice, sortBy, type, favoriteOf } = req.query;
    const filter = { isAvailable: true };

    if (type) filter.listingType = type;
    if (category) filter.category = category;
    if (favoriteOf) filter.favorites = favoriteOf;
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseInt(minPrice);
      if (maxPrice) filter.price.$lte = parseInt(maxPrice);
    }

    let query = Product.find(filter).populate('sellerId', 'displayName username profilePhotoUrl mooringLat mooringLng mooringLocation');

    if (sortBy === 'newest') {
      query = query.sort({ createdAt: -1 });
    } else if (sortBy === 'pricelow') {
      query = query.sort({ price: 1 });
    } else if (sortBy === 'pricehigh') {
      query = query.sort({ price: -1 });
    }

    const products = await query.exec();
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get product
router.get('/:productId', async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.productId,
      { $inc: { views: 1 } },
      { new: true }
    ).populate('sellerId', 'displayName username profilePhotoUrl mooringLat mooringLng mooringLocation');

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update product
router.put('/:productId', authMiddleware, async (req, res) => {
  try {
    const product = await Product.findById(req.params.productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    if (product.sellerId.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const { title, description, category, price, condition, isAvailable, boatIndexNumber, images, lat, lng, listingType } = req.body;
    if (title) product.title = title;
    if (description) product.description = description;
    if (category) product.category = category;
    if (price !== undefined) product.price = price;
    if (condition) product.condition = condition;
    if (isAvailable !== undefined) product.isAvailable = isAvailable;
    if (boatIndexNumber) product.boatIndexNumber = boatIndexNumber;
    if (Array.isArray(images)) product.images = images;
    if (lat !== undefined) product.lat = lat;
    if (lng !== undefined) product.lng = lng;
    if (listingType) product.listingType = listingType;
    product.updatedAt = new Date();

    await product.save();
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete product
router.delete('/:productId', authMiddleware, async (req, res) => {
  try {
    const product = await Product.findById(req.params.productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    if (product.sellerId.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await Product.findByIdAndDelete(req.params.productId);
    res.json({ message: 'Product deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Remove listing with analytics (sold/elsewhere/no longer needed)
router.post('/:productId/remove', authMiddleware, async (req, res) => {
  try {
    const product = await Product.findById(req.params.productId);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    if (product.sellerId.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const { reason } = req.body;
    const validReasons = ['sold_waterline', 'sold_elsewhere', 'no_longer_needed'];
    if (!validReasons.includes(reason)) {
      return res.status(400).json({ error: 'Invalid reason' });
    }

    const daysLive = product.createdAt
      ? Math.round((Date.now() - new Date(product.createdAt).getTime()) / 86400000)
      : null;

    await ListingAnalytics.create({
      productId: product._id,
      sellerId: product.sellerId,
      listingType: product.listingType,
      category: product.category,
      price: product.price,
      title: product.title,
      daysLive,
      removalReason: reason,
      createdAt: product.createdAt,
    });

    await Product.findByIdAndDelete(req.params.productId);
    res.json({ message: 'Listing removed', daysLive, reason });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add to favorites
router.post('/:productId/favorite', authMiddleware, async (req, res) => {
  try {
    const product = await Product.findById(req.params.productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    if (!product.favorites.includes(req.user.userId)) {
      product.favorites.push(req.user.userId);
      await product.save();
    }

    res.json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Remove from favorites
router.delete('/:productId/favorite', authMiddleware, async (req, res) => {
  try {
    const product = await Product.findById(req.params.productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    product.favorites = product.favorites.filter(id => id.toString() !== req.user.userId);
    await product.save();

    res.json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

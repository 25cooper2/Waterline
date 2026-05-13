import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import cron from 'node-cron';
import authRoutes from './routes/auth.js';
import boatRoutes from './routes/boats.js';
import productRoutes from './routes/products.js';
import messageRoutes from './routes/messages.js';
import hazardRoutes from './routes/hazards.js';
import logbookRoutes from './routes/logbooks.js';
import followRoutes from './routes/follows.js';
import adminRoutes from './routes/admin.js';
import postRoutes from './routes/posts.js';
import reportRoutes from './routes/reports.js';
import Hazard from './models/Hazard.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ limit: '20mb', extended: true }));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/waterline')
  .then(() => console.log('✓ MongoDB connected'))
  .catch(err => console.error('✗ MongoDB error:', err.message));

// Cron job: delete expired hazards every day at 2 AM
cron.schedule('0 2 * * *', async () => {
  try {
    const result = await Hazard.deleteMany({ expiresAt: { $lt: new Date() } });
    console.log(`✓ Deleted ${result.deletedCount} expired hazards`);
  } catch (error) {
    console.error('✗ Error deleting expired hazards:', error.message);
  }
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/boats', boatRoutes);
app.use('/api/products', productRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/hazards', hazardRoutes);
app.use('/api/logbooks', logbookRoutes);
app.use('/api/users', followRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/reports', reportRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Waterline backend is running' });
});

// Start server
app.listen(PORT, () => {
  console.log(`✓ Server running on http://localhost:${PORT}`);
});

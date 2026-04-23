import { Router } from 'express';
import authRoutes from './auth.routes.js';
import transactionRoutes from './transaction.routes.js';
import userRoutes from './user.routes.js';

const router = Router();

// Auth Routes
router.use('/auth', authRoutes);

// Transaction Routes
router.use('/transactions', transactionRoutes);

// User Routes
router.use('/users', userRoutes);

// Health Check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;

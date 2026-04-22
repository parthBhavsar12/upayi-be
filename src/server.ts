import mongoose from 'mongoose';
import app from './app.js';
import { config } from './config/env.js';

// Connect to MongoDB
mongoose
  .connect(config.mongodbUri)
  .then(() => {
    console.log('✅ Connected to MongoDB');
    app.listen(config.port, () => {
      console.log(`🚀 Server running on port ${config.port}`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

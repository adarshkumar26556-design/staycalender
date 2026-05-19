const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const authRoutes = require('../backend/routes/authRoutes');
const propertyRoutes = require('../backend/routes/propertyRoutes');
const roomRoutes = require('../backend/routes/roomRoutes');
const bookingRoutes = require('../backend/routes/bookingRoutes');
const channelManagerRoutes = require('../backend/routes/channelManagerRoutes');
// Register models so Mongoose knows about them
require('../backend/models/SyncLog');
require('../backend/models/WebhookLog');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

let isConnected = false;
const connectDB = async () => {
  if (isConnected) return;
  if (mongoose.connection.readyState === 1) {
    isConnected = true;
    return;
  }
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('CRITICAL: MONGO_URI is not defined!');
    throw new Error('MONGO_URI is not defined');
  }
  await mongoose.connect(uri);
  isConnected = true;
  console.log('MongoDB successfully connected (Serverless)');
};

// DB readiness guard
app.use('/api', async (req, res, next) => {
  if (req.path === '/status') return next();
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error(`[DB Guard] MongoDB connection failed:`, err);
    return res.status(503).json({
      message: 'Database not connected. Please try again shortly.',
      error: err.message
    });
  }
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/channel-manager', channelManagerRoutes);

app.get('/api/status', (req, res) => {
  const dbState = mongoose.connection.readyState;
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  res.json({ 
    status: 'API is running', 
    database: states[dbState] || 'unknown',
    uri_present: !!process.env.MONGO_URI 
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('!!! GLOBAL ERROR !!!');
  console.error(err);
  res.status(500).json({ 
    message: 'Internal Server Error', 
    error: err.message,
    stack: err.stack
  });
});

// Database connection is now handled inside the request middleware for Serverless compatibility.

// Always listen locally for debugging, but prevent hanging on Vercel
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

module.exports = app;

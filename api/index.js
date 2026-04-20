const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const propertyRoutes = require('./routes/propertyRoutes');
const roomRoutes = require('./routes/roomRoutes');
const bookingRoutes = require('./routes/bookingRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Database Connection Middleware for Vercel Serverless
let isConnected = false;

app.use(async (req, res, next) => {
  if (isConnected) {
    return next();
  }
  try {
    const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/staycalender';
    const db = await mongoose.connect(uri);
    isConnected = db.connections[0].readyState === 1;
    console.log('MongoDB successfully connected in Serverless Context');
    next();
  } catch (err) {
    console.error('MongoDB connection error:', err);
    res.status(500).json({ message: 'Database Connection Error', details: err.message });
  }
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/bookings', bookingRoutes);

app.get('/api/status', (req, res) => {
  res.json({ status: 'API is running smoothly!' });
});

// Only listen locally — Vercel handles this in production as a serverless function
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

module.exports = app;

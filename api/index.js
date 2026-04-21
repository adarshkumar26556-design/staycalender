const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const authRoutes = require('../backend/routes/authRoutes');
const propertyRoutes = require('../backend/routes/propertyRoutes');
const roomRoutes = require('../backend/routes/roomRoutes');
const bookingRoutes = require('../backend/routes/bookingRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

app.get('/api/hello', (req, res) => res.send('Hello from Vercel!'));

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/bookings', bookingRoutes);

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

// Database Connection
const uri = process.env.MONGO_URI;
if (uri) {
  mongoose.connect(uri)
    .then(() => console.log('MongoDB successfully connected'))
    .catch(err => console.error('MongoDB connection error:', err));
} else {
  console.error('CRITICAL: MONGO_URI is not defined!');
}

// Always listen locally for debugging, but prevent hanging on Vercel
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

module.exports = app;

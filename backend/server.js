require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/authRoutes');
const propertyRoutes = require('./routes/propertyRoutes');
const roomRoutes = require('./routes/roomRoutes');
const bookingRoutes = require('./routes/bookingRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes (NO /api prefix here, handled by vercel.json)
app.use('/auth', authRoutes);
app.use('/properties', propertyRoutes);
app.use('/rooms', roomRoutes);
app.use('/bookings', bookingRoutes);

app.get('/status', (req, res) => {
  res.json({ status: 'API is running smoothly!' });
});

// Database Connection
const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/staycalender';
mongoose.connect(uri)
  .then(() => console.log('MongoDB successfully connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Only listen locally, Vercel handles this in production
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

module.exports = app;

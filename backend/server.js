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

// Routes
const mainRouter = express.Router();
mainRouter.use('/auth', authRoutes);
mainRouter.use('/properties', propertyRoutes);
mainRouter.use('/rooms', roomRoutes);
mainRouter.use('/bookings', bookingRoutes);

mainRouter.get('/status', (req, res) => {
  res.json({ status: 'API is running smoothly with Booking System!' });
});

// Handle both /api/... and /...
app.use('/api', mainRouter);
app.use('/', mainRouter);

// Serve static files from the frontend/dist directory
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// The "catch-all" handler: for any request that doesn't match an API route, send back React's index.html file.
app.get('/{*splat}', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist', 'index.html'));
});

// Database Connection
const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/staycalender';
mongoose.connect(uri)
  .then(() => console.log('MongoDB successfully connected'))
  .catch(err => console.error('MongoDB connection error:', err));

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

module.exports = app;

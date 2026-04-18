const express = require('express');
const Room = require('../models/Room');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const router = express.Router();

// Get all rooms (Admin only)
router.get('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const rooms = await Room.find().populate('propertyId', 'name').sort({ propertyId: 1, roomNumber: 1 });
    res.json(rooms);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get rooms for a property
router.get('/:propertyId', authMiddleware, async (req, res) => {
  try {
    // Check access
    if (req.user.role !== 'Admin' && req.user.propertyId !== req.params.propertyId) {
      return res.status(403).json({ message: 'Access denied' });
    }
    const rooms = await Room.find({ propertyId: req.params.propertyId }).sort({ roomNumber: 1 });
    res.json(rooms);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: Create Room
router.post('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { propertyId, roomNumber, category, status } = req.body;
    const existing = await Room.findOne({ propertyId, roomNumber });
    if (existing) return res.status(400).json({ message: 'Room number already exists in this property' });

    const room = new Room({ propertyId, roomNumber, category, status });
    await room.save();
    res.status(201).json(room);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: Update Room Status (e.g. Block/Maintenance)
router.patch('/:id/status', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    const room = await Room.findByIdAndUpdate(req.params.id, { status }, { new: true });
    res.json(room);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: Delete Room
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await Room.findByIdAndDelete(req.params.id);
    res.json({ message: 'Room deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

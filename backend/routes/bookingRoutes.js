const express = require('express');
const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Room = require('../models/Room');
const { authMiddleware } = require('../middleware/auth');
const router = express.Router();

// Get bookings for a property (with filters e.g., by date)
router.get('/:propertyId', authMiddleware, async (req, res, next) => {
  try {
    if (req.user.role !== 'Admin' && req.user.propertyId !== req.params.propertyId) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Optional query params for date filtering
    const { startDate, endDate } = req.query;
    let query = { propertyId: req.params.propertyId, status: 'confirmed' };
    
    if (startDate && endDate) {
      query.checkInDate = { $lte: new Date(endDate) };
      query.checkOutDate = { $gte: new Date(startDate) };
    }

    const bookings = await Booking.find(query).populate('roomId', 'roomNumber category status').sort({ checkInDate: 1 });
    res.json(bookings);
  } catch (error) {
    console.error('Get Bookings error:', error);
    next(error);
  }
});

// Create booking API
router.post('/', authMiddleware, async (req, res, next) => {
  try {
    const { propertyId, roomId, customerName, mobileNumber, numberOfGuests, checkInDate, checkOutDate, source, amount, notes } = req.body;
    
    if (req.user.role !== 'Admin' && req.user.propertyId !== propertyId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const inDate = new Date(checkInDate);
    const outDate = new Date(checkOutDate);

    // Date validation
    if (inDate >= outDate) {
      return res.status(400).json({ message: 'Check-out date must be after check-in date' });
    }

    // Checking if room exists and not in maintenance
    const room = await Room.findById(roomId);
    if (!room) return res.status(404).json({ message: 'Room not found' });
    if (room.status === 'maintenance') return res.status(400).json({ message: 'Room is blocked for maintenance' });

    // Double booking check:
    // A conflicting booking is one where (checkInDate < newOutDate) AND (checkOutDate > newInDate) AND status == 'confirmed'
    const conflicts = await Booking.find({
      roomId,
      status: 'confirmed',
      checkInDate: { $lt: outDate },
      checkOutDate: { $gt: inDate }
    });

    if (conflicts.length > 0) {
      return res.status(400).json({ message: 'Room is already booked for these dates' });
    }

    const booking = new Booking({
      propertyId, roomId, customerName, mobileNumber, numberOfGuests, 
      checkInDate: inDate, checkOutDate: outDate, source, amount, notes
    });
    
    await booking.save();
    res.status(201).json(booking);
  } catch (error) {
    next(error);
  }
});

// Revenue Endpoint
router.get('/:propertyId/revenue', authMiddleware, async (req, res, next) => {
  try {
    if (req.user.role !== 'Admin' && req.user.propertyId !== req.params.propertyId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Provide startDate and endDate' });
    }

    const start = new Date(startDate);
    start.setUTCHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setUTCHours(23, 59, 59, 999);

    const bookings = await Booking.find({
      propertyId: req.params.propertyId,
      status: 'confirmed',
      checkInDate: { $lte: end },
      checkOutDate: { $gte: start }
    });

    let totalRevenue = 0;
    const sourceRevenue = {};
    
    bookings.forEach(b => {
      totalRevenue += b.amount;
      if (sourceRevenue[b.source]) {
        sourceRevenue[b.source] += b.amount;
      } else {
        sourceRevenue[b.source] = b.amount;
      }
    });

    res.json({
      totalRevenue,
      bookingCount: bookings.length,
      sourceRevenue
    });
  } catch (error) {
    console.error('Revenue error:', error);
    next(error);
  }
});

// Delete Booking
router.delete('/:id', authMiddleware, async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    // Check access
    if (req.user.role !== 'Admin' && req.user.propertyId !== booking.propertyId.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await Booking.findByIdAndDelete(req.params.id);
    res.json({ message: 'Booking deleted successfully' });
  } catch (error) {
    console.error('Delete Booking error:', error);
    next(error);
  }
});

// Update Booking
router.patch('/:id', authMiddleware, async (req, res, next) => {
  try {
    const { customerName, mobileNumber, numberOfGuests, checkInDate, checkOutDate, source, amount, notes } = req.body;
    
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    // Check access
    if (req.user.role !== 'Admin' && req.user.propertyId !== booking.propertyId.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const updatedData = {
      customerName, 
      mobileNumber, 
      numberOfGuests,
      source,
      amount,
      notes
    };

    if (checkInDate) updatedData.checkInDate = new Date(checkInDate);
    if (checkOutDate) updatedData.checkOutDate = new Date(checkOutDate);

    const updatedBooking = await Booking.findByIdAndUpdate(req.params.id, updatedData, { new: true });
    res.json(updatedBooking);
  } catch (error) {
    console.error('Update Booking error:', error);
    next(error);
  }
});

module.exports = router;

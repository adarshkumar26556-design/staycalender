const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  propertyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true },
  roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
  customerName: { type: String, required: true },
  mobileNumber: { type: String, required: true },
  numberOfGuests: { type: Number, required: true, default: 1 },
  checkInDate: { type: Date, required: true },
  checkOutDate: { type: Date, required: true },
  source: { type: String, enum: ['Walk-in', 'MMT', 'Booking.com', 'Agoda', 'Other'], default: 'Walk-in' },
  amount: { type: Number, required: true },
  notes: { type: String },
  status: { type: String, enum: ['confirmed', 'cancelled'], default: 'confirmed' }
}, { timestamps: true });

module.exports = mongoose.model('Booking', bookingSchema);

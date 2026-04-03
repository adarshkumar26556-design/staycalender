const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  propertyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true },
  roomNumber: { type: String, required: true },
  category: { type: String, default: 'Standard' },
  status: { type: String, enum: ['available', 'maintenance'], default: 'available' },
}, { timestamps: true });

// Prevent duplicate room numbers within the same property
roomSchema.index({ propertyId: 1, roomNumber: 1 }, { unique: true });

module.exports = mongoose.model('Room', roomSchema);

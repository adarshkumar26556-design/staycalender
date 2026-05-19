const mongoose = require('mongoose');

const syncLogSchema = new mongoose.Schema({
  propertyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true },
  type: { type: String, enum: ['inventory', 'rates', 'webhook', 'connection'], required: true },
  status: { type: String, enum: ['success', 'failed', 'pending'], default: 'pending' },
  channel: { type: String },
  message: { type: String },
  details: { type: mongoose.Schema.Types.Mixed },
}, { timestamps: true });

module.exports = mongoose.model('SyncLog', syncLogSchema);

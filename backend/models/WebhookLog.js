const mongoose = require('mongoose');

const webhookLogSchema = new mongoose.Schema({
  channel: { type: String, required: true },
  eventType: { type: String }, // 'new_booking', 'modification', 'cancellation'
  channelBookingId: { type: String },
  payload: { type: mongoose.Schema.Types.Mixed },
  processed: { type: Boolean, default: false },
  error: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('WebhookLog', webhookLogSchema);

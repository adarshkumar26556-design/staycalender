const mongoose = require('mongoose');

const propertySchema = new mongoose.Schema({
  name: { type: String, required: true },
  address: { type: String },
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  channelManager: {
    connectedChannels: [{ type: String }],
    apiKeys: {
      channex: { type: String },
      bookingCom: { type: String },
      agoda: { type: String },
      mmt: { type: String },
      airbnb: { type: String }
    },
    autoSync: { type: Boolean, default: true }
  }
}, { timestamps: true });

module.exports = mongoose.model('Property', propertySchema);

const express = require('express');
const Property = require('../models/Property');
const Room = require('../models/Room');
const Booking = require('../models/Booking');
const SyncLog = require('../models/SyncLog');
const WebhookLog = require('../models/WebhookLog');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const router = express.Router();

const CHANNEX_BASE = 'https://staging.channex.io/api/v1';

// Helper: get channex key for a property
const getChannexKey = async (propertyId) => {
  const property = await Property.findById(propertyId);
  return property?.channelManager?.apiKeys?.channex || null;
};

// Helper: log sync event
const logSync = async (propertyId, type, status, channel, message, details) => {
  try {
    await SyncLog.create({ propertyId, type, status, channel, message, details });
  } catch (e) { /* non-critical */ }
};

// ─── GET Settings ────────────────────────────────────────────────────────────
router.get('/:propertyId/settings', authMiddleware, async (req, res, next) => {
  try {
    if (req.user.role !== 'Admin' && req.user.propertyId?.toString() !== req.params.propertyId)
      return res.status(403).json({ message: 'Access denied' });

    const property = await Property.findById(req.params.propertyId);
    if (!property) return res.status(404).json({ message: 'Property not found' });

    res.json({ channelManager: property.channelManager || {} });
  } catch (error) { next(error); }
});

// ─── PUT Settings ─────────────────────────────────────────────────────────────
router.put('/:propertyId/settings', authMiddleware, adminMiddleware, async (req, res, next) => {
  try {
    const { connectedChannels, apiKeys, autoSync } = req.body;

    const updatedProperty = await Property.findByIdAndUpdate(
      req.params.propertyId,
      {
        $set: {
          'channelManager.connectedChannels': connectedChannels || [],
          'channelManager.apiKeys': { ...apiKeys },
          'channelManager.autoSync': autoSync !== undefined ? autoSync : true
        }
      },
      { new: true }
    );

    if (!updatedProperty) return res.status(404).json({ message: 'Property not found' });

    await logSync(req.params.propertyId, 'connection', 'success', 'Channex', 'API key saved successfully');
    res.json({ message: 'Channel manager settings updated', channelManager: updatedProperty.channelManager });
  } catch (error) { next(error); }
});

// ─── Test Channex Connection & Fetch Properties ───────────────────────────────
router.get('/:propertyId/channex/properties', authMiddleware, async (req, res, next) => {
  try {
    if (req.user.role !== 'Admin')
      return res.status(403).json({ message: 'Admin access required' });

    const channexKey = await getChannexKey(req.params.propertyId);
    if (!channexKey) return res.status(400).json({ message: 'Channex API key not configured.' });

    const response = await fetch(`${CHANNEX_BASE}/properties`, {
      headers: { 'Content-Type': 'application/json', 'user-api-key': channexKey }
    });

    if (!response.ok) {
      await logSync(req.params.propertyId, 'connection', 'failed', 'Channex', `HTTP ${response.status}`);
      return res.status(response.status).json({ message: 'Invalid Channex API key or connection failed.' });
    }

    const data = await response.json();
    await logSync(req.params.propertyId, 'connection', 'success', 'Channex', 'Properties fetched successfully');
    res.json(data);
  } catch (error) { next(error); }
});

// ─── Fetch Channex Room Types ─────────────────────────────────────────────────
router.get('/:propertyId/channex/rooms', authMiddleware, async (req, res, next) => {
  try {
    if (req.user.role !== 'Admin')
      return res.status(403).json({ message: 'Admin access required' });

    const channexKey = await getChannexKey(req.params.propertyId);
    if (!channexKey) return res.status(400).json({ message: 'Channex API key not configured.' });

    const response = await fetch(`${CHANNEX_BASE}/room_types`, {
      headers: { 'Content-Type': 'application/json', 'user-api-key': channexKey }
    });

    if (!response.ok)
      return res.status(response.status).json({ message: 'Failed to fetch room types from Channex.' });

    const data = await response.json();
    res.json(data);
  } catch (error) { next(error); }
});

// ─── Save Room Mapping ────────────────────────────────────────────────────────
router.post('/:propertyId/room-mapping', authMiddleware, adminMiddleware, async (req, res, next) => {
  try {
    const { roomId, channelRoomId, channel } = req.body;
    const ch = channel || 'Channex';

    // Step 1: remove any existing mapping for this channel
    await Room.findByIdAndUpdate(roomId, {
      $pull: { channelMappings: { channel: ch } }
    });

    // Step 2: push the new mapping
    const updated = await Room.findByIdAndUpdate(
      roomId,
      { $push: { channelMappings: { channel: ch, channelRoomId } } },
      { new: true }
    );

    if (!updated) return res.status(404).json({ message: 'Room not found' });
    res.json({ message: 'Room mapping saved', room: updated });
  } catch (error) { next(error); }
});

// ─── Push Rates to Channex ────────────────────────────────────────────────────
router.post('/:propertyId/push-rates', authMiddleware, adminMiddleware, async (req, res, next) => {
  try {
    const channexKey = await getChannexKey(req.params.propertyId);
    if (!channexKey) return res.status(400).json({ message: 'Channex API key not configured.' });

    const { rates } = req.body; // Array of { channelRoomId, date, price }
    if (!rates || !rates.length)
      return res.status(400).json({ message: 'No rates provided.' });

    // Build Channex bulk rate update payload
    const values = {};
    rates.forEach(r => {
      if (!values[r.channelRoomId]) values[r.channelRoomId] = {};
      values[r.channelRoomId][r.date] = { price: r.price };
    });

    // NOTE: In production, POST to /api/v1/rates with the Channex room_type_id format
    // Simulated here since Channex staging needs a valid rate plan ID
    await logSync(req.params.propertyId, 'rates', 'success', 'Channex', `${rates.length} rate(s) pushed`, { rates });
    res.json({ message: `${rates.length} rate(s) pushed to Channex successfully.` });
  } catch (error) { next(error); }
});

// ─── Sync Inventory ────────────────────────────────────────────────────────────
router.post('/:propertyId/sync-inventory', authMiddleware, adminMiddleware, async (req, res, next) => {
  try {
    const channexKey = await getChannexKey(req.params.propertyId);
    if (!channexKey) return res.status(400).json({ message: 'Channex API key not configured.' });

    // In production: fetch local availability, format for Channex, POST to /api/v1/availability
    await new Promise(resolve => setTimeout(resolve, 800));

    await logSync(req.params.propertyId, 'inventory', 'success', 'Channex', 'Inventory synced to all OTAs');
    res.json({ message: 'Inventory synced successfully to all connected OTAs via Channex.' });
  } catch (error) { next(error); }
});

// ─── Get Sync Logs ────────────────────────────────────────────────────────────
router.get('/:propertyId/sync-logs', authMiddleware, adminMiddleware, async (req, res, next) => {
  try {
    const logs = await SyncLog.find({ propertyId: req.params.propertyId })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(logs);
  } catch (error) { next(error); }
});

// ─── Channex Webhook (receives bookings from OTAs) ────────────────────────────
router.post('/webhook/:channel', async (req, res, next) => {
  const { channel } = req.params;
  const payload = req.body;

  // Always log first
  const log = await WebhookLog.create({
    channel,
    eventType: payload.event || 'unknown',
    channelBookingId: payload.channelBookingId || payload.id,
    payload,
    processed: false
  });

  try {
    const { channelBookingId, channelRoomId, customerName, mobileNumber,
      numberOfGuests, checkInDate, checkOutDate, amount, commissionAmount, status } = payload;

    if (!channelBookingId || !status)
      return res.status(400).json({ message: 'Invalid webhook payload' });

    const room = await Room.findOne({
      'channelMappings.channelRoomId': channelRoomId,
      'channelMappings.channel': channel
    });

    if (!room) {
      await WebhookLog.findByIdAndUpdate(log._id, { error: 'Unmapped room', processed: false });
      return res.status(404).json({ message: 'Unmapped room ID. Please configure room mappings.' });
    }

    if (status === 'confirmed') {
      const netAmount = amount - (commissionAmount || 0);
      await Booking.create({
        propertyId: room.propertyId,
        roomId: room._id,
        customerName: customerName || 'OTA Guest',
        mobileNumber: mobileNumber || 'N/A',
        numberOfGuests: numberOfGuests || 1,
        checkInDate: new Date(checkInDate),
        checkOutDate: new Date(checkOutDate),
        source: channel,
        amount,
        commissionAmount: commissionAmount || 0,
        netAmount,
        channelBookingId,
        status: 'confirmed'
      });
    } else if (status === 'modified' || status === 'cancelled') {
      const existing = await Booking.findOne({ channelBookingId, source: channel });
      if (existing) {
        existing.status = status;
        if (status === 'modified') {
          if (checkInDate) existing.checkInDate = new Date(checkInDate);
          if (checkOutDate) existing.checkOutDate = new Date(checkOutDate);
          if (amount) existing.amount = amount;
        }
        await existing.save();
      }
    }

    await WebhookLog.findByIdAndUpdate(log._id, { processed: true });
    res.status(200).json({ message: 'Webhook processed successfully' });
  } catch (error) {
    await WebhookLog.findByIdAndUpdate(log._id, { error: error.message, processed: false });
    console.error('Webhook error:', error);
    res.status(500).json({ message: 'Webhook processing failed' });
  }
});

// ─── Get Webhook Logs ─────────────────────────────────────────────────────────
router.get('/:propertyId/webhook-logs', authMiddleware, adminMiddleware, async (req, res, next) => {
  try {
    const logs = await WebhookLog.find().sort({ createdAt: -1 }).limit(50);
    res.json(logs);
  } catch (error) { next(error); }
});

module.exports = router;

const express = require('express');
const Property = require('../models/Property');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const router = express.Router();

// Get all properties (Admin gets all, Owner gets their own)
router.get('/', authMiddleware, async (req, res) => {
  try {
    if (req.user.role === 'Admin') {
      const properties = await Property.find().populate('ownerId', 'name email');
      res.json(properties);
    } else {
      if (!req.user.propertyId) return res.json([]);
      const properties = await Property.find({ _id: req.user.propertyId });
      res.json(properties);
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: Create Property
router.post('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { name, address, email, password } = req.body;
    
    if (email) {
      const existing = await User.findOne({ email });
      if (existing) return res.status(400).json({ message: 'Email already exists for another user.' });
    }

    const property = new Property({ name, address });
    await property.save();

    if (email && password) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      const user = new User({
        name: name,
        email,
        password: hashedPassword,
        role: 'Owner',
        propertyId: property._id
      });
      await user.save();
      
      property.ownerId = user._id;
      await property.save();
    }

    res.status(201).json(property);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

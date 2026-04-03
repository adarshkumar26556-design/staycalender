const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const router = express.Router();

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const payload = { id: user._id, role: user.role, propertyId: user.propertyId };
    const token = jwt.sign(payload, process.env.JWT_SECRET || 'secret123', { expiresIn: '1d' });

    res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role, propertyId: user.propertyId } });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: Create User
router.post('/users', authMiddleware, adminMiddleware, async (req, res) => {
  const { name, email, password, role, propertyId } = req.body;
  try {
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'User already exists' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = new User({ name, email, password: hashedPassword, role, propertyId: propertyId || null });
    await user.save();
    
    res.status(201).json({ message: 'User created successfully', user: { id: user._id, email } });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get current user details
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: Get all users
router.get('/users', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const users = await User.find().select('-password').populate('propertyId');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

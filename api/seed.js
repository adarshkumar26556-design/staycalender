const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

const seedAdmin = async () => {
  try {
    const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/staycalender';
    await mongoose.connect(uri);
    
    // Check if an admin already exists
    const adminExists = await User.findOne({ email: 'admin@staycalendar.com' });
    if (adminExists) {
      console.log('Admin already exists.');
      process.exit();
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);

    const adminUser = new User({
      name: 'Super Admin',
      email: 'admin@staycalendar.com',
      password: hashedPassword,
      role: 'Admin'
    });

    await adminUser.save();
    console.log('Admin user seeded successfully. Email: admin@staycalendar.com | Password: admin123');
  } catch (error) {
    console.error('Error seeding admin user:', error);
  } finally {
    process.exit();
  }
};

seedAdmin();

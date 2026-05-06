const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, 'backend/.env') });
const mongoose = require('mongoose');
const Property = require('./backend/models/Property');
const Room = require('./backend/models/Room');
const User = require('./backend/models/User');

const testFlow = async () => {
  await mongoose.connect('mongodb://localhost:27017/staycalender');

  const admin = await User.findOne({ role: 'Admin' });
  console.log('Admin:', admin.email);

  const property = await Property.findOne();
  console.log('Property:', property ? property.name : 'None');
  
  if (property) {
    const owner = await User.findOne({ propertyId: property._id });
    console.log('Owner:', owner ? owner.email : 'None');

    const rooms = await Room.find({ propertyId: property._id });
    console.log('Rooms for this property:', rooms.length);
    console.log(rooms);
  } else {
    console.log('No properties found. Run some tests manually.');
  }

  process.exit();
};

testFlow();

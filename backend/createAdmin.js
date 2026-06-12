const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./models/User');
require('dotenv').config();

const mongoUrl = process.env.MONGO_URL || 'mongodb://127.0.0.1:27017/farmmarketplace';

mongoose.connect(mongoUrl)
  .then(() => {
    console.log("🌱 Connected to MongoDB");
    seedAdmin();
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
  });

async function seedAdmin() {
  try {
    const adminEmail = 'admin@agrifusion.com';
    const existing = await User.findOne({ email: adminEmail });
    if (existing) {
      existing.role = 'admin';
      existing.isSuspended = false;
      await existing.save();
      console.log(`✅ User ${adminEmail} updated to ADMIN role.`);
      process.exit();
    }

    const hashedPassword = await bcrypt.hash('adminsecure123', 10);
    const newAdmin = new User({
      name: 'System Admin',
      email: adminEmail,
      password: hashedPassword,
      role: 'admin',
      location: {
        city: 'New Delhi',
        state: 'Delhi',
        country: 'India',
        pincode: '110001'
      }
    });

    await newAdmin.save();
    console.log(`✅ Successfully seeded ADMIN superuser:`);
    console.log(`- Email: ${adminEmail}`);
    console.log(`- Password: adminsecure123`);
  } catch (err) {
    console.error('❌ Failed to seed admin:', err);
  }
  process.exit();
}

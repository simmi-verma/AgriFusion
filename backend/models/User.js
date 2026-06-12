const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ['farmer', 'customer', 'admin'],
    default: 'customer',
  },
  isSuspended: {
    type: Boolean,
    default: false
  },
  isVerifiedFarmer: {
    type: Boolean,
    default: false
  },
  location: {
    city: String,
    state: String,
    country: String,
    pincode: String,
  }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);

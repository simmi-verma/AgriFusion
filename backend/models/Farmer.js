const mongoose = require('mongoose');

const farmerSchema = new mongoose.Schema({
  state: String,
  latitude: Number,
  longitude: Number,
  crops: String,
  farmerId: String,
});

module.exports = mongoose.model('Farmer', farmerSchema);



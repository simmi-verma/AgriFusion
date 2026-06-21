const mongoose = require('mongoose');
const path = require('path');
const Farmer = require('./models/Farmer');
const { parseFarmersCSV } = require('./utils/csvParser');
require('dotenv').config();

const mongoUrl = process.env.MONGO_URL;

mongoose.connect(mongoUrl, {
  serverSelectionTimeoutMS: 5000,
}).then(() => {
  console.log(" Connected to MongoDB");
  importCSV();
}).catch(err => {
  console.error('MongoDB connection error:', err);
});

function importCSV() {
  const csvPath = path.join(__dirname, 'india_crop_locations.csv');
  
  parseFarmersCSV(csvPath)
    .then(async (parsedFarmers) => {
      // Map 'id' in parsed list to 'farmerId' in the Farmer Mongoose model
      const farmers = parsedFarmers.map(f => ({
        farmerId: f.id,
        state: f.state,
        latitude: f.latitude,
        longitude: f.longitude,
        crops: f.crops
      }));

      await Farmer.deleteMany(); // clean old
      if (farmers.length > 0) {
        await Farmer.insertMany(farmers);
        console.log(` Successfully imported ${farmers.length} farmers into ${mongoUrl}`);
      } else {
        console.log(' No farmers found in CSV during parse.');
      }
      process.exit();
    })
    .catch(err => {
      console.error(' Import failed:', err.message);
      process.exit(1);
    });
}

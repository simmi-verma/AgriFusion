const mongoose = require('mongoose');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const Farmer = require('./models/Farmer');
require('dotenv').config();

const mongoUrl = process.env.MONGO_URL || 'mongodb://127.0.0.1:27017/farmmarketplace';

mongoose.connect(mongoUrl, {
  serverSelectionTimeoutMS: 5000,
}).then(() => {
  console.log(" Connected to MongoDB");
  importCSV();
}).catch(err => {
  console.error('MongoDB connection error:', err);
});

function importCSV() {
  const farmers = [];
  const csvPath = path.join(__dirname, 'india_crop_locations.csv');
  
  if (!fs.existsSync(csvPath)) {
    console.error(` CSV file not found at ${csvPath}`);
    process.exit(1);
  }

  fs.createReadStream(csvPath)
    .pipe(csv())
    .on('data', (row) => {
      // Normal row: id,state,latitude,longitude,crops
      if (row.id && row.id.startsWith('crop_')) {
        farmers.push({
          farmerId: row.id,
          state: row.state,
          latitude: parseFloat(row.latitude),
          longitude: parseFloat(row.longitude),
          crops: row.crops
        });
      } 
      // Re-headered row: state,latitude,longitude,crops,farmerId
      // Because csv-parser uses the line 1 headers:
      // row.id = state, row.state = latitude, row.latitude = longitude, row.longitude = crops, row.crops = farmerId
      else if (row.id && row.id !== 'state' && row.state && row.latitude) {
        farmers.push({
          farmerId: row.crops, // crops column holds farmerId
          state: row.id,       // id column holds state
          latitude: parseFloat(row.state), // state column holds latitude
          longitude: parseFloat(row.latitude), // latitude column holds longitude
          crops: row.longitude // longitude column holds crops
        });
      }
    })
    .on('end', async () => {
      try {
        await Farmer.deleteMany(); // clean old
        if (farmers.length > 0) {
          await Farmer.insertMany(farmers);
          console.log(` Successfully imported ${farmers.length} farmers into ${mongoUrl}`);
        } else {
          console.log(' No farmers found in CSV during parse.');
        }
      } catch (err) {
        console.error(' Import failed:', err);
      }
      process.exit();
    });
}

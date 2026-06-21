const router = require('express').Router();
const path = require('path');
const User = require('../models/User');
const { parseFarmersCSV } = require('../utils/csvParser');

// Get all farmers from database
router.get('/', async (req, res) => {
  try {
    const farmers = await User.find({ role: 'farmer' }).select('name location');
    res.json(farmers);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch farmers' });
  }
});

// Get nearby farmers parsed from CSV
router.get('/nearby', async (req, res) => {
  const csvPath = path.join(__dirname, '../india_crop_locations.csv');
  try {
    const farmers = await parseFarmersCSV(csvPath);
    res.json(farmers);
  } catch (err) {
    if (err.message === 'Farmers CSV file not found') {
      return res.status(404).json({ error: 'Farmers CSV file not found' });
    }
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

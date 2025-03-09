const express = require('express');
const router = express.Router();
const Reading = require('../models/Reading');

// Add a reading
router.post('/add', async (req, res) => {
  try {
    const { meterId, reading } = req.body;
    const newReading = new Reading({ meterId, reading });
    await newReading.save();
    res.status(201).json(newReading);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add reading' });
  }
});

// Get all readings
router.get('/', async (req, res) => {
  try {
    const readings = await Reading.find().sort({ timestamp: 1 });
    res.json(readings);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch readings' });
  }
});

// Get readings by date range
router.get('/range', async (req, res) => {
  const { start, end } = req.query;
  try {
    const readings = await Reading.find({
      timestamp: { $gte: new Date(start), $lte: new Date(end) }
    }).sort({ timestamp: 1 });
    res.json(readings);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch range' });
  }
});

// Delete specific readings
router.delete('/delete', async (req, res) => {
  const { ids } = req.body;
  try {
    await Reading.deleteMany({ _id: { $in: ids } });
    res.json({ message: 'Readings deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete' });
  }
});

// Clear all readings
router.delete('/clear', async (req, res) => {
  try {
    await Reading.deleteMany({});
    res.json({ message: 'All readings cleared' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to clear readings' });
  }
});

module.exports = router;
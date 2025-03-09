const mongoose = require('mongoose');

const readingSchema = new mongoose.Schema({
  meterId: { type: String, required: true },
  reading: { type: Number, required: true },
  timestamp: { type: Date, default: () => new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }) }
});

module.exports = mongoose.model('Reading', readingSchema);
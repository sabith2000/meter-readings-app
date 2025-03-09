const express = require('express');
const router = express.Router();
const Reading = require('../models/Reading');

// Add a reading
router.post('/add', async (req, res) => {
  try {
    console.log('Received POST /api/readings/add with body:', req.body); // Debug log
    const { meterId, reading } = req.body;
    if (!meterId || !reading) {
      console.log('Validation failed: meterId or reading missing');
      return res.status(400).json({ error: 'meterId and reading are required' });
    }
    const newReading = new Reading({ meterId, reading });
    const savedReading = await newReading.save();
    console.log('Reading saved successfully:', savedReading); // Debug log
    res.status(201).json(savedReading);
  } catch (error) {
    console.error('Error saving reading:', error.message); // Debug log
    res.status(500).json({ error: 'Failed to add reading' });
  }
});

// Get all readings with usage and cost calculations
router.get('/', async (req, res) => {
  try {
    const { meterId, tier1, tier2, tier3, tier4, tier5, tier6, tier7 } = req.query;
    const priceTiers = {
      tier1: parseFloat(tier1) || 0,
      tier2: parseFloat(tier2) || 4.7,
      tier3: parseFloat(tier3) || 6.3,
      tier4: parseFloat(tier4) || 8.4,
      tier5: parseFloat(tier5) || 9.45,
      tier6: parseFloat(tier6) || 10.5,
      tier7: parseFloat(tier7) || 11.55,
    };

    const query = meterId && meterId !== 'All' ? { meterId } : {};
    const readings = await Reading.find(query).sort({ timestamp: 1 });

    const daily = {};
    const monthly = {};
    let totalUsage = { Meter1: 0, Meter2: 0, Meter3: 0 };
    const rangeUsage = { Meter1: 0, Meter2: 0, Meter3: 0 };
    const totalCost = { Meter1: 0, Meter2: 0, Meter3: 0 };
    const slabDetails = { Meter1: [], Meter2: [], Meter3: [] };

    const readingsByMeter = readings.reduce((acc, r) => {
      acc[r.meterId] = acc[r.meterId] || [];
      acc[r.meterId].push(r);
      return acc;
    }, {});

    const calculateSlabCost = (usage) => {
      let remaining = usage;
      let cost = 0;
      const slabs = [
        { from: 0, to: 100, rate: priceTiers.tier1 },
        { from: 101, to: 400, rate: priceTiers.tier2 },
        { from: 401, to: 500, rate: priceTiers.tier3 },
        { from: 501, to: 600, rate: priceTiers.tier4 },
        { from: 601, to: 800, rate: priceTiers.tier5 },
        { from: 801, to: 1000, rate: priceTiers.tier6 },
        { from: 1001, to: 5000, rate: priceTiers.tier7 },
      ];
      let slabData = [];

      for (let slab of slabs) {
        if (remaining <= 0) break;
        const units = Math.min(remaining, slab.to - slab.from + 1);
        if (units > 0) {
          const amount = units * slab.rate;
          cost += amount;
          slabData.push({
            from: slab.from,
            to: slab.from + units - 1,
            units,
            rate: slab.rate,
            amount: amount.toFixed(2),
          });
          remaining -= units;
        }
      }

      return { cost: cost.toFixed(2), slabData };
    };

    Object.keys(readingsByMeter).forEach(meter => {
      const meterReadings = readingsByMeter[meter].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      daily[meter] = [];
      monthly[meter] = {};

      const readingsByDate = meterReadings.reduce((acc, r) => {
        const date = new Date(r.timestamp).toLocaleDateString('en-US', { timeZone: 'Asia/Kolkata' });
        acc[date] = acc[date] || [];
        acc[date].push(r);
        return acc;
      }, {});

      const dates = Object.keys(readingsByDate).sort((a, b) => new Date(a) - new Date(b));

      let prevLastReading = null;
      dates.forEach((date, i) => {
        const dayReadings = readingsByDate[date];
        const firstReading = dayReadings[0].reading;
        const lastReading = dayReadings[dayReadings.length - 1].reading;
        const month = new Date(date).toLocaleString('en-US', { month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata' });

        let usage;
        if (dayReadings.length > 1) {
          usage = lastReading - firstReading;
        } else if (i === 0) {
          usage = 'N/A';
        } else {
          usage = lastReading - prevLastReading;
        }

        daily[meter].push({ date, usage });
        if (usage !== 'N/A') {
          totalUsage[meter] += usage;
          monthly[meter][month] = (monthly[meter][month] || 0) + usage;
        }
        prevLastReading = lastReading;
      });

      if (meterReadings.length > 1) {
        rangeUsage[meter] = meterReadings[meterReadings.length - 1].reading - meterReadings[0].reading;
      }

      const { cost, slabData } = calculateSlabCost(totalUsage[meter]);
      totalCost[meter] = cost;
      slabDetails[meter] = slabData;
    });

    res.json({
      readings,
      usage: { daily, monthly, total: totalUsage, range: rangeUsage, cost: totalCost, slabDetails }
    });
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
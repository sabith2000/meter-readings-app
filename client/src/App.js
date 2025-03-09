import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import './App.css';

function App() {
  const [readings, setReadings] = useState([]);
  const [meterId, setMeterId] = useState('Meter1');
  const [reading, setReading] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [pricePerUnit, setPricePerUnit] = useState(5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [darkMode, setDarkMode] = useState(false);

  const fetchReadings = async (url = '/api/readings') => {
    setLoading(true);
    try {
      const res = await axios.get(url);
      setReadings(res.data);
      setError('');
    } catch (err) {
      setError('Failed to load readings');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchReadings();
  }, []);

  const addReading = async () => {
    if (!reading) return setError('Reading is required');
    setLoading(true);
    try {
      const res = await axios.post('/api/readings/add', { meterId, reading: Number(reading) });
      setReadings([...readings, res.data]);
      setReading('');
      setError('');
    } catch (err) {
      setError('Failed to add reading');
    }
    setLoading(false);
  };

  const fetchRange = () => {
    if (!startDate || !endDate) return setError('Select date range');
    fetchReadings(`/api/readings/range?start=${startDate}&end=${endDate}`);
  };

  const deleteReadings = async (ids) => {
    setLoading(true);
    try {
      await axios.delete('/api/readings/delete', { data: { ids } });
      setReadings(readings.filter(r => !ids.includes(r._id)));
      setError('');
    } catch (err) {
      setError('Failed to delete');
    }
    setLoading(false);
  };

  const clearAll = async () => {
    setLoading(true);
    try {
      await axios.delete('/api/readings/clear');
      setReadings([]);
      setError('');
    } catch (err) {
      setError('Failed to clear');
    }
    setLoading(false);
  };

  const calculateUsage = () => {
    const daily = {};
    const monthly = {};
    let totalUsage = { Meter1: 0, Meter2: 0, Meter3: 0 };
    const rangeUsage = { Meter1: 0, Meter2: 0, Meter3: 0 };

    const readingsByMeter = readings.reduce((acc, r) => {
      acc[r.meterId] = acc[r.meterId] || [];
      acc[r.meterId].push(r);
      return acc;
    }, {});

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
    });

    return { daily, monthly, total: totalUsage, range: rangeUsage };
  };

  const usage = calculateUsage();

  return (
    <div className={`container ${darkMode ? 'dark-mode' : ''}`}>
      <motion.div
        className="header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1><i className="fas fa-plug"></i> Meter Readings</h1>
        <button className="mode-toggle" onClick={() => setDarkMode(!darkMode)}>
          <i className={darkMode ? 'fas fa-sun' : 'fas fa-moon'}></i>
          {darkMode ? ' Light' : ' Dark'}
        </button>
      </motion.div>

      {loading && <motion.p className="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>Loading...</motion.p>}
      {error && (
        <motion.p className="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
          <i className="fas fa-exclamation-circle"></i> {error}
        </motion.p>
      )}

      <motion.div className="input-section" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
        <select value={meterId} onChange={(e) => setMeterId(e.target.value)}>
          <option value="Meter1">Meter 1</option>
          <option value="Meter2">Meter 2</option>
          <option value="Meter3">Meter 3</option>
        </select>
        <input
          type="number"
          value={reading}
          onChange={(e) => setReading(e.target.value)}
          placeholder="Enter reading (kWh)"
        />
        <button onClick={addReading} disabled={loading}><i className="fas fa-plus"></i> Add</button>
      </motion.div>

      <motion.div className="range-section" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        <button onClick={fetchRange} disabled={loading}><i className="fas fa-filter"></i> Filter</button>
      </motion.div>

      <motion.div className="price-section" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.3 }}>
        <label><i className="fas fa-rupee-sign"></i> Price per Unit (₹): </label>
        <input
          type="number"
          value={pricePerUnit}
          onChange={(e) => setPricePerUnit(e.target.value)}
          min="0"
          step="0.01"
        />
      </motion.div>

      <motion.div className="readings" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.4 }}>
        <div className="section-header">
          <h2><i className="fas fa-list"></i> Readings</h2>
          <button onClick={clearAll} disabled={loading}><i className="fas fa-trash-alt"></i> Clear All</button>
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Meter</th>
                <th>Reading (kWh)</th>
                <th>Timestamp</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {readings.map(r => (
                <motion.tr
                  key={r._id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <td>{r.meterId}</td>
                  <td>{r.reading}</td>
                  <td>{new Date(r.timestamp).toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })}</td>
                  <td>
                    <button onClick={() => deleteReadings([r._id])} disabled={loading}><i className="fas fa-times"></i></button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      <motion.div className="usage" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.5 }}>
        <h2><i className="fas fa-chart-line"></i> Usage</h2>
        {Object.keys(usage.total).map(meter => (
          <div key={meter} className="meter-usage">
            <h3><i className="fas fa-tachometer-alt"></i> {meter}</h3>
            <p>Total Usage: {usage.total[meter]} kWh (₹{(usage.total[meter] * pricePerUnit).toFixed(2)})</p>
            <p>Range Usage: {usage.range[meter]} kWh (₹{(usage.range[meter] * pricePerUnit).toFixed(2)})</p>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Daily Usage (kWh)</th>
                    <th>Cost (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {usage.daily[meter]?.map(d => (
                    <motion.tr
                      key={d.date}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <td>{d.date}</td>
                      <td>{d.usage === 'N/A' ? 'N/A' : d.usage}</td>
                      <td>{d.usage === 'N/A' ? 'N/A' : (d.usage * pricePerUnit).toFixed(2)}</td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
            <h4>Monthly Usage</h4>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Month</th>
                    <th>Usage (kWh)</th>
                    <th>Cost (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(usage.monthly[meter] || {}).map(([month, usage]) => (
                    <motion.tr
                      key={month}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <td>{month}</td>
                      <td>{usage}</td>
                      <td>{(usage * pricePerUnit).toFixed(2)}</td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </motion.div>
    </div>
  );
}

export default App;
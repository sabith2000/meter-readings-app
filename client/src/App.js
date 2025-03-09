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
  const [priceTiers, setPriceTiers] = useState({
    tier1: 0,   // 0-100
    tier2: 4.7, // 101-400
    tier3: 6.3, // 401-500
    tier4: 8.4, // 501-600
    tier5: 9.45,// 601-800
    tier6: 10.5,// 801-1000
    tier7: 11.55,// 1001-5000
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [darkMode, setDarkMode] = useState(false);
  const [usage, setUsage] = useState(null);

  const fetchReadings = async (url = '/api/readings', params = {}) => {
    setLoading(true);
    try {
      const res = await axios.get(url, {
        params: {
          meterId,
          tier1: priceTiers.tier1,
          tier2: priceTiers.tier2,
          tier3: priceTiers.tier3,
          tier4: priceTiers.tier4,
          tier5: priceTiers.tier5,
          tier6: priceTiers.tier6,
          tier7: priceTiers.tier7,
          ...params,
        },
      });
      setReadings(res.data.readings);
      setUsage(res.data.usage);
      setError('');
    } catch (err) {
      setError('Failed to load readings');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchReadings();
  }, [meterId, priceTiers]);

  const addReading = async () => {
    if (!reading) return setError('Reading is required');
    setLoading(true);
    try {
      const res = await axios.post('/api/readings/add', { meterId, reading: Number(reading) });
      setReadings([...readings, res.data]);
      fetchReadings();
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
      fetchReadings();
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
      setUsage(null);
      setError('');
    } catch (err) {
      setError('Failed to clear');
    }
    setLoading(false);
  };

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
        <h2><i className="fas fa-indian-rupee-sign"></i> Slabwise Calculation of Charges</h2>
        <table className="slab-table">
          <thead>
            <tr>
              <th>From Unit</th>
              <th>To Unit</th>
              <th>Units</th>
              <th>Rate (₹)</th>
              <th>Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            {[
              { from: 1, to: 100, units: 100 },
              { from: 101, to: 400, units: 300 },
              { from: 401, to: 500, units: 100 },
              { from: 501, to: 600, units: 100 },
              { from: 601, to: 800, units: 200 },
              { from: 801, to: 1000, units: 200 },
              { from: 1001, to: 5000, units: 4000 },
            ].map((slab, index) => (
              <tr key={index}>
                <td>{slab.from}</td>
                <td>{slab.to}</td>
                <td>{slab.units}</td>
                <td>
                  <input
                    type="number"
                    value={priceTiers[`tier${index + 1}`]}
                    onChange={(e) => setPriceTiers({ ...priceTiers, [`tier${index + 1}`]: Number(e.target.value) })}
                    min="0"
                    step="0.01"
                  />
                </td>
                <td>
                  {usage && usage.total[meterId] > 0
                    ? (Math.min(usage.total[meterId], slab.to) - Math.max(usage.total[meterId], slab.from) + 1 > 0
                      ? (Math.min(usage.total[meterId], slab.to) - Math.max(usage.total[meterId], slab.from) + 1) * priceTiers[`tier${index + 1}`]
                      : 0).toFixed(2)
                    : '0.00'}
                </td>
              </tr>
            ))}
            <tr className="total-row">
              <td colSpan="4">Total</td>
              <td>{usage ? usage.cost[meterId] || '0.00' : '0.00'}</td>
            </tr>
          </tbody>
        </table>
      </motion.div>

      <motion.div className="usage" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.4 }}>
        <h2><i className="fas fa-chart-line"></i> Usage</h2>
        {usage && Object.keys(usage.total)
          .filter(meter => meter === meterId)
          .map(meter => (
            <div key={meter} className="meter-usage">
              <h3><i className="fas fa-tachometer-alt"></i> {meter}</h3>
              <p>Total Usage: {usage.total[meter]} kWh (₹{usage.cost[meter]})</p>
              <p>Range Usage: {usage.range[meter]} kWh</p>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Daily Usage (kWh)</th>
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
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
      </motion.div>

      <motion.div className="readings" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.5 }}>
        <div className="section-header">
          <h2><i className="fas fa-list"></i> All Readings</h2>
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
    </div>
  );
}

export default App;
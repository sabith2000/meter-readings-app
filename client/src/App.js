import React, { useState, useEffect, useCallback } from 'react';
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
    tier1: 0,
    tier2: 4.7,
    tier3: 6.3,
    tier4: 8.4,
    tier5: 9.45,
    tier6: 10.5,
    tier7: 11.55,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [darkMode, setDarkMode] = useState(false);
  const [usage, setUsage] = useState(null);
  const [isSlabOpen, setIsSlabOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState(localStorage.getItem('token'));

  const fetchReadings = useCallback(async (url = '/api/readings', params = {}) => {
    setLoading(true);
    try {
      const res = await axios.get(url, {
        params,
        headers: { Authorization: `Bearer ${token}` },
      });
      setReadings(res.data.readings);
      setUsage(res.data.usage);
      setError('');
    } catch (err) {
      setError('Failed to load readings: ' + (err.response?.data?.error || err.message));
    }
    setLoading(false);
  }, [token]);

  useEffect(() => {
    if (token) {
      setIsAuthenticated(true);
      fetchReadings();
      const interval = setInterval(() => fetchReadings(), 5000);
      return () => clearInterval(interval);
    }
  }, [token, fetchReadings]);

  const addReading = async () => {
    if (!reading) return setError('Reading is required');
    setLoading(true);
    try {
      const res = await axios.post('/api/readings/add', { meterId, reading: Number(reading) }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setReadings([...readings, res.data]);
      fetchReadings();
      setReading('');
      setError('');
    } catch (err) {
      setError('Failed to add reading: ' + (err.response?.data?.error || err.message));
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
      await axios.delete('/api/readings/delete', {
        data: { ids },
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchReadings();
      setError('');
    } catch (err) {
      setError('Failed to delete: ' + (err.response?.data?.error || err.message));
    }
    setLoading(false);
  };

  const clearAll = async () => {
    setLoading(true);
    try {
      await axios.delete('/api/readings/clear', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setReadings([]);
      setUsage(null);
      setError('');
    } catch (err) {
      setError('Failed to clear: ' + (err.response?.data?.error || err.message));
    }
    setLoading(false);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('/api/auth/login', { username, password });
      const token = res.data.token;
      setToken(token);
      localStorage.setItem('token', token);
      setIsAuthenticated(true);
      setUsername('');
      setPassword('');
      setError('');
    } catch (err) {
      setError('Login failed: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleLogout = () => {
    setToken('');
    localStorage.removeItem('token');
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return (
      <div className={`container ${darkMode ? 'dark-mode' : ''}`}>
        <motion.div
          className="header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1><i className="fas fa-plug"></i> Meter Readings</h1>
          <div className="header-buttons">
            <button className="mode-toggle" onClick={() => setDarkMode(!darkMode)}>
              <i className={darkMode ? 'fas fa-sun' : 'fas fa-moon'}></i>
              {darkMode ? 'Light' : 'Dark'} Mode
            </button>
          </div>
        </motion.div>
        {error && (
          <motion.p className="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
            <i className="fas fa-exclamation-circle"></i> {error}
          </motion.p>
        )}
        <motion.div
          className="login-section"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h2><i className="fas fa-sign-in-alt"></i> Login</h2>
          <form onSubmit={handleLogin}>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              required
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
            />
            <button type="submit" disabled={loading}>
              <i className="fas fa-sign-in-alt"></i> Login
            </button>
          </form>
          <p>Not registered? <button onClick={() => setError('Registration not implemented yet')} style={{ background: 'none', border: 'none', color: '#2b6cb0', textDecoration: 'underline', cursor: 'pointer', padding: 0 }}>Register</button></p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={`container ${darkMode ? 'dark-mode' : ''}`}>
      <motion.div
        className="header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1><i className="fas fa-plug"></i> Meter Readings</h1>
        <div className="header-buttons">
          <button className="mode-toggle" onClick={() => setDarkMode(!darkMode)}>
            <i className={darkMode ? 'fas fa-sun' : 'fas fa-moon'}></i>
            {darkMode ? 'Light' : 'Dark'} Mode
          </button>
          <button className="logout-button" onClick={handleLogout}>
            <i className="fas fa-sign-out-alt"></i> Logout
          </button>
        </div>
      </motion.div>

      {loading && (
        <motion.p className="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
          Loading...
        </motion.p>
      )}
      {error && (
        <motion.p className="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
          <i className="fas fa-exclamation-circle"></i> {error}
        </motion.p>
      )}

      <motion.div className="card input-section" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
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
        <button onClick={addReading} disabled={loading}>
          <i className="fas fa-plus"></i> Add Reading
        </button>
      </motion.div>

      <motion.div className="card range-section" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        <button onClick={fetchRange} disabled={loading}>
          <i className="fas fa-filter"></i> Filter Range
        </button>
        {usage && Object.keys(usage.total)
          .filter(meter => meter === meterId)
          .map(meter => (
            <div key={meter} className="usage-stats">
              <p>Total Usage: {usage.total[meter]} kWh (₹{usage.cost[meter]})</p>
              <p>Range Usage: {usage.range[meter]} kWh</p>
            </div>
          ))}
      </motion.div>

      <motion.div
        className="card usage"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <div className="section-header">
          <h2><i className="fas fa-chart-line"></i> Usage Statistics</h2>
        </div>
        {usage && Object.keys(usage.total)
          .filter(meter => meter === meterId)
          .map(meter => (
            <div key={meter} className="meter-usage">
              <h3><i className="fas fa-tachometer-alt"></i> {meter}</h3>
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

      <motion.div
        className="card price-section"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <div className="section-header">
          <h2><i className="fas fa-indian-rupee-sign"></i> Slabwise Charges</h2>
          <button className="toggle-button" onClick={() => setIsSlabOpen(!isSlabOpen)}>
            {isSlabOpen ? <i className="fas fa-chevron-up"></i> : <i className="fas fa-chevron-down"></i>}
            {isSlabOpen ? 'Hide' : 'Show'} Slabs
          </button>
        </div>
        {isSlabOpen && (
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
        )}
      </motion.div>

      <motion.div className="card readings" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.6 }}>
        <div className="section-header">
          <h2><i className="fas fa-list"></i> All Readings</h2>
          <button className="delete-button" onClick={clearAll} disabled={loading}>
            <i className="fas fa-trash-alt"></i> Clear All
          </button>
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
                    <button className="delete-button" onClick={() => deleteReadings([r._id])} disabled={loading}>
                      <i className="fas fa-times"></i> Delete
                    </button>
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
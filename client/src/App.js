import React, { useState, useEffect } from 'react';
import axios from 'axios';
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

  // Usage Calculations
  const calculateUsage = () => {
    const daily = [];
    const monthly = {};
    let totalUsage = 0;

    readings.forEach((r, i) => {
      const date = new Date(r.timestamp).toLocaleDateString('en-US', { timeZone: 'Asia/Kolkata' });
      const month = new Date(r.timestamp).toLocaleString('en-US', { month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata' });

      if (i === 0) {
        daily.push({ date, usage: 'N/A' });
      } else {
        const prev = readings[i - 1];
        if (new Date(prev.timestamp).toLocaleDateString('en-US', { timeZone: 'Asia/Kolkata' }) !== date) {
          const usage = r.reading - prev.reading;
          daily.push({ date, usage });
          totalUsage += usage;
          monthly[month] = (monthly[month] || 0) + usage;
        }
      }
    });

    const rangeUsage = readings.length > 1 ? readings[readings.length - 1].reading - readings[0].reading : 0;
    return { daily, monthly, total: totalUsage, range: rangeUsage };
  };

  const usage = calculateUsage();

  return (
    <div className="container">
      <h1>Electrical Meter Readings</h1>
      {loading && <p>Loading...</p>}
      {error && <p className="error">{error}</p>}

      <div className="input-section">
        <select value={meterId} onChange={(e) => setMeterId(e.target.value)}>
          <option value="Meter1">Meter 1</option>
          <option value="Meter2">Meter 2</option>
          <option value="Meter3">Meter 3</option>
        </select>
        <input
          type="number"
          value={reading}
          onChange={(e) => setReading(e.target.value)}
          placeholder="Enter reading"
        />
        <button onClick={addReading}>Add Reading</button>
      </div>

      <div className="range-section">
        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        <button onClick={fetchRange}>View Range</button>
      </div>

      <div className="price-section">
        <label>Price per Unit (₹): </label>
        <input
          type="number"
          value={pricePerUnit}
          onChange={(e) => setPricePerUnit(e.target.value)}
        />
      </div>

      <div className="readings">
        <h2>Readings</h2>
        <button onClick={clearAll}>Clear All</button>
        <ul>
          {readings.map(r => (
            <li key={r._id}>
              {r.meterId}: {r.reading} kWh - {new Date(r.timestamp).toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })}
              <button onClick={() => deleteReadings([r._id])}>Delete</button>
            </li>
          ))}
        </ul>
      </div>

      <div className="usage">
        <h2>Usage</h2>
        <p>Total Usage: {usage.total} kWh (₹{usage.total * pricePerUnit})</p>
        <p>Range Usage: {usage.range} kWh (₹{usage.range * pricePerUnit})</p>
        <h3>Daily Usage</h3>
        <ul>
          {usage.daily.map(d => (
            <li key={d.date}>{d.date}: {d.usage === 'N/A' ? 'N/A' : `${d.usage} kWh (₹${d.usage * pricePerUnit})`}</li>
          ))}
        </ul>
        <h3>Monthly Usage</h3>
        <ul>
          {Object.entries(usage.monthly).map(([month, usage]) => (
            <li key={month}>{month}: {usage} kWh (₹{usage * pricePerUnit})</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default App;
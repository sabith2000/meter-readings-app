const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const jwt = require('jsonwebtoken'); // Add this import
const authRouter = require('./routes/auth');
const readingsRouter = require('./routes/readings');

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../client/build')));

// Middleware to verify JWT with logging
const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  console.log('Received token:', token); // Debug log
  if (!token) return res.status(401).json({ error: 'Access denied, token required' });

  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
    if (err) {
      console.error('Token verification error:', err.message); // Debug log
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    console.log('User authenticated:', user); // Debug log
    next();
  });
};

// MongoDB Connection with logging
console.log('Connecting to MongoDB with URI:', process.env.MONGO_URI); // Debug log
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB successfully');
  })
  .catch(err => {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  });

// Routes
app.use('/api/auth', authRouter);
app.use('/api/readings', authenticateToken, readingsRouter);

// Serve React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/build/index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
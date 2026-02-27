require('dotenv').config();
const express = require('express');
const cors = require('cors');
const profileRoutes = require('./routes/profileRoutes');
const submissionRoutes = require('./routes/submissionRoutes');

const app = express();

// CORS: set CORS_ORIGIN in production (e.g. https://yourapp.com or comma-separated list)
const corsOrigin = process.env.CORS_ORIGIN;
const corsOptions = {
  origin: corsOrigin
    ? corsOrigin.split(',').map((o) => o.trim())
    : true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};
app.use(cors(corsOptions));

app.use(express.json());

// Profile + submission routes (profile/data only; no report)
app.use('/profile', profileRoutes);
app.use('/submissions', submissionRoutes);

// Root: show API is up and list routes
app.get('/', (req, res) => {
  res.status(200).json({
    name: 'VitalTwin Backend',
    status: 'ok',
    endpoints: {
      health: 'GET /health',
      saveSubmission: 'POST /profile or POST /submissions',
      getLatest: 'GET /profile or GET /submissions/latest',
      getById: 'GET /profile/:id',
    },
  });
});

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ ok: true });
});

// 404
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ success: false, message: err.message || 'Internal server error' });
});

module.exports = app;

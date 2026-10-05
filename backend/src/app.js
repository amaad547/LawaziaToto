const express = require('express');
const cors = require('cors');
const path = require('path');

const authRouter = require('./routes/auth');
const requestsRouter = require('./routes/requests');
const tripsRouter = require('./routes/trips');
const historyRouter = require('./routes/history');
const adminRouter = require('./routes/admin');

const app = express();

// CORS configuration
const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(',').map(o => o.trim())
  : null;

app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser requests or if no specific frontend origin configured
    if (!origin || !allowedOrigins || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      return callback(null, true);
    }
    return callback(null, true); // Fallback allow in dev
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Health checks
const healthHandler = (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
};
app.get('/health', healthHandler);
app.get('/api/health', healthHandler);

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/requests', requestsRouter);
app.use('/api/trips', tripsRouter);
app.use('/api/history', historyRouter);
app.use('/api/admin', adminRouter);

// Serve frontend in production
const frontendDist = path.join(__dirname, '../../frontend/dist');
app.use(express.static(frontendDist));

// SPA catch-all: serve index.html for non-API routes
app.get('*', (req, res, next) => {
  // Don't serve index.html for /api routes — let them fall through to 404
  if (req.originalUrl.startsWith('/api')) return next();
  res.sendFile(path.join(frontendDist, 'index.html'), (err) => {
    if (err) next(); // If file doesn't exist (dev mode), fall through to 404
  });
});

// 404 Fallback
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'NOT_FOUND',
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

// Centralized error handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({
    success: false,
    error: 'SERVER_ERROR',
    message: 'An unexpected internal server error occurred.'
  });
});

module.exports = app;

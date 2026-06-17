const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const { isConnected } = require('./config/db');
const authRoutes = require('./routes/auth');
const sheetRoutes = require('./routes/sheets');

const app = express();

// ─── CORS ───
const corsOptions = {
  origin: [
    process.env.FRONTEND_URL,
    'http://localhost:5173',
    'http://localhost:4173',
    'https://production-portal-tttt.pages.dev',
    'https://test-portal-64d.pages.dev',
    'https://production-portal-e77.pages.dev'
  ].filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// ─── Body parsing ───
app.use(express.json({ limit: '1mb' }));

// ─── Rate limiting ───
// Global rate limit: 100 requests per 15 minutes per IP
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests. Please try again later.' },
});

// Strict rate limit for login: 10 attempts per 15 minutes per IP
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many login attempts. Please try again after 15 minutes.' },
});

app.use('/api/', globalLimiter);
app.use('/api/auth/login', loginLimiter);

// ─── Simple request logging ───
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`);
  });
  next();
});

// ─── DB connection middleware (for local dev without Vercel handler) ───
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('DB connection error:', err);
    res.status(500).json({ message: 'Database connection failed' });
  }
});

// ─── Health check ───
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    database: isConnected() ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
});

// ─── Routes ───
app.use('/api/auth', authRoutes);
app.use('/api/sheets', sheetRoutes);

module.exports = app;

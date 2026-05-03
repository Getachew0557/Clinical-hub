import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import sequelize, { ensureDatabaseExists } from './src/config/database.js';
import authRoutes from './src/routes/authRoutes.js';
import { connectEventBus, handleInternalEvent } from './src/utils/eventBus.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

// Strict rate limit on auth endpoints — 10 attempts per 15 min per IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many authentication attempts. Please try again in 15 minutes.' },
  skipSuccessfulRequests: true, // only count failed attempts
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/forgot-password', authLimiter);

// Middlewares
app.use(cors());
app.use(cookieParser());
app.use(express.json());

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}
app.use('/uploads', express.static(uploadsDir));

// Routes
app.use('/api/auth', authRoutes);
app.post('/api/internal/events', async (req, res) => {
  await handleInternalEvent(req.body);
  res.sendStatus(200);
});

// Health Check — responds immediately even before DB is ready
app.get('/api/health', (req, res) => {
  res.status(200).json({ service: 'auth-service', status: 'healthy' });
});

// Sync Database & Start Server
const PORT = process.env.AUTH_PORT || 5001;

const connectDB = async () => {
  await ensureDatabaseExists();
  await sequelize.authenticate();
  console.log('Database connected successfully.');
  // Create tables if missing, never drop existing
  await sequelize.sync();
  console.log('Database models synced.');

  // Safe column additions for production DB (PostgreSQL syntax)
  const qi = sequelize.getQueryInterface();
  const cols = await qi.describeTable('Users').catch(() => ({}));
  if (!cols.profilePhoto) {
    await sequelize.query('ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS "profilePhoto" VARCHAR(255) NULL;').catch(() => {});
    console.log('Added column: profilePhoto');
  }
  if (!cols.resetPasswordToken) {
    await sequelize.query('ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS "resetPasswordToken" VARCHAR(255) NULL;').catch(() => {});
    console.log('Added column: resetPasswordToken');
  }
  if (!cols.resetPasswordExpires) {
    await sequelize.query('ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS "resetPasswordExpires" TIMESTAMP NULL;').catch(() => {});
    console.log('Added column: resetPasswordExpires');
  }
  if (!cols.refreshToken) {
    await sequelize.query('ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS "refreshToken" VARCHAR(512) NULL;').catch(() => {});
    console.log('Added column: refreshToken');
  }
  if (!cols.googleId) {
    await sequelize.query('ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS "googleId" VARCHAR(255) NULL;').catch(() => {});
    console.log('Added column: googleId');
  }

  connectEventBus().catch(err => console.warn('EventBus (non-fatal):', err.message));
  console.log('auth-service fully ready.');

  // DB Keep-Alive — Supabase keeps connections alive but ping anyway
  setInterval(async () => {
    try {
      await sequelize.query('SELECT 1');
    } catch (err) {
      console.warn('[DB KeepAlive] ping failed:', err.message);
    }
  }, 4 * 60 * 1000);
};

// Start HTTP server FIRST — gateway can reach it immediately
app.listen(PORT, () => {
  console.log(`auth-service running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  // Connect to DB after server is listening
  connectDB().catch(err => {
    console.error('DB connection failed, retrying in 15s:', err.message);
    setTimeout(() => connectDB().catch(console.error), 15000);
  });
});



import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import sequelize, { ensureDatabaseExists } from './src/config/database.js';
import appointmentRoutes from './src/routes/appointmentRoutes.js';
import Appointment from './src/models/Appointment.js';

const app = express();

// ─── Middlewares ───────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ─── Routes ───────────────────────────────────────────────────────────────
app.use('/api/appointments', appointmentRoutes);

// ─── Health Check ─────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.status(200).json({ service: 'appointment-service', status: 'healthy' });
});

// ─── 404 handler ──────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});

// ─── Startup ──────────────────────────────────────────────────────────────
const PORT = process.env.APPT_PORT || 5003;

const connectDB = async () => {
  await ensureDatabaseExists();
  await sequelize.authenticate();
  console.log('Database connected successfully.');
  await sequelize.sync({ alter: true });
  console.log('Database models synced.');
  console.log('appointment-service fully ready.');
};

// Start HTTP server FIRST so gateway can reach it immediately
app.listen(PORT, () => {
  console.log(`appointment-service running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  connectDB().catch(err => {
    console.error('DB connection failed, retrying in 15s:', err.message);
    setTimeout(() => connectDB().catch(console.error), 15000);
  });
});

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

const startServer = async () => {
  try {
    await ensureDatabaseExists();
    await sequelize.authenticate();
    console.log('Database connected successfully.');

    await sequelize.sync({ alter: true });
    console.log('Database models synced.');

    app.listen(PORT, () => {
      console.log(`appointment-service running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    });
  } catch (error) {
    console.error('Unable to start appointment-service:', error);
    process.exit(1);
  }
};

startServer();

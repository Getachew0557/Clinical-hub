import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import sequelize, { ensureDatabaseExists } from './src/config/database.js';
import reportRoutes from './src/routes/reportRoutes.js';

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/reports', reportRoutes);

// Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({ service: 'report-service', status: 'healthy' });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});

const PORT = process.env.REPORT_PORT || 5007;

const startServer = async () => {
  try {
    await ensureDatabaseExists();
    await sequelize.authenticate();
    console.log('Database connected successfully.');

    await sequelize.sync({ alter: true });
    console.log('Database models synced.');

    app.listen(PORT, () => {
      console.log(`report-service running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    });
  } catch (error) {
    console.error('Unable to start report-service:', error);
    process.exit(1);
  }
};

startServer();


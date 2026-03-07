import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import sequelize, { ensureDatabaseExists } from './src/config/database.js';
import emrRoutes from './src/routes/emrRoutes.js';

// Setup models and associations
import './src/models/MedicalRecord.js';
import './src/models/Prescription.js';

dotenv.config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/emr', emrRoutes);

// Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({ service: 'emr-service', status: 'healthy' });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});

const PORT = process.env.PORT || 5004;

const startServer = async () => {
  try {
    await ensureDatabaseExists();
    await sequelize.authenticate();
    console.log('Database connected successfully.');

    // Sync with alter: true to preserve data during development
    await sequelize.sync({ alter: true });
    console.log('Database models synced.');

    app.listen(PORT, () => {
      console.log(`emr-service running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    });
  } catch (error) {
    console.error('Unable to start emr-service:', error);
    process.exit(1);
  }
};

startServer();

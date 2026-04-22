import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import sequelize, { ensureDatabaseExists } from './src/config/database.js';

// Routes
import patientRoutes from './src/routes/patientRoutes.js';
import emrRoutes from './src/routes/emrRoutes.js';
import billingRoutes from './src/routes/billingRoutes.js';

// Models (ensure associations are registered)
import './src/models/MedicalRecord.js';
import './src/models/Prescription.js';
import './src/models/Invoice.js';
import './src/models/Payment.js';

// Event Bus
import { connectEventBus, subscribeToEvent, handleInternalEvent } from './src/utils/eventBus.js';
import { handleUserRegistered } from './src/utils/eventHandlers.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ─── Routes ───────────────────────────────────────────────────────────────
app.use('/api/patients', patientRoutes);
app.use('/api/emr', emrRoutes);
app.use('/api/billing', billingRoutes);
app.post('/api/internal/events', async (req, res) => {
  await handleInternalEvent(req.body);
  res.sendStatus(200);
});

// ─── Health Check ─────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.status(200).json({ service: 'patient-service', status: 'healthy' });
});

app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});

const PORT = process.env.PATIENT_PORT || 5002;

const connectDB = async () => {
  await ensureDatabaseExists();
  await sequelize.authenticate();
  console.log('Database connected successfully.');
  const isProd = process.env.NODE_ENV === 'production';
  await sequelize.sync({ alter: !isProd });
  console.log('Database models synced.');
  connectEventBus().catch(err => console.warn('EventBus (non-fatal):', err.message));
  subscribeToEvent('patient_service_registration', 'user.registered', handleUserRegistered);
  console.log('patient-service fully ready.');
};

app.listen(PORT, () => {
  console.log(`patient-service (+ emr + billing) running on port ${PORT}`);
  connectDB().catch(err => {
    console.error('DB failed, retrying in 15s:', err.message);
    setTimeout(() => connectDB().catch(console.error), 15000);
  });
});

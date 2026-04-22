import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import sequelize, { ensureDatabaseExists } from './src/config/database.js';

// Routes
import doctorRoutes from './src/routes/doctorRoutes.js';
import inventoryRoutes from './src/routes/inventoryRoutes.js';
import reportRoutes from './src/routes/reportRoutes.js';

// Models
import DoctorProfile from './src/models/DoctorProfile.js';
import './src/models/InventoryItem.js';
import './src/models/StockTransaction.js';
import './src/models/Report.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ─── Routes ───────────────────────────────────────────────────────────────
app.use('/api/doctors', doctorRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/reports', reportRoutes);

// ─── Health Check ─────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.status(200).json({ service: 'doctor-service', status: 'healthy' });
});

app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});

const PORT = process.env.DOCTOR_PORT || 5010;

const connectDB = async () => {
  await ensureDatabaseExists();
  await sequelize.authenticate();
  console.log('Database connected successfully.');
  await sequelize.sync();
  console.log('Database models synced.');
  console.log('doctor-service fully ready.');
};

app.listen(PORT, () => {
  console.log(`doctor-service (+ inventory + reports) running on port ${PORT}`);
  connectDB().catch(err => {
    console.error('DB failed, retrying in 15s:', err.message);
    setTimeout(() => connectDB().catch(console.error), 15000);
  });
});

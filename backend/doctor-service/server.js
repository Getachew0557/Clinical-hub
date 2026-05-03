import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import sequelize, { ensureDatabaseExists } from './src/config/database.js';
import DoctorProfile from './src/models/DoctorProfile.js';
import Hospital from './src/models/Hospital.js';
import './src/models/InventoryItem.js';
import './src/models/StockTransaction.js';
import './src/models/Report.js';
import doctorRoutes from './src/routes/doctorRoutes.js';
import hospitalRoutes from './src/routes/hospitalRoutes.js';
import inventoryRoutes from './src/routes/inventoryRoutes.js';
import reportRoutes from './src/routes/reportRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads directory exists (required by multer)
fs.mkdirSync(path.join(__dirname, 'uploads'), { recursive: true });

const app = express();

// ─── Middlewares ───────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// Serve uploaded profile photos statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ─── Routes ───────────────────────────────────────────────────────────────
app.use('/api/doctors', doctorRoutes);
app.use('/api/hospitals', hospitalRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/reports', reportRoutes);

// ─── Health Check ─────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.status(200).json({ service: 'doctor-service', status: 'healthy' });
});

// ─── 404 Handler ──────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});

// ─── Startup ──────────────────────────────────────────────────────────────
const PORT = process.env.DOCTOR_PORT || 5010;

const connectDB = async () => {
  await ensureDatabaseExists();
  await sequelize.authenticate();
  console.log('Database connected successfully.');

  await sequelize.sync();
  console.log('Database models synced.');

  // Safe column additions (PostgreSQL syntax)
  const qi = sequelize.getQueryInterface();
  const tableDesc = await qi.describeTable('DoctorProfiles').catch(() => ({}));

  const newColumns = {
      videoFee:           'DECIMAL(10,2) NULL',
      serviceTypes:       'JSON NULL',
      slotDuration:       'INT NOT NULL DEFAULT 30',
      breakStart:         'TIME NULL',
      breakEnd:           'TIME NULL',
      languages:          'JSON NULL',
      education:          'JSON NULL',
      workExperience:     'JSON NULL',
      awards:             'JSON NULL',
      maxPatientsPerHour: 'INT NOT NULL DEFAULT 10',
      hospitals:          'JSON NULL',
  };

  for (const [col, definition] of Object.entries(newColumns)) {
      if (!tableDesc[col]) {
          await sequelize.query(`ALTER TABLE "DoctorProfiles" ADD COLUMN IF NOT EXISTS "${col}" ${definition};`).catch(() => {});
          console.log(`Added column: ${col}`);
      }
  }
  console.log('doctor-service fully ready.');
};

// Start HTTP server FIRST so gateway can reach it immediately
app.listen(PORT, () => {
  console.log(`doctor-service running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  // Connect DB after server is listening
  connectDB().catch(err => {
    console.error('DB connection failed, retrying in 15s:', err.message);
    setTimeout(() => connectDB().catch(console.error), 15000);
  });
});

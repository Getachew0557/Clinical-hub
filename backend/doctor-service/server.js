import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import sequelize, { ensureDatabaseExists } from './src/config/database.js';
import DoctorProfile from './src/models/DoctorProfile.js';
import doctorRoutes from './src/routes/doctorRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// ─── Middlewares ───────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// Serve uploaded profile photos statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ─── Routes ────────────────────────────────────────────────────────────────
app.use('/api/doctors', doctorRoutes);

// ─── Health Check ──────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.status(200).json({ service: 'doctor-service', status: 'healthy' });
});

// ─── 404 Handler ──────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});

// ─── Startup ───────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5010;

const startServer = async () => {
  try {
    await ensureDatabaseExists();
    await sequelize.authenticate();
    console.log('Database connected successfully.');

    await sequelize.sync();
    console.log('Database models synced.');

    // ── Add new columns if they don't exist (safe migration) ──────────────
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
    };

    for (const [col, definition] of Object.entries(newColumns)) {
        if (!tableDesc[col]) {
            await sequelize.query(`ALTER TABLE \`DoctorProfiles\` ADD COLUMN \`${col}\` ${definition};`);
            console.log(`Added column: ${col}`);
        }
    }

    app.listen(PORT, () => {
      console.log(`doctor-service running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    });
  } catch (error) {
    console.error('Unable to start doctor-service:', error);
    process.exit(1);
  }
};

startServer();

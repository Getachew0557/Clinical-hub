import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import sequelize, { ensureDatabaseExists } from './src/config/database.js';
import authRoutes from './src/routes/authRoutes.js';
import { connectEventBus, handleInternalEvent } from './src/utils/eventBus.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middlewares
app.use(cors());
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

// Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({ service: 'auth-service', status: 'healthy' });
});

// Sync Database & Start Server
const PORT = process.env.AUTH_PORT || 5001;

const startServer = async () => {
  try {
    await ensureDatabaseExists();
    await sequelize.authenticate();
    console.log('Database connected successfully.');

    // Use sync without alter in production for faster startup
    const isProduction = process.env.NODE_ENV === 'production';
    await sequelize.sync({ alter: !isProduction });
    console.log('Database models synced.');

    // Safe column migration for profilePhoto (only in dev)
    if (!isProduction) {
      const qi = sequelize.getQueryInterface();
      const tableDesc = await qi.describeTable('Users').catch(() => ({}));
      if (!tableDesc.profilePhoto) {
          await sequelize.query('ALTER TABLE `Users` ADD COLUMN `profilePhoto` VARCHAR(255) NULL;');
          console.log('Added column: profilePhoto');
      }
    }

    // Connect to Event Bus (non-blocking)
    connectEventBus().catch(err => console.warn('EventBus connect failed (non-fatal):', err.message));

    app.listen(PORT, () => {
      console.log(`auth-service running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    });
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    process.exit(1);
  }
};

startServer();


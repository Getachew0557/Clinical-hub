import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import sequelize, { ensureDatabaseExists } from './src/config/database.js';
import notificationRoutes from './src/routes/notificationRoutes.js';
import { connectEventBus, subscribeToEvent } from './src/utils/eventBus.js';
import { handleUserRegistered } from './src/utils/eventHandlers.js';

// Setup models
import './src/models/Notification.js';

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/notifications', notificationRoutes);

// Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({ service: 'notification-service', status: 'healthy' });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});

const PORT = process.env.PORT || 5008;

const startServer = async () => {
  try {
    await ensureDatabaseExists();
    await sequelize.authenticate();
    console.log('Database connected successfully.');

    await sequelize.sync({ alter: true });
    console.log('Database models synced.');

    // Connect to Event Bus & Subscribe
    await connectEventBus();
    subscribeToEvent('notification_service_registration', 'user.registered', handleUserRegistered);

    app.listen(PORT, () => {
      console.log(`notification-service running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    });
  } catch (error) {
    console.error('Unable to start notification-service:', error);
    process.exit(1);
  }
};

startServer();

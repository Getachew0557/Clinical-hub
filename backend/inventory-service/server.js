import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import sequelize, { ensureDatabaseExists } from './src/config/database.js';
import inventoryRoutes from './src/routes/inventoryRoutes.js';

// Setup models and associations
import './src/models/InventoryItem.js';
import './src/models/StockTransaction.js';

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/inventory', inventoryRoutes);

// Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({ service: 'inventory-service', status: 'healthy' });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});

const PORT = process.env.INV_PORT || 5006;

const startServer = async () => {
  try {
    await ensureDatabaseExists();
    await sequelize.authenticate();
    console.log('Database connected successfully.');

    await sequelize.sync({ alter: true });
    console.log('Database models synced.');

    app.listen(PORT, () => {
      console.log(`inventory-service running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    });
  } catch (error) {
    console.error('Unable to start inventory-service:', error);
    process.exit(1);
  }
};

startServer();


import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import sequelize, { ensureDatabaseExists } from './src/config/database.js';
import billingRoutes from './src/routes/billingRoutes.js';

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/billing', billingRoutes);

app.get('/api/health', (req, res) => {
  res.status(200).json({ service: 'billing-service', status: 'healthy' });
});

const PORT = process.env.PORT || 5005;

const startServer = async () => {
  try {
    await ensureDatabaseExists();
    await sequelize.authenticate();
    console.log('Database connected successfully.');

    await sequelize.sync({ alter: true });
    console.log('Database models synced.');

    app.listen(PORT, () => {
      console.log(`billing-service running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    process.exit(1);
  }
};

startServer();


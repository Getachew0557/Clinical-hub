import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import aiRoutes from './src/routes/aiRoutes.js';

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/ai', aiRoutes);

// Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    service: 'ai-service',
    status: 'healthy',
    model: process.env.MODEL_NAME
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});

const PORT = process.env.AI_PORT || 5009;

app.listen(PORT, () => {
  console.log(`ai-service running on port ${PORT}`);
});


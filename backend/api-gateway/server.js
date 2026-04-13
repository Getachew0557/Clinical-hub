import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import { createProxyMiddleware } from 'http-proxy-middleware';

const app = express();
app.use(cors());

// Proxy configuration
const services = {
  '/api/auth': process.env.AUTH_SERVICE_URL || 'http://localhost:5001',
  '/api/patients': process.env.PATIENT_SERVICE_URL || 'http://localhost:5002',
  '/api/appointments': process.env.APPOINTMENT_SERVICE_URL || 'http://localhost:5003',
  '/api/emr': process.env.EMR_SERVICE_URL || 'http://localhost:5004',
  '/api/billing': process.env.BILLING_SERVICE_URL || 'http://localhost:5005',
  '/api/inventory': process.env.INVENTORY_SERVICE_URL || 'http://localhost:5006',
  '/api/reports': process.env.REPORT_SERVICE_URL || 'http://localhost:5011',
  '/api/notifications': process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:5008',
  '/api/ai': process.env.AI_SERVICE_URL || 'http://localhost:5009',
  '/api/doctors': process.env.DOCTOR_SERVICE_URL || 'http://localhost:5010'
};

// Setup proxies
Object.entries(services).forEach(([path, target]) => {
  app.use(path, createProxyMiddleware({
    target,
    changeOrigin: true,
    pathRewrite: (pathStr, req) => req.originalUrl,
    onProxyReq: (proxyReq, req, res) => {
      // Log proxy requests for debugging
      console.log(`[Proxy] ${req.method} ${req.url} -> ${target}${proxyReq.path}`);
    },
    onError: (err, req, res) => {
      console.error(`[Proxy Error] ${err.message}`);
      res.status(502).json({ error: 'Bad Gateway', message: 'Service unavailable' });
    }
  }));
});

// Dedicated Signaling Proxy (Socket.IO)
// Forwards both polling and websocket upgrades to the notification service
app.use('/socket.io', createProxyMiddleware({
  target: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:5008',
  ws: true,
  changeOrigin: true,
  onProxyReq: (proxyReq, req) => {
    // Some Socket.IO clients might need this header
    proxyReq.setHeader('Access-Control-Allow-Origin', '*');
  }
}));

app.get('/api/health', (req, res) => {
  res.status(200).json({ service: 'api-gateway', status: 'healthy' });
});

const PORT = process.env.PORT || 5050;
app.listen(PORT, () => {
  console.log(`api-gateway running on port ${PORT}`);
});

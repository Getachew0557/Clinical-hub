import dotenv from 'dotenv';
dotenv.config();

import http from 'http';
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
  '/api/reports': process.env.REPORT_SERVICE_URL || 'http://localhost:5007',
  '/api/notifications': process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:5008',
  '/api/ai': process.env.AI_SERVICE_URL || 'http://localhost:5009',
  '/api/doctors': process.env.DOCTOR_SERVICE_URL || 'http://localhost:5010'
};

// Setup HTTP proxies
Object.entries(services).forEach(([path, target]) => {
  app.use(path, createProxyMiddleware({
    target,
    changeOrigin: true,
    pathRewrite: (pathStr, req) => req.originalUrl,
    onProxyReq: (proxyReq, req) => {
      console.log(`[Proxy] ${req.method} ${req.url} -> ${target}${proxyReq.path}`);
    },
    onError: (err, req, res) => {
      console.error(`[Proxy Error] ${err.message}`);
      res.status(502).json({ error: 'Bad Gateway', message: 'Service unavailable' });
    }
  }));
});

// Dedicated Socket.IO / WebSocket proxy — must use http.createServer + server.on('upgrade')
const socketProxy = createProxyMiddleware({
  target: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:5008',
  ws: true,
  changeOrigin: true,
  logLevel: 'warn',
});

app.use('/socket.io', socketProxy);

app.get('/api/health', (req, res) => {
  res.status(200).json({ service: 'api-gateway', status: 'healthy' });
});

const PORT = process.env.PORT || 5050;

// Use http.createServer so the 'upgrade' event fires for WebSocket proxying
const server = http.createServer(app);

// Wire WebSocket upgrades through the socket proxy
server.on('upgrade', socketProxy.upgrade);

server.listen(PORT, () => {
  console.log(`api-gateway running on port ${PORT}`);
});

import dotenv from 'dotenv';
dotenv.config();

import http from 'http';
import express from 'express';
import cors from 'cors';
import { createProxyMiddleware } from 'http-proxy-middleware';

const app = express();

// Allow all origins (Vercel frontend + any client)
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Proxy configuration — merged service routing
const services = {
  '/api/auth':          process.env.AUTH_SERVICE_URL        || 'http://localhost:5001',
  '/api/patients':      process.env.PATIENT_SERVICE_URL     || 'http://localhost:5002',
  '/api/appointments':  process.env.APPOINTMENT_SERVICE_URL || 'http://localhost:5003',
  '/api/emr':           process.env.PATIENT_SERVICE_URL     || 'http://localhost:5002',
  '/api/billing':       process.env.PATIENT_SERVICE_URL     || 'http://localhost:5002',
  '/api/inventory':     process.env.DOCTOR_SERVICE_URL      || 'http://localhost:5010',
  '/api/reports':       process.env.DOCTOR_SERVICE_URL      || 'http://localhost:5010',
  '/api/notifications': process.env.APPOINTMENT_SERVICE_URL || 'http://localhost:5003',
  '/api/ai':            process.env.AI_SERVICE_URL          || 'http://localhost:5009',
  '/api/doctors':       process.env.DOCTOR_SERVICE_URL      || 'http://localhost:5010',
};

// Setup HTTP proxies with longer timeout for cold starts
Object.entries(services).forEach(([path, target]) => {
  app.use(path, createProxyMiddleware({
    target,
    changeOrigin: true,
    pathRewrite: (pathStr, req) => req.originalUrl,
    proxyTimeout: 60000,   // 60s — Aiven SSL connection can be slow
    timeout: 60000,
    onProxyReq: (proxyReq, req) => {
      console.log(`[Proxy] ${req.method} ${req.originalUrl} -> ${target}`);
    },
    onError: (err, req, res) => {
      console.error(`[Proxy Error] ${req.originalUrl}: ${err.message}`);
      if (!res.headersSent) {
        res.status(503).json({
          error: 'Service Unavailable',
          message: 'The service is starting up, please retry in a moment.',
          path: req.originalUrl
        });
      }
    }
  }));
});

// Socket.IO proxy for video signaling (appointment-service)
const socketProxy = createProxyMiddleware({
  target: process.env.APPOINTMENT_SERVICE_URL || 'http://localhost:5003',
  ws: true,
  changeOrigin: true,
  proxyTimeout: 30000,
  logLevel: 'warn',
});

app.use('/socket.io', socketProxy);

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    service: 'api-gateway',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: Object.keys(services)
  });
});

// Root — API info
app.get('/', (req, res) => {
  res.status(200).json({
    name: 'Clinical Hub API',
    version: '1.0.0',
    status: 'running',
    docs: '/api/health',
    endpoints: [
      '/api/auth',
      '/api/patients',
      '/api/appointments',
      '/api/doctors',
      '/api/emr',
      '/api/billing',
      '/api/inventory',
      '/api/reports',
      '/api/notifications',
      '/api/ai'
    ]
  });
});

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found', path: req.originalUrl });
});

const PORT = process.env.PORT || 5050;
const server = http.createServer(app);
server.on('upgrade', socketProxy.upgrade);

server.listen(PORT, () => {
  console.log(`api-gateway running on port ${PORT}`);
});

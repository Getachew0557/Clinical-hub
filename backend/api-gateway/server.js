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
// NOTE: These env vars may include a path suffix (e.g. http://localhost:5002/api/patients)
// We extract just the base host for the proxy target, then use pathRewrite to forward
// the full original URL path. This handles both clean URLs and path-suffixed URLs.
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

// Extract base host (strip any path suffix from the URL)
function baseHost(url) {
  try {
    const u = new URL(url);
    return `${u.protocol}//${u.host}`;
  } catch {
    return url;
  }
}

// Setup HTTP proxies with longer timeout for cold starts
// IMPORTANT: Express strips the matched prefix before passing to middleware.
// e.g. app.use('/api/billing', ...) → proxy receives '/invoices' not '/api/billing/invoices'
// pathRewrite restores the full original path so downstream services receive the correct URL.
Object.entries(services).forEach(([mountPath, rawTarget]) => {
  const target = baseHost(rawTarget); // strip any path suffix from env var
  app.use(mountPath, createProxyMiddleware({
    target,
    changeOrigin: true,
    // Restore the full original URL path (Express strips the mount prefix)
    pathRewrite: (_path, req) => req.originalUrl,
    proxyTimeout: 120000,
    timeout: 120000,
    on: {
      error: (err, req, res) => {
        console.error(`[Proxy Error] ${req.originalUrl}: ${err.message}`);
        if (!res.headersSent) {
          res.status(503).json({
            error: 'Service Unavailable',
            message: 'The service is starting up, please retry in a moment.',
            path: req.originalUrl
          });
        }
      }
    }
  }));
});

// Socket.IO proxy for video signaling (appointment-service)
// Note: target must be the base URL only (no path suffix)
const APPT_BASE_URL = (process.env.APPOINTMENT_SERVICE_URL || 'http://localhost:5003')
  .replace(/\/api\/appointments.*$/, '');

const socketProxy = createProxyMiddleware({
  target: APPT_BASE_URL,
  ws: true,
  changeOrigin: true,
  proxyTimeout: 30000,
  logLevel: 'warn',
});

app.use('/socket.io', socketProxy);

const AUTH_BASE_URL = (process.env.AUTH_SERVICE_URL || 'http://localhost:5001').replace(/\/api\/auth.*$/, '');
const PATIENT_BASE_URL = (process.env.PATIENT_SERVICE_URL || 'http://localhost:5002').replace(/\/api\/patients.*$/, '');
const DOCTOR_BASE_URL = (process.env.DOCTOR_SERVICE_URL || 'http://localhost:5010').replace(/\/api\/doctors.*$/, '');

app.use('/uploads', createProxyMiddleware({
  target: APPT_BASE_URL, // Fallback
  changeOrigin: true,
  proxyTimeout: 30000,
  pathRewrite: (_path, req) => req.originalUrl,
  router: (req) => {
      const url = req.originalUrl || req.url;
      if (url.includes('/profile-') || url.includes('/auth-')) {
          return AUTH_BASE_URL;
      }
      if (url.includes('/emr-') || url.includes('/patient-')) {
          return PATIENT_BASE_URL;
      }
      if (url.includes('/doctor-')) {
          return DOCTOR_BASE_URL;
      }
      return APPT_BASE_URL;
  }
}));

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

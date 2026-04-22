import dotenv from 'dotenv';
dotenv.config();

import { EventEmitter } from 'events';
EventEmitter.defaultMaxListeners = 20;

import http from 'http';
import express from 'express';
import cors from 'cors';
import { Server as SocketIOServer } from 'socket.io';
import sequelize, { ensureDatabaseExists } from './src/config/database.js';

// Routes
import appointmentRoutes from './src/routes/appointmentRoutes.js';
import notificationRoutes from './src/routes/notificationRoutes.js';

// Models
import Appointment from './src/models/Appointment.js';
import './src/models/Notification.js';

// Event Bus
import { connectEventBus, subscribeToEvent, handleInternalEvent } from './src/utils/eventBus.js';
import { handleUserRegistered } from './src/utils/eventHandlers.js';

const app = express();
const httpServer = http.createServer(app);

// ─── Socket.IO Video Signaling ────────────────────────────────────────────
const io = new SocketIOServer(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

const videoNamespace = io.of('/video');

videoNamespace.on('connection', (socket) => {
  console.log(`[Video] Socket connected: ${socket.id}`);

  socket.on('join-room', ({ roomId }) => {
    const room = videoNamespace.adapter.rooms.get(roomId);
    const roomSize = room ? room.size : 0;
    if (roomSize >= 2) { socket.emit('room-full'); return; }
    socket.join(roomId);
    socket.to(roomId).emit('peer-joined');
    console.log(`[Video] ${socket.id} joined room ${roomId}`);
  });

  socket.on('offer', ({ roomId, offer }) => socket.to(roomId).emit('offer', offer));
  socket.on('answer', ({ roomId, answer }) => socket.to(roomId).emit('answer', answer));
  socket.on('ice-candidate', ({ roomId, candidate }) => socket.to(roomId).emit('ice-candidate', candidate));
  socket.on('media-state-changed', (data) => socket.to(data.roomId).emit('media-state-changed', data));
  socket.on('end-call', ({ roomId }) => {
    socket.to(roomId).emit('call-ended');
    console.log(`[Video] Call ended in room ${roomId}`);
  });
  socket.on('chat-message', ({ roomId, message, senderName, time }) => {
    socket.to(roomId).emit('chat-message', { message, senderName, time });
  });
  socket.on('disconnecting', () => {
    socket.rooms.forEach((room) => {
      if (room !== socket.id) socket.to(room).emit('peer-disconnected');
    });
  });
});

// ─── Middlewares ──────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// Self-reference for notification URL (merged service)
if (!process.env.NOTIFICATION_SERVICE_URL) {
  process.env.NOTIFICATION_SERVICE_URL = `http://localhost:${process.env.APPT_PORT || 5003}/api/notifications`;
}

// ─── Routes ───────────────────────────────────────────────────────────────
app.use('/api/appointments', appointmentRoutes);
app.use('/api/notifications', notificationRoutes);
app.post('/api/internal/events', async (req, res) => {
  await handleInternalEvent(req.body);
  res.sendStatus(200);
});

// ─── Health Check ─────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.status(200).json({ service: 'appointment-service', status: 'healthy' });
});

app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});

const PORT = process.env.APPT_PORT || 5003;

const connectDB = async () => {
  await ensureDatabaseExists();
  await sequelize.authenticate();
  console.log('Database connected successfully.');
  await sequelize.sync();
  console.log('Database models synced.');
  connectEventBus().catch(err => console.warn('EventBus (non-fatal):', err.message));
  subscribeToEvent('notification_service_registration', 'user.registered', handleUserRegistered);
  console.log('appointment-service fully ready.');
};

httpServer.listen(PORT, () => {
  console.log(`appointment-service (+ notification + video) running on port ${PORT}`);
  connectDB().catch(err => {
    console.error('DB failed, retrying in 15s:', err.message);
    setTimeout(() => connectDB().catch(console.error), 15000);
  });
});

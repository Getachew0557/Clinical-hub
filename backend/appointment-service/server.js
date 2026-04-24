import dotenv from 'dotenv';
dotenv.config();

import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import express from 'express';
import cors from 'cors';
import sequelize, { ensureDatabaseExists } from './src/config/database.js';
import appointmentRoutes from './src/routes/appointmentRoutes.js';
import notificationRoutes from './src/routes/notificationRoutes.js';
import Appointment from './src/models/Appointment.js';
import './src/models/Notification.js';

const app = express();
const server = http.createServer(app);

// ─── Socket.IO — Video Signaling ───────────────────────────────────────────
const io = new SocketIOServer(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
  path: '/socket.io',
});

// Track rooms: roomId → Set of socket IDs
const rooms = new Map();

const videoNs = io.of('/video');

videoNs.on('connection', (socket) => {
  console.log(`[Socket] Client connected: ${socket.id}`);

  socket.on('join-room', ({ roomId }) => {
    if (!roomId) return;

    const room = rooms.get(roomId) || new Set();

    if (room.size >= 2) {
      socket.emit('room-full');
      return;
    }

    room.add(socket.id);
    rooms.set(roomId, room);
    socket.join(roomId);
    socket.data.roomId = roomId;

    console.log(`[Socket] ${socket.id} joined room ${roomId} (${room.size}/2)`);

    // Notify the other peer that someone joined
    if (room.size === 2) {
      socket.to(roomId).emit('peer-joined');
    }
  });

  socket.on('offer', ({ roomId, offer }) => {
    socket.to(roomId).emit('offer', offer);
  });

  socket.on('answer', ({ roomId, answer }) => {
    socket.to(roomId).emit('answer', answer);
  });

  socket.on('ice-candidate', ({ roomId, candidate }) => {
    socket.to(roomId).emit('ice-candidate', candidate);
  });

  socket.on('media-state-changed', ({ roomId, isMuted, isCameraOff }) => {
    socket.to(roomId).emit('media-state-changed', { isMuted, isCameraOff });
  });

  socket.on('chat-message', ({ roomId, message, senderName, time }) => {
    socket.to(roomId).emit('chat-message', { message, senderName, time });
  });

  socket.on('end-call', ({ roomId }) => {
    socket.to(roomId).emit('call-ended');
  });

  socket.on('disconnect', () => {
    const roomId = socket.data.roomId;
    if (roomId) {
      const room = rooms.get(roomId);
      if (room) {
        room.delete(socket.id);
        if (room.size === 0) {
          rooms.delete(roomId);
        } else {
          socket.to(roomId).emit('peer-disconnected');
        }
      }
    }
    console.log(`[Socket] Client disconnected: ${socket.id}`);
  });
});

// ─── Middlewares ───────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ─── Routes ───────────────────────────────────────────────────────────────
app.use('/api/appointments', appointmentRoutes);
app.use('/api/notifications', notificationRoutes);

// ─── Health Check ─────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.status(200).json({ service: 'appointment-service', status: 'healthy' });
});

// ─── 404 handler ──────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});

// ─── Startup ──────────────────────────────────────────────────────────────
const PORT = process.env.APPT_PORT || 5003;

const connectDB = async () => {
  await ensureDatabaseExists();
  await sequelize.authenticate();
  console.log('Database connected successfully.');
  await sequelize.sync({ alter: true });
  console.log('Database models synced.');
  console.log('appointment-service fully ready.');
};

// Start HTTP+Socket.IO server FIRST so gateway can reach it immediately
server.listen(PORT, () => {
  console.log(`appointment-service + socket.io running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  connectDB().catch(err => {
    console.error('DB connection failed, retrying in 15s:', err.message);
    setTimeout(() => connectDB().catch(console.error), 15000);
  });
});

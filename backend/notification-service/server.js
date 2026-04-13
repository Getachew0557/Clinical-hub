import dotenv from 'dotenv';
dotenv.config();

import http from 'http';
import express from 'express';
import cors from 'cors';
import { Server as SocketIOServer } from 'socket.io';
import sequelize, { ensureDatabaseExists } from './src/config/database.js';
import notificationRoutes from './src/routes/notificationRoutes.js';
import { connectEventBus, subscribeToEvent } from './src/utils/eventBus.js';
import { handleUserRegistered } from './src/utils/eventHandlers.js';

// Setup models
import './src/models/Notification.js';

const app = express();
const httpServer = http.createServer(app);

// ─── Socket.IO Video Signaling ─────────────────────────────────────────────
const io = new SocketIOServer(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

const videoNamespace = io.of('/video');

videoNamespace.on('connection', (socket) => {
  console.log(`[Video] Socket connected: ${socket.id}`);

  socket.on('join-room', ({ roomId }) => {
    const room = videoNamespace.adapter.rooms.get(roomId);
    const roomSize = room ? room.size : 0;

    if (roomSize >= 2) {
      socket.emit('room-full');
      console.log(`[Video] Room ${roomId} is full — rejected ${socket.id}`);
      return;
    }

    socket.join(roomId);
    socket.to(roomId).emit('peer-joined');
    console.log(`[Video] ${socket.id} joined room ${roomId} (size: ${roomSize + 1})`);
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

  socket.on('end-call', ({ roomId }) => {
    socket.to(roomId).emit('call-ended');
    console.log(`[Video] Call ended in room ${roomId}`);
  });

  socket.on('chat-message', ({ roomId, message, senderName, time }) => {
    socket.to(roomId).emit('chat-message', { message, senderName, time });
  });

  socket.on('disconnecting', () => {
    socket.rooms.forEach((room) => {
      if (room !== socket.id) {
        socket.to(room).emit('peer-disconnected');
        console.log(`[Video] ${socket.id} disconnected from room ${room}`);
      }
    });
  });
});

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

    httpServer.listen(PORT, () => {
      console.log(`notification-service running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    });
  } catch (error) {
    console.error('Unable to start notification-service:', error);
    process.exit(1);
  }
};

startServer();

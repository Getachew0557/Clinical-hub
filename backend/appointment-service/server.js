import dotenv from 'dotenv';
dotenv.config();

import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cron from 'node-cron';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';
import moment from 'moment';
import { Op } from 'sequelize';
import sequelize, { ensureDatabaseExists } from './src/config/database.js';
import appointmentRoutes from './src/routes/appointmentRoutes.js';
import notificationRoutes from './src/routes/notificationRoutes.js';
import Appointment from './src/models/Appointment.js';
import './src/models/Notification.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

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
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors());
app.use(express.json());

// Serve uploaded appointment attachments
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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

  // Safe column additions (PostgreSQL syntax)
  const qi = sequelize.getQueryInterface();
  const cols = await qi.describeTable('Appointments').catch(() => ({}));
  if (!cols.patientName) {
    await sequelize.query('ALTER TABLE "Appointments" ADD COLUMN IF NOT EXISTS "patientName" VARCHAR(255) NULL;').catch(() => {});
    console.log('Added column: Appointments.patientName');
  }
  if (!cols.doctorName) {
    await sequelize.query('ALTER TABLE "Appointments" ADD COLUMN IF NOT EXISTS "doctorName" VARCHAR(255) NULL;').catch(() => {});
    console.log('Added column: Appointments.doctorName');
  }

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

// ─── Appointment Reminder Cron — runs every hour ──────────────────────────
cron.schedule('0 * * * *', async () => {
    try {
        const now = moment();
        const in24h = moment().add(24, 'hours');
        const in1h  = moment().add(1, 'hour');

        const upcoming = await Appointment.findAll({
            where: {
                status: { [Op.in]: ['Confirmed'] },
                appointmentDate: {
                    [Op.between]: [now.format('YYYY-MM-DD'), in24h.format('YYYY-MM-DD')]
                }
            }
        });

        const notifyUrl = process.env.NOTIFICATION_SERVICE_URL;
        if (!notifyUrl || upcoming.length === 0) return;

        for (const apt of upcoming) {
            const aptDateTime = moment(`${apt.appointmentDate} ${apt.appointmentTime}`, 'YYYY-MM-DD HH:mm:ss');
            const hoursUntil = aptDateTime.diff(now, 'hours');

            // Send 24h reminder
            if (hoursUntil >= 23 && hoursUntil <= 25) {
                const isVideo = apt.type === 'video';
                const internalUrl = notifyUrl.replace(/\/api\/notifications$/, '/api/notifications/internal');
                await axios.post(internalUrl, {
                    userId: apt.patientId,
                    title: `Reminder: ${isVideo ? 'Video Consultation' : 'Clinic Appointment'} Tomorrow`,
                    message: `You have an appointment with Dr. ${apt.doctorName || 'your doctor'} tomorrow at ${apt.appointmentTime?.slice(0,5)}. ${isVideo ? 'Make sure your camera and microphone are ready.' : 'Please arrive 10 minutes early.'}`,
                    type: 'Info',
                    link: isVideo ? `/video-consultations` : '/appointments'
                }).catch(() => {});
            }

            // Send 1h reminder
            if (hoursUntil >= 0 && hoursUntil <= 2) {
                const isVideo = apt.type === 'video';
                const internalUrl = notifyUrl.replace(/\/api\/notifications$/, '/api/notifications/internal');
                await axios.post(internalUrl, {
                    userId: apt.patientId,
                    title: `Starting Soon: ${isVideo ? 'Video Consultation' : 'Appointment'} in ~1 Hour`,
                    message: `Your appointment with Dr. ${apt.doctorName || 'your doctor'} starts at ${apt.appointmentTime?.slice(0,5)} today. ${isVideo ? 'Click to join your video session.' : 'Please head to the clinic.'}`,
                    type: 'Warning',
                    link: isVideo ? `/video/${apt.id}` : '/appointments'
                }).catch(() => {});
            }
        }
        console.log(`[Cron] Appointment reminders processed: ${upcoming.length} appointments checked`);
    } catch (err) {
        console.error('[Cron] Reminder error:', err.message);
    }
});

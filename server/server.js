import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import jwt from 'jsonwebtoken';
import http from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';

import Room from './models/Room.js';
import Message from './models/Message.js';
import User from './models/User.js';
import roomRoutes from './routes/rooms.js';
import authRoutes from './routes/auth.js';
import { predefinedRooms } from './data/rooms.js';
import { isObjectId } from './utils/validate.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Fail fast on missing config instead of limping along with a broken server.
for (const key of ['MONGO_URI', 'JWT_SECRET']) {
  if (!process.env[key]) {
    console.error(`Missing required environment variable: ${key}`);
    process.exit(1);
  }
}

const IS_PROD = process.env.NODE_ENV === 'production';

// A weak or placeholder secret lets anyone forge login tokens.
if (IS_PROD && (process.env.JWT_SECRET.length < 32 || /change-me/i.test(process.env.JWT_SECRET))) {
  console.error('JWT_SECRET is too weak for production (use 32+ random characters).');
  process.exit(1);
}

// Cross-origin access. In production the server also serves the client, so the
// default is same-origin only; set CORS_ORIGIN to allow a separate frontend.
// In development, default to any origin so the Vite dev server can connect.
const CORS_ORIGIN = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
  : (IS_PROD ? false : '*');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: CORS_ORIGIN } });

// Set TRUST_PROXY=1 when running behind a reverse proxy so rate limiting sees real client IPs.
if (process.env.TRUST_PROXY) app.set('trust proxy', Number(process.env.TRUST_PROXY) || 1);

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      // Fonts come from Google Fonts, avatars from ui-avatars.com.
      'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      'font-src': ["'self'", 'https://fonts.gstatic.com'],
      'img-src': ["'self'", 'data:', 'https://ui-avatars.com'],
      'connect-src': ["'self'", ...(Array.isArray(CORS_ORIGIN) ? CORS_ORIGIN : [])],
      // Only force HTTPS sub-resources in production (breaks plain-http localhost).
      'upgrade-insecure-requests': IS_PROD ? [] : null
    }
  }
}));
app.use(compression());
app.use(cors({ origin: CORS_ORIGIN }));
app.use(express.json({ limit: '10kb' }));
app.use('/api', rateLimit({ windowMs: 60 * 1000, limit: 300, standardHeaders: true, legacyHeaders: false }));

// Health check for the hosting platform: 200 only when the database is connected.
app.get('/api/health', (req, res) => {
  const dbUp = mongoose.connection.readyState === 1;
  res.status(dbUp ? 200 : 503).json({ status: dbUp ? 'ok' : 'degraded', db: dbUp ? 'up' : 'down' });
});

// Routes
app.use('/api/rooms', roomRoutes);
app.use('/api/auth', authRoutes);

// Static Front-end serving (Monolith support).
// Vite fingerprints files in /assets, so they can be cached forever;
// everything else (index.html, icons) must be revalidated so deploys show up.
const clientDistPath = path.join(__dirname, '../client/dist');
app.use('/assets', express.static(path.join(clientDistPath, 'assets'), { immutable: true, maxAge: '1y' }));
app.use(express.static(clientDistPath, { index: false, maxAge: 0 }));

// Unknown API routes should 404 as JSON, not fall through to the SPA.
app.use('/api', (req, res) => res.status(404).json({ message: 'Not found' }));

// Catch-all for Express 5: everything except /api serves the SPA.
app.get(/^(?!\/api).*/, (req, res) => {
  const indexPath = path.join(clientDistPath, 'index.html');

  res.sendFile(indexPath, { headers: { 'Cache-Control': 'no-cache' } }, (err) => {
    if (err) {
      console.error('Catch-all error: Could not serve index.html. Is the frontend built?');
      res.status(404).send('Not Found: The application frontend is not built. Please run "npm run build" in the client directory.');
    }
  });
});

// Error handler (bad JSON bodies, etc.)
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed' || err.type === 'entity.too.large') {
    return res.status(err.status || 400).json({ message: 'Invalid request body' });
  }
  console.error(err);
  res.status(500).json({ message: 'Server error' });
});

async function seedRooms() {
  // Upsert by name so rooms added to the list later reach existing databases too.
  const result = await Room.bulkWrite(
    predefinedRooms.map((room) => ({
      updateOne: { filter: { name: room.name }, update: { $setOnInsert: room }, upsert: true }
    }))
  );
  if (result.upsertedCount) console.log(`Seeded ${result.upsertedCount} room(s)`);
}

// ---------- Presence ----------
// roomId -> Map(userId -> { name, sockets: Set<socketId> }). Counts distinct users,
// so multiple tabs or a reconnect never inflate the number.
const presence = new Map();

function roomSnapshot(roomId) {
  const users = presence.get(roomId);
  return {
    users: users ? [...users].map(([id, u]) => ({ id, name: u.name })) : [],
    activeCount: users ? users.size : 0
  };
}

async function broadcastRoomData(roomId) {
  const snapshot = roomSnapshot(roomId);
  io.to(roomId).emit('roomData', snapshot);
  try {
    await Room.updateOne({ _id: roomId }, { activeUsersCount: snapshot.activeCount });
  } catch (err) {
    console.error('Failed to persist active user count', err);
  }
}

async function leaveRoom(socket) {
  const roomId = socket.data.roomId;
  if (!roomId) return;
  socket.data.roomId = null;
  socket.leave(roomId);

  const { id, name } = socket.data.user;
  const users = presence.get(roomId);
  const entry = users?.get(id);
  if (entry) {
    entry.sockets.delete(socket.id);
    if (entry.sockets.size === 0) {
      users.delete(id);
      if (users.size === 0) presence.delete(roomId);
      io.to(roomId).emit('message', { type: 'system', text: `${name} left the room`, createdAt: new Date() });
    }
  }
  await broadcastRoomData(roomId);
}

// ---------- Socket auth ----------
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Unauthorized'));

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.user.id).select('name');
    if (!user) return next(new Error('Unauthorized'));

    // Identity comes from the verified token, never from client-sent fields.
    socket.data.user = { id: user.id, name: user.name };
    next();
  } catch (err) {
    next(new Error('Unauthorized'));
  }
});

const MAX_MESSAGE_LENGTH = 2000;
const RATE_WINDOW_MS = 5000;
const RATE_MAX_MESSAGES = 8;

io.on('connection', (socket) => {
  socket.data.roomId = null;
  socket.data.sentAt = [];

  socket.on('joinRoom', async (payload) => {
    const roomId = payload?.roomId;
    if (!isObjectId(roomId)) return socket.emit('joinError', 'Invalid room');

    try {
      if (!(await Room.exists({ _id: roomId }))) return socket.emit('joinError', 'Room not found');
      if (socket.disconnected) return;
      if (socket.data.roomId === roomId) return broadcastRoomData(roomId);
      await leaveRoom(socket);

      const { id, name } = socket.data.user;
      socket.join(roomId);
      socket.data.roomId = roomId;

      if (!presence.has(roomId)) presence.set(roomId, new Map());
      const users = presence.get(roomId);
      const isNewUser = !users.has(id);
      if (isNewUser) users.set(id, { name, sockets: new Set() });
      users.get(id).sockets.add(socket.id);

      if (isNewUser) {
        io.to(roomId).emit('message', { type: 'system', text: `${name} joined the room`, createdAt: new Date() });
      }
      await broadcastRoomData(roomId);
    } catch (err) {
      console.error(err);
      socket.emit('joinError', 'Could not join room');
    }
  });

  socket.on('chatMessage', async (payload) => {
    const roomId = socket.data.roomId;
    if (!roomId) return socket.emit('messageError', 'Join a room first');

    const text = typeof payload?.text === 'string' ? payload.text.trim() : '';
    if (!text) return;
    if (text.length > MAX_MESSAGE_LENGTH) {
      return socket.emit('messageError', `Message too long (max ${MAX_MESSAGE_LENGTH} characters)`);
    }

    const now = Date.now();
    socket.data.sentAt = socket.data.sentAt.filter((t) => now - t < RATE_WINDOW_MS);
    if (socket.data.sentAt.length >= RATE_MAX_MESSAGES) {
      return socket.emit('messageError', 'You are sending messages too fast');
    }
    socket.data.sentAt.push(now);

    try {
      const { id, name } = socket.data.user;
      const message = await Message.create({ room: roomId, sender: id, text });
      io.to(roomId).emit('message', {
        _id: message._id,
        type: 'user',
        sender: { _id: id, name },
        text: message.text,
        createdAt: message.createdAt
      });
    } catch (err) {
      console.error(err);
      socket.emit('messageError', 'Message could not be sent');
    }
  });

  socket.on('disconnect', () => {
    leaveRoom(socket).catch((err) => console.error(err));
  });
});

// ---------- Startup ----------
const PORT = process.env.PORT || 5000;

try {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('MongoDB connected');
  await seedRooms();
  // Nobody is connected after a restart; clear counts left over from the last run.
  await Room.updateMany({}, { activeUsersCount: 0 });
  server.listen(PORT, () => console.log(`Server started on port ${PORT}`));
} catch (err) {
  console.error('Startup failed:', err.message);
  process.exit(1);
}

// Graceful shutdown: hosts send SIGTERM on redeploy. Stop accepting connections,
// close sockets and the DB, then exit (forced after 10s).
let shuttingDown = false;
for (const signal of ['SIGTERM', 'SIGINT']) {
  process.on(signal, () => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`${signal} received, shutting down`);
    setTimeout(() => process.exit(1), 10_000).unref();
    io.close();
    server.close(async () => {
      await mongoose.disconnect();
      process.exit(0);
    });
  });
}

import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

import { connectMongoDB } from './db/mongodb.js';
import prisma from './db/prisma.js';
import { ChatMessage } from './models/ChatMessage.js';
import { SecurityLog } from './models/SecurityLog.js';

// Route Imports
import authRoutes from './routes/authRoutes.js';
import taskRoutes from './routes/taskRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

// Middleware Imports
import { errorHandler } from './middleware/errorHandler.js';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});

const PORT = process.env.PORT || 5000;

// Security Middlewares
app.use(
  helmet({
    crossOriginResourcePolicy: false, // Essential to allow frontend to fetch uploaded files (e.g. avatars)
  })
);

// CORS Config
app.use(
  cors({
    origin: true, // Echo origin
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(process.cwd(), 'public/uploads')));

// Rate Limiting (Day 47-48 requirement)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  handler: async (req, res) => {
    // Log rate limit alerts in SecurityLog (MongoDB)
    try {
      await SecurityLog.create({
        eventType: 'RATE_LIMIT_ALERT',
        ip: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1',
        details: `IP breached API rate limit. Requested URL: ${req.originalUrl}`,
      });
    } catch (logError) {
      console.error('Failed to log rate limit to MongoDB:', logError);
    }

    res.status(429).json({
      status: 'error',
      message: 'Too many requests from this IP. Please try again after 15 minutes.',
    });
  },
});

app.use('/api', apiLimiter);

// Inject WebSocket server into requests for routing broadcasts
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Register routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/admin', adminRoutes);

// Root greeting
app.get('/', (req, res) => {
  res.json({
    message: 'Month 2 Full-Stack Integration API is active and running',
    version: '1.0.0',
  });
});

// Centralized error handling
app.use(errorHandler);

// Socket.io WebSockets management (Day 45-46 requirement)
const onlineUsers = new Map(); // socket.id -> user profile info

// WebSocket Auth Middleware
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token || socket.handshake.headers.token;
    if (!token) {
      return next(new Error('Authentication failed: Missing token'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretjwtkeyforlocaldevelopmentonly');
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        role: true,
      },
    });

    if (!user) {
      return next(new Error('Authentication failed: User not found'));
    }

    socket.user = user;
    next();
  } catch (err) {
    return next(new Error('Authentication failed: Invalid token'));
  }
});

io.on('connection', (socket) => {
  console.log(`WebSocket client connected: ${socket.user.name} (${socket.id})`);

  // Add user to online list
  // Note: if user opens multiple tabs, we deduplicate by user ID on client or track socket IDs.
  onlineUsers.set(socket.id, {
    socketId: socket.id,
    id: socket.user.id,
    name: socket.user.name,
    avatarUrl: socket.user.avatarUrl,
    role: socket.user.role,
  });

  // Send the updated online list to all clients
  io.emit('online_users', Array.from(onlineUsers.values()));

  // Listen for chat messages (Day 45-46 Websockets & Day 42 MongoDB Mongoose integration)
  socket.on('chat_message', async (content) => {
    try {
      if (!content || typeof content !== 'string' || content.trim() === '') return;

      // Save to MongoDB
      const savedMessage = await ChatMessage.create({
        senderId: socket.user.id,
        senderName: socket.user.name,
        senderAvatarUrl: socket.user.avatarUrl,
        content: content.trim(),
      });

      // Broadcast chat message
      io.emit('chat_message', savedMessage);
    } catch (err) {
      console.error('Error saving and broadcasting chat message:', err);
    }
  });

  // Handle client disconnection
  socket.on('disconnect', () => {
    console.log(`WebSocket client disconnected: ${socket.user.name} (${socket.id})`);
    onlineUsers.delete(socket.id);
    io.emit('online_users', Array.from(onlineUsers.values()));
  });
});

// Setup server lifecycle
const bootstrap = async () => {
  try {
    // Connect document database (MongoDB Memory Server fallbacked)
    await connectMongoDB();

    // Start HTTP and WS server
    server.listen(PORT, () => {
      console.log(`[Workspace API] Listening on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Bootstrap failed:', error);
    process.exit(1);
  }
};

bootstrap();

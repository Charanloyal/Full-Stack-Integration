import express, { Request, Response, NextFunction } from 'express';
import http from 'http';
import { Server, Socket } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';

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
    crossOriginResourcePolicy: false,
  })
);

// CORS Config
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(process.cwd(), 'public/uploads')));

// Rate Limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  handler: async (req: Request, res: Response) => {
    try {
      const remoteIp = req.ip || req.socket.remoteAddress || '127.0.0.1';
      if (mongoose.connection.readyState === 1) {
        await SecurityLog.create({
          eventType: 'RATE_LIMIT_ALERT',
          ip: remoteIp,
          details: `IP breached API rate limit. Requested URL: ${req.originalUrl}`,
        });
      } else {
        console.warn('[Mongoose] Skipping rate limit logging: MongoDB is not connected');
      }
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
app.use((req: Request, res: Response, next: NextFunction) => {
  req.io = io;
  next();
});

// Register routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/admin', adminRoutes);

// Serve static client assets in production
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientDistPath = path.join(__dirname, '../../frontend/dist');

app.use(express.static(clientDistPath));

// Fallback all SPA routes to index.html (excluding /api)
app.get('*', (req: Request, res: Response, next: NextFunction) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
    return next();
  }
  res.sendFile(path.join(clientDistPath, 'index.html'));
});

// Centralized error handling
app.use(errorHandler);

// Socket.io WebSockets management
interface SocketWithUser extends Socket {
  user?: {
    id: string;
    name: string;
    email: string;
    avatarUrl: string | null;
    role: string;
  };
}

const onlineUsers = new Map<string, any>(); // socket.id -> user profile info

io.use(async (socket: SocketWithUser, next) => {
  try {
    const token = (socket.handshake.auth.token || socket.handshake.headers.token) as string | undefined;
    if (!token) {
      return next(new Error('Authentication failed: Missing token'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretjwtkeyforlocaldevelopmentonly') as { id: string };
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

io.on('connection', (socket: SocketWithUser) => {
  if (!socket.user) return;
  console.log(`WebSocket client connected: ${socket.user.name} (${socket.id})`);

  onlineUsers.set(socket.id, {
    socketId: socket.id,
    id: socket.user.id,
    name: socket.user.name,
    avatarUrl: socket.user.avatarUrl,
    role: socket.user.role,
  });

  io.emit('online_users', Array.from(onlineUsers.values()));

  socket.on('chat_message', async (content: string) => {
    try {
      if (!socket.user || !content || typeof content !== 'string' || content.trim() === '') return;

      if (mongoose.connection.readyState !== 1) {
        console.warn('[Mongoose] Skipping ChatMessage save: MongoDB is not connected');
        const temporaryMessage = {
          senderId: socket.user.id,
          senderName: socket.user.name,
          senderAvatarUrl: socket.user.avatarUrl,
          content: content.trim(),
          createdAt: new Date().toISOString(),
        };
        io.emit('chat_message', temporaryMessage);
        return;
      }

      const savedMessage = await ChatMessage.create({
        senderId: socket.user.id,
        senderName: socket.user.name,
        senderAvatarUrl: socket.user.avatarUrl,
        content: content.trim(),
        attachmentUrl: null,
      });

      io.emit('chat_message', savedMessage);
    } catch (err) {
      console.error('Error saving and broadcasting chat message:', err);
    }
  });

  socket.on('disconnect', () => {
    if (!socket.user) return;
    console.log(`WebSocket client disconnected: ${socket.user.name} (${socket.id})`);
    onlineUsers.delete(socket.id);
    io.emit('online_users', Array.from(onlineUsers.values()));
  });
});

const bootstrap = async () => {
  try {
    await connectMongoDB();

    server.listen(PORT, () => {
      console.log(`[Workspace API] Listening on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Bootstrap failed:', error);
    process.exit(1);
  }
};

bootstrap();

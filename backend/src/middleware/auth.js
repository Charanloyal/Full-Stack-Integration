import jwt from 'jsonwebtoken';
import prisma from '../db/prisma.js';
import { SecurityLog } from '../models/SecurityLog.js';

export const authenticate = async (req, res, next) => {
  try {
    let token = null;

    // Check authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }
    // Check cookies (if parsed by cookie-parser, otherwise we can manually extract from req.headers.cookie)
    else if (req.headers.cookie) {
      const tokenCookie = req.headers.cookie
        .split(';')
        .find((c) => c.trim().startsWith('token='));
      if (tokenCookie) {
        token = tokenCookie.split('=')[1];
      }
    }

    if (!token) {
      return res.status(401).json({ status: 'error', message: 'Authentication required. Please login.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretjwtkeyforlocaldevelopmentonly');
    
    // Fetch user from relational DB
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatarUrl: true,
      },
    });

    if (!user) {
      return res.status(401).json({ status: 'error', message: 'User no longer exists.' });
    }

    req.user = user;
    next();
  } catch (error) {
    // Log auth failure
    try {
      await SecurityLog.create({
        eventType: 'AUTH_FAILURE',
        ip: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1',
        details: `Failed JWT Authentication: ${error.message}`,
      });
    } catch (logError) {
      console.error('Failed to log auth failure:', logError);
    }

    return res.status(401).json({ status: 'error', message: 'Invalid or expired authentication token. Please login again.' });
  }
};

export const authorize = (roles = []) => {
  if (typeof roles === 'string') {
    roles = [roles];
  }

  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ status: 'error', message: 'Authentication required.' });
    }

    if (roles.length && !roles.includes(req.user.role)) {
      // Log unauthorized access attempt
      try {
        await SecurityLog.create({
          eventType: 'UNAUTHORIZED_ACCESS',
          ip: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1',
          details: `User ${req.user.email} (Role: ${req.user.role}) attempted to access resource requiring roles: [${roles.join(', ')}]`,
          userId: req.user.id,
        });
      } catch (logError) {
        console.error('Failed to log unauthorized access:', logError);
      }

      return res.status(403).json({
        status: 'error',
        message: 'Forbidden. You do not have permission to perform this action.',
      });
    }

    next();
  };
};

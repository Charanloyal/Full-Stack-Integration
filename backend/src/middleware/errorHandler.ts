import { Request, Response, NextFunction } from 'express';
import { SecurityLog } from '../models/SecurityLog.js';

export const errorHandler = async (err: any, req: Request, res: Response, _next: NextFunction) => {
  console.error('[Error Handler]:', err);

  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  if (status === 500) {
    try {
      const remoteIp = req.ip || req.socket.remoteAddress || '127.0.0.1';
      await SecurityLog.create({
        eventType: 'SERVER_ERROR',
        ip: remoteIp,
        details: `Unhandled internal server error: ${err.message}\nStack: ${err.stack}`,
        userId: req.user ? req.user.id : null,
      });
    } catch (logError) {
      console.error('Failed to log server error to SecurityLog:', logError);
    }
  }

  return res.status(status).json({
    status: 'error',
    message,
    errors: err.errors || undefined,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
};

import { SecurityLog } from '../models/SecurityLog.js';

export const errorHandler = async (err, req, res, next) => {
  console.error('[Error Handler]:', err);

  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  // Log internal server errors to SecurityLog
  if (status === 500) {
    try {
      await SecurityLog.create({
        eventType: 'SERVER_ERROR',
        ip: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1',
        details: `Unhandled internal server error: ${err.message}\nStack: ${err.stack}`,
        userId: req.user ? req.user.id : null,
      });
    } catch (logError) {
      console.error('Failed to log server error to SecurityLog:', logError);
    }
  }

  res.status(status).json({
    status: 'error',
    message,
    errors: err.errors || undefined,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
};

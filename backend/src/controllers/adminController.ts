import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { SecurityLog } from '../models/SecurityLog.js';

export const getSecurityLogs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      console.warn('[Mongoose] Skipping getSecurityLogs: MongoDB is not connected');
      return res.status(200).json({
        status: 'success',
        logs: [],
      });
    }

    const logs = await SecurityLog.find()
      .sort({ createdAt: -1 })
      .limit(100);

    return res.status(200).json({
      status: 'success',
      logs,
    });
  } catch (error) {
    next(error);
  }
};

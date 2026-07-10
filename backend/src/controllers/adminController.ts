import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { SecurityLog } from '../models/SecurityLog.js';
import { getLocalLogs } from '../services/jsonDbService.js';

export const getSecurityLogs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      console.warn('[Mongoose] Offline: loading SecurityLogs from local JSON backup');
      const logs = await getLocalLogs();
      return res.status(200).json({
        status: 'success',
        logs: [...logs].reverse(),
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

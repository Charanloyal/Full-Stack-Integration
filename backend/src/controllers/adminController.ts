import { Request, Response, NextFunction } from 'express';
import { SecurityLog } from '../models/SecurityLog.js';

export const getSecurityLogs = async (req: Request, res: Response, next: NextFunction) => {
  try {
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

import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { ChatMessage } from '../models/ChatMessage.js';

export const getChatMessages = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      console.warn('[Mongoose] Skipping getChatMessages: MongoDB is not connected');
      return res.status(200).json({
        status: 'success',
        messages: [],
      });
    }

    const messages = await ChatMessage.find()
      .sort({ createdAt: -1 })
      .limit(50);
    
    return res.status(200).json({
      status: 'success',
      messages: messages.reverse(),
    });
  } catch (error) {
    next(error);
  }
};

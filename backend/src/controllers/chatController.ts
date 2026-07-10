import { Request, Response, NextFunction } from 'express';
import { ChatMessage } from '../models/ChatMessage.js';

export const getChatMessages = async (req: Request, res: Response, next: NextFunction) => {
  try {
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

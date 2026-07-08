import { ChatMessage } from '../models/ChatMessage.js';

export const getChatMessages = async (req, res, next) => {
  try {
    // Load last 50 messages from MongoDB
    const messages = await ChatMessage.find()
      .sort({ createdAt: -1 })
      .limit(50);
    
    // Return them in ascending chronological order
    return res.status(200).json({
      status: 'success',
      messages: messages.reverse(),
    });
  } catch (error) {
    next(error);
  }
};

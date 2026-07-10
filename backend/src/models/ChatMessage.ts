import mongoose, { Document, Schema } from 'mongoose';

export interface IChatMessage extends Document {
  senderId: string;
  senderName: string;
  senderAvatarUrl: string | null;
  content: string;
  attachmentUrl: string | null;
  createdAt: Date;
}

const chatMessageSchema = new Schema<IChatMessage>({
  senderId: {
    type: String,
    required: true,
  },
  senderName: {
    type: String,
    required: true,
  },
  senderAvatarUrl: {
    type: String,
    default: null,
  },
  content: {
    type: String,
    required: true,
  },
  attachmentUrl: {
    type: String,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export const ChatMessage = mongoose.model<IChatMessage>('ChatMessage', chatMessageSchema);

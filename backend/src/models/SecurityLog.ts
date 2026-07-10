import mongoose, { Document, Schema } from 'mongoose';

export interface ISecurityLog extends Document {
  eventType: string;
  ip: string;
  details: string;
  userId: string | null;
  createdAt: Date;
}

const securityLogSchema = new Schema<ISecurityLog>({
  eventType: {
    type: String,
    required: true,
  },
  ip: {
    type: String,
    required: true,
  },
  details: {
    type: String,
    required: true,
  },
  userId: {
    type: String,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export const SecurityLog = mongoose.model<ISecurityLog>('SecurityLog', securityLogSchema);

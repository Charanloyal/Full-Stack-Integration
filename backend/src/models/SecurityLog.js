import mongoose from 'mongoose';

const securityLogSchema = new mongoose.Schema({
  eventType: {
    type: String,
    required: true, // e.g. "AUTH_FAILURE", "RATE_LIMIT_ALERT", "UNAUTHORIZED_ACCESS", "FILE_UPLOAD"
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

export const SecurityLog = mongoose.model('SecurityLog', securityLogSchema);

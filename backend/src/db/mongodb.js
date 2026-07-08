import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongod = null;

export const connectMongoDB = async () => {
  try {
    let mongoUri = process.env.MONGO_URI;

    // If NODE_ENV is development and we want zero-setup, we spin up mongodb-memory-server
    if (process.env.NODE_ENV === 'development') {
      try {
        console.log('Starting in-memory MongoDB Server for zero-setup development...');
        mongod = await MongoMemoryServer.create();
        mongoUri = mongod.getUri();
        console.log(`In-memory MongoDB Server started at: ${mongoUri}`);
      } catch (memError) {
        console.warn('Failed to start in-memory MongoDB, attempting to connect to local/configured MongoDB instance.', memError.message);
      }
    }

    if (!mongoUri) {
      mongoUri = 'mongodb://127.0.0.1:27017/month2_chat';
    }

    await mongoose.connect(mongoUri);
    console.log(`MongoDB connected successfully to: ${mongoUri}`);
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    // Do not crash the application, but log it clearly
  }
};

export const closeMongoDB = async () => {
  try {
    await mongoose.disconnect();
    if (mongod) {
      await mongod.stop();
    }
  } catch (error) {
    console.error('Error closing MongoDB:', error);
  }
};

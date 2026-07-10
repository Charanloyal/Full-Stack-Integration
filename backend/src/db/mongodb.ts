import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongod: MongoMemoryServer | null = null;

export const connectMongoDB = async (): Promise<void> => {
  try {
    let mongoUri = process.env.MONGO_URI;

    if (process.env.NODE_ENV === 'development') {
      try {
        console.log('Starting in-memory MongoDB Server for zero-setup development...');
        mongod = await MongoMemoryServer.create();
        mongoUri = mongod.getUri();
        console.log(`In-memory MongoDB Server started at: ${mongoUri}`);
      } catch (memError: any) {
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
  }
};

export const closeMongoDB = async (): Promise<void> => {
  try {
    await mongoose.disconnect();
    if (mongod) {
      await mongod.stop();
    }
  } catch (error) {
    console.error('Error closing MongoDB:', error);
  }
};

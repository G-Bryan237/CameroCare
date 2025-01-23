// lib/mongodb.ts
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable');
}

let isConnected = false; // Track the connection status

async function dbConnect() {
  if (isConnected) {
    return;
  }

  try {
    const opts = {
      bufferCommands: false,
    };

    await mongoose.connect(MONGODB_URI, opts);
    isConnected = true;

    const connection = mongoose.connection;

    connection.on('connected', () => {
      console.log('MongoDB connected successfully');
    });

    connection.on('error', (err) => {
      console.log('MongoDB connection error. Please make sure MongoDB is running. ' + err);
    });

  } catch (error) {
    console.log('Error connecting to MongoDB:', error);
  }
}

export default dbConnect;
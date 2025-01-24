// lib/mongodb.ts
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI!;

// Ensure the MongoDB URI is defined
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

    // Check if we already have a connection
    if (mongoose.connections[0].readyState) {
      isConnected = true;
      return;
    }

    // Connect to the MongoDB URI with Mongoose
    await mongoose.connect(MONGODB_URI, opts);
    isConnected = true;

    const connection = mongoose.connection;

    // Log successful connection
    connection.on('connected', () => {
      console.log('MongoDB connected successfully');
    });

    // Log connection errors
    connection.on('error', (err) => {
      console.error('MongoDB connection error. Please make sure MongoDB is running. ' + err);
    });

  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    throw new Error('MongoDB connection failed');
  }
}

export default dbConnect;
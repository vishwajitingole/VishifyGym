import mongoose from 'mongoose';

let connectionPromise = null;

export function connectDatabase() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    connectionPromise = null;
    return Promise.reject(new Error('Database connection string missing: set MONGODB_URI in Vercel → Settings → Environment Variables, then redeploy.'));
  }
  if (!connectionPromise) {
    connectionPromise = mongoose
      .connect(uri, { serverSelectionTimeoutMS: 10000, connectTimeoutMS: 10000 })
      .then(() => {
        console.log(`MongoDB connected: ${mongoose.connection.host}`);
        return mongoose.connection;
      })
      .catch((error) => {
        connectionPromise = null;
        mongoose.connection.close().catch(() => {});
        throw error;
      });
  }
  return connectionPromise;
}
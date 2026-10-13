import mongoose from 'mongoose';

export const connectDB = async (): Promise<void> => {
  try {
    const connStr = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/resume_ai';
    const conn = await mongoose.connect(connStr);
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}`);
    try {
      await mongoose.connection.collection('skillevidences').dropIndex('candidateId_1_skill_1');
    } catch {
      // index already dropped or not present
    }
  } catch (error) {
    console.error('[Database Error] Failed to connect to MongoDB:', error);
    process.exit(1);
  }
};

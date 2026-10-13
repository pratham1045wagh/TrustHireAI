import dotenv from 'dotenv';
import path from 'path';

// Load environment variables before anything else
dotenv.config({ path: path.join(__dirname, '../.env') });

import app from './app';
import { connectDB } from './config/db';
import { seedDemoUsers } from './utils/seed';

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  await connectDB();
  await seedDemoUsers();
  app.listen(PORT, () => {
    console.log(`[ResumeAI Server] Server running in ${process.env.NODE_ENV || 'development'} mode on http://localhost:${PORT}`);
  });
};

startServer();

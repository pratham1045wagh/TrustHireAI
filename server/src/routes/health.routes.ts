import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  const apiKey = process.env.GEMINI_API_KEY;
  const aiStatus =
    apiKey && apiKey !== 'replace_with_your_gemini_api_key' && apiKey !== 'your_gemini_api_key_here'
      ? 'configured'
      : 'unconfigured';

  res.status(200).json({
    status: 'ok',
    database: dbStatus,
    ai: aiStatus,
  });
});

export default router;

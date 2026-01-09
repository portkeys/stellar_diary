import type { VercelRequest, VercelResponse } from '@vercel/node';
import express from 'express';
import serverless from 'serverless-http';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Test endpoint
app.get('/api/test', (_req, res) => {
  res.json({ test: 'express works' });
});

const handler = serverless(app);

export default async function (req: VercelRequest, res: VercelResponse) {
  return handler(req, res);
}

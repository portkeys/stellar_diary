import type { VercelRequest, VercelResponse } from '@vercel/node';
import express from 'express';
import serverless from 'serverless-http';

const app = express();
app.use(express.json());

// Health check - no database or complex imports
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), bundled: true });
});

app.get('/api/test', (_req, res) => {
  res.json({ test: 'bundled express works' });
});

const handler = serverless(app);

export default async function (req: VercelRequest, res: VercelResponse) {
  return handler(req, res);
}

import type { VercelRequest, VercelResponse } from '@vercel/node';
import express from 'express';

const app = express();
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.all('*', (req, res) => {
  res.json({ path: req.path, method: req.method });
});

export default function handler(req: VercelRequest, res: VercelResponse) {
  return app(req, res);
}

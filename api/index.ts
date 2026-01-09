import express from 'express';
import serverless from 'serverless-http';

const app = express();
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/test', (_req, res) => {
  res.json({ test: 'express works' });
});

const handler = serverless(app);

export default async (req: any, res: any) => {
  return handler(req, res);
};

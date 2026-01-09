import type { VercelRequest, VercelResponse } from '@vercel/node';
import express from 'express';
import serverless from 'serverless-http';
import { registerRoutes } from '../server/routes';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Health check (defined before dynamic routes for quick response)
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Register all API routes
let routesRegistered = false;
const registerRoutesOnce = async () => {
  if (!routesRegistered) {
    await registerRoutes(app, { skipSeeding: true });
    routesRegistered = true;
  }
};

const handler = serverless(app);

export default async function (req: VercelRequest, res: VercelResponse) {
  await registerRoutesOnce();
  return handler(req, res);
}

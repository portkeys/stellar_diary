import express from 'express';
import serverless from 'serverless-http';
import { registerRoutes } from '../server/routes';

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Health check (before route registration to avoid async issues)
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Register all API routes (skip seeding in serverless - run npm run db:seed separately)
let routesRegistered = false;
const registerRoutesOnce = async () => {
  if (!routesRegistered) {
    await registerRoutes(app, { skipSeeding: true });
    routesRegistered = true;
  }
};

// Wrap with serverless-http
const handler = serverless(app);

export default async (req: any, res: any) => {
  await registerRoutesOnce();
  return handler(req, res);
};

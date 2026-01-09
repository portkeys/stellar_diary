import express from 'express';
import serverless from 'serverless-http';

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Health check (before route registration to avoid async issues)
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Debug endpoint
app.get('/api/debug', (_req, res) => {
  res.json({
    env: {
      hasDbUrl: !!process.env.DATABASE_URL,
      nodeEnv: process.env.NODE_ENV,
      vercel: process.env.VERCEL,
    }
  });
});

// Register all API routes (skip seeding in serverless - run npm run db:seed separately)
let routesRegistered = false;
let registrationError: Error | null = null;

const registerRoutesOnce = async () => {
  if (registrationError) throw registrationError;
  if (!routesRegistered) {
    try {
      const { registerRoutes } = await import('../server/routes');
      await registerRoutes(app, { skipSeeding: true });
      routesRegistered = true;
    } catch (err) {
      registrationError = err as Error;
      console.error('Route registration failed:', err);
      throw err;
    }
  }
};

// Wrap with serverless-http
const handler = serverless(app);

export default async (req: any, res: any) => {
  try {
    await registerRoutesOnce();
    return handler(req, res);
  } catch (err) {
    console.error('Handler error:', err);
    res.status(500).json({
      error: 'Function error',
      message: err instanceof Error ? err.message : 'Unknown error',
      stack: err instanceof Error ? err.stack : undefined
    });
  }
};

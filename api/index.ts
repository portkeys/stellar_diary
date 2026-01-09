import type { VercelRequest, VercelResponse } from '@vercel/node';

// Simple router without express
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const path = req.url?.split('?')[0] || '';

  // Health check
  if (path === '/api/health' || path === '/api') {
    return res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  }

  // Test endpoint
  if (path === '/api/test') {
    return res.status(200).json({ test: 'vercel native works' });
  }

  return res.status(404).json({ error: 'Not found', path });
}

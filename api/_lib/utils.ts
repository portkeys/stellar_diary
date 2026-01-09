/**
 * Shared utilities for Vercel API routes
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * CORS headers for API responses
 */
export function setCorsHeaders(res: VercelResponse): void {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

/**
 * Handle OPTIONS preflight requests
 */
export function handleOptions(req: VercelRequest, res: VercelResponse): boolean {
  if (req.method === 'OPTIONS') {
    setCorsHeaders(res);
    res.status(200).end();
    return true;
  }
  return false;
}

/**
 * Parse ID from request params
 */
export function parseId(req: VercelRequest): number | null {
  const id = req.query.id;
  if (typeof id === 'string') {
    const parsed = parseInt(id, 10);
    return isNaN(parsed) ? null : parsed;
  }
  return null;
}

/**
 * Send error response
 */
export function sendError(res: VercelResponse, status: number, message: string, errors?: unknown): void {
  res.status(status).json({ message, errors });
}

/**
 * Send success response
 */
export function sendSuccess<T>(res: VercelResponse, data: T, status: number = 200): void {
  res.status(status).json(data);
}

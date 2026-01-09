import type { VercelRequest, VercelResponse } from '@vercel/node';
import { storage } from '../server/storage';
import { setCorsHeaders, handleOptions, sendError } from './_lib/utils';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);
  if (handleOptions(req, res)) return;

  if (req.method !== 'GET') {
    return sendError(res, 405, 'Method not allowed');
  }

  try {
    const { category } = req.query;

    if (category && typeof category === 'string') {
      const tips = await storage.getTelescopeTipsByCategory(category);
      return res.status(200).json(tips);
    }

    const tips = await storage.getAllTelescopeTips();
    res.status(200).json(tips);
  } catch (error) {
    sendError(res, 500, `Failed to get telescope tips: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

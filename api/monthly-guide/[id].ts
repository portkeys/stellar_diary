import type { VercelRequest, VercelResponse } from '@vercel/node';
import { storage } from '../../server/storage';
import { setCorsHeaders, handleOptions, parseId, sendError } from '../_lib/utils';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);
  if (handleOptions(req, res)) return;

  if (req.method !== 'PATCH') {
    return sendError(res, 405, 'Method not allowed');
  }

  const id = parseId(req);
  if (id === null) {
    return sendError(res, 400, 'Invalid ID format');
  }

  try {
    const guide = await storage.getMonthlyGuide(id);

    if (!guide) {
      return sendError(res, 404, 'Monthly guide not found');
    }

    const updatedGuide = await storage.updateMonthlyGuide(id, req.body);
    res.status(200).json(updatedGuide);
  } catch (error) {
    sendError(res, 500, `Failed to update monthly guide: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

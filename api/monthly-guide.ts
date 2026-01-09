import type { VercelRequest, VercelResponse } from '@vercel/node';
import { storage } from '../server/storage';
import { getCurrentMonth, getCurrentYear } from '../server/services/celestialObjects';
import { setCorsHeaders, handleOptions, sendError } from './_lib/utils';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);
  if (handleOptions(req, res)) return;

  const { id } = req.query;

  // Route: PATCH /api/monthly-guide?id=123
  if (id && req.method === 'PATCH') {
    const guideId = parseInt(id as string, 10);
    if (isNaN(guideId)) {
      return sendError(res, 400, 'Invalid ID format');
    }
    return handleUpdate(req, guideId, res);
  }

  // Route: GET /api/monthly-guide
  if (req.method === 'GET') {
    return handleGet(req, res);
  }

  return sendError(res, 405, 'Method not allowed');
}

async function handleGet(req: VercelRequest, res: VercelResponse) {
  try {
    const month = (req.query.month as string) || getCurrentMonth();
    const year = parseInt((req.query.year as string) || getCurrentYear().toString());
    const hemisphere = (req.query.hemisphere as string) || "Northern";

    const guides = await storage.getAllMonthlyGuides();
    const guide = guides.find(g =>
      g.month === month &&
      g.year === year &&
      (g.hemisphere === hemisphere || g.hemisphere === "both")
    );

    if (!guide) {
      return sendError(res, 404, 'Monthly guide not found');
    }

    res.status(200).json(guide);
  } catch (error) {
    sendError(res, 500, `Failed to get monthly guide: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function handleUpdate(req: VercelRequest, id: number, res: VercelResponse) {
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

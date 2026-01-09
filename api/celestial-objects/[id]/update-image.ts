import type { VercelRequest, VercelResponse } from '@vercel/node';
import { updateCelestialObjectImage } from '../../../server/services/nasaImages';
import { setCorsHeaders, handleOptions, sendError } from '../../_lib/utils';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);
  if (handleOptions(req, res)) return;

  if (req.method !== 'PATCH') {
    return sendError(res, 405, 'Method not allowed');
  }

  const id = req.query.id;
  if (typeof id !== 'string') {
    return sendError(res, 400, 'Invalid ID format');
  }

  const parsedId = parseInt(id, 10);
  if (isNaN(parsedId)) {
    return sendError(res, 400, 'Invalid ID format');
  }

  try {
    const result = await updateCelestialObjectImage(parsedId);

    if (result.success) {
      res.status(200).json(result);
    } else {
      sendError(res, 404, result.message);
    }
  } catch (error) {
    sendError(res, 500, `Failed to update celestial object image: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

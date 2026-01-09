import type { VercelRequest, VercelResponse } from '@vercel/node';
import { updateAllCelestialObjectImages } from '../../server/services/nasaImages';
import { setCorsHeaders, handleOptions, sendError } from '../_lib/utils';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);
  if (handleOptions(req, res)) return;

  if (req.method !== 'POST') {
    return sendError(res, 405, 'Method not allowed');
  }

  try {
    const { forceUpdate } = req.body || {};
    const result = await updateAllCelestialObjectImages(forceUpdate || false);
    res.status(200).json(result);
  } catch (error) {
    console.error("Error updating all celestial object images:", error);
    res.status(500).json({
      success: false,
      message: `Failed to update images: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
  }
}

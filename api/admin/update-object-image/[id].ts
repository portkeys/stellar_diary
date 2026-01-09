import type { VercelRequest, VercelResponse } from '@vercel/node';
import { updateCelestialObjectImage } from '../../../server/services/nasaImages';
import { setCorsHeaders, handleOptions, sendError } from '../../_lib/utils';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);
  if (handleOptions(req, res)) return;

  if (req.method !== 'POST') {
    return sendError(res, 405, 'Method not allowed');
  }

  const id = req.query.id;
  if (typeof id !== 'string') {
    return res.status(400).json({ success: false, message: 'Invalid object ID' });
  }

  const objectId = parseInt(id, 10);
  if (isNaN(objectId)) {
    return res.status(400).json({ success: false, message: 'Invalid object ID' });
  }

  try {
    const result = await updateCelestialObjectImage(objectId);

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(404).json(result);
    }
  } catch (error) {
    console.error("Error updating celestial object image:", error);
    res.status(500).json({
      success: false,
      message: `Failed to update image: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
  }
}

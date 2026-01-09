import type { VercelRequest, VercelResponse } from '@vercel/node';
import { previewCelestialObjectImageSearch } from '../../../server/services/nasaImages';
import { setCorsHeaders, handleOptions, sendError } from '../../_lib/utils';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);
  if (handleOptions(req, res)) return;

  if (req.method !== 'GET') {
    return sendError(res, 405, 'Method not allowed');
  }

  const objectName = req.query.objectName;
  if (typeof objectName !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'Object name is required'
    });
  }

  try {
    const decodedName = decodeURIComponent(objectName);
    const result = await previewCelestialObjectImageSearch(decodedName);
    res.status(200).json(result);
  } catch (error) {
    console.error("Error previewing NASA image search:", error);
    res.status(500).json({
      success: false,
      message: `Failed to preview image search: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
  }
}

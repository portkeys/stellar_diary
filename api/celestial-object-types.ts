import type { VercelRequest, VercelResponse } from '@vercel/node';
import { celestialObjectTypes } from '../shared/schema';
import { setCorsHeaders, handleOptions, sendError } from './_lib/utils';

export default function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);
  if (handleOptions(req, res)) return;

  if (req.method !== 'GET') {
    return sendError(res, 405, 'Method not allowed');
  }

  res.status(200).json(celestialObjectTypes);
}

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { fetchApod } from '../server/services/nasaApi';
import { setCorsHeaders, handleOptions, sendError } from './_lib/utils';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);
  if (handleOptions(req, res)) return;

  if (req.method !== 'GET') {
    return sendError(res, 405, 'Method not allowed');
  }

  try {
    const { date, refresh } = req.query;
    const forceRefresh = refresh === 'true';

    console.log(`APOD request - Date: ${date || 'current'}, Force refresh: ${forceRefresh}`);

    if (forceRefresh) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    } else {
      res.setHeader('Cache-Control', 'public, max-age=3600');
    }

    const apodData = await fetchApod(date as string | undefined, forceRefresh);
    res.status(200).json(apodData);
  } catch (error) {
    console.error('NASA APOD API error:', error);
    sendError(res, 500, `Failed to fetch APOD: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

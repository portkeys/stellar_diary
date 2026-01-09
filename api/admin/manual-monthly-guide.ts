import type { VercelRequest, VercelResponse } from '@vercel/node';
import { storage } from '../../server/storage';
import { setCorsHeaders, handleOptions, sendError } from '../_lib/utils';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);
  if (handleOptions(req, res)) return;

  if (req.method !== 'POST') {
    return sendError(res, 405, 'Method not allowed');
  }

  try {
    const { month, year, hemisphere, headline, description, videoUrls } = req.body;

    if (!month || !year || !headline || !description) {
      return res.status(400).json({
        success: false,
        message: "Month, year, headline, and description are required",
        objectsAdded: 0,
        guideUpdated: false
      });
    }

    const monthlyGuide = {
      month,
      year: parseInt(year),
      hemisphere: hemisphere || 'Northern',
      headline,
      description,
      videoUrls: videoUrls || [],
      isAdmin: true
    };

    await storage.createMonthlyGuide(monthlyGuide);

    res.status(200).json({
      success: true,
      message: `Successfully created ${month} ${year} guide`,
      objectsAdded: 0,
      guideUpdated: true
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: `Failed to create manual guide: ${error instanceof Error ? error.message : 'Unknown error'}`,
      objectsAdded: 0,
      guideUpdated: false
    });
  }
}

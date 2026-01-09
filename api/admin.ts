import type { VercelRequest, VercelResponse } from '@vercel/node';
import { storage } from '../server/storage';
import { updateCelestialObjectImage, updateAllCelestialObjectImages, previewCelestialObjectImageSearch } from '../server/services/nasaImages';
import { setCorsHeaders, handleOptions, sendError } from './_lib/utils';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);
  if (handleOptions(req, res)) return;

  if (req.method !== 'POST' && req.method !== 'GET') {
    return sendError(res, 405, 'Method not allowed');
  }

  const { action, id, objectName } = req.query;

  switch (action) {
    case 'manual-monthly-guide':
      return handleManualMonthlyGuide(req, res);
    case 'update-object-image':
      return handleUpdateObjectImage(id as string, res);
    case 'update-all-images':
      return handleUpdateAllImages(req, res);
    case 'preview-nasa-image':
      return handlePreviewNasaImage(objectName as string, res);
    default:
      return sendError(res, 400, 'Invalid action. Use: manual-monthly-guide, update-object-image, update-all-images, preview-nasa-image');
  }
}

async function handleManualMonthlyGuide(req: VercelRequest, res: VercelResponse) {
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

async function handleUpdateObjectImage(id: string | undefined, res: VercelResponse) {
  if (!id) {
    return res.status(400).json({ success: false, message: 'Object ID is required' });
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
    res.status(500).json({
      success: false,
      message: `Failed to update image: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
  }
}

async function handleUpdateAllImages(req: VercelRequest, res: VercelResponse) {
  try {
    const { forceUpdate } = req.body || {};
    const result = await updateAllCelestialObjectImages(forceUpdate || false);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: `Failed to update images: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
  }
}

async function handlePreviewNasaImage(objectName: string | undefined, res: VercelResponse) {
  if (!objectName) {
    return res.status(400).json({ success: false, message: 'Object name is required' });
  }

  try {
    const decodedName = decodeURIComponent(objectName);
    const result = await previewCelestialObjectImageSearch(decodedName);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: `Failed to preview image search: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
  }
}

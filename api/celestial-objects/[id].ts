import type { VercelRequest, VercelResponse } from '@vercel/node';
import { storage } from '../../server/storage';
import { updateCelestialObjectImage } from '../../server/services/nasaImages';
import { setCorsHeaders, handleOptions, parseId, sendError } from '../_lib/utils';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);
  if (handleOptions(req, res)) return;

  const id = parseId(req);
  if (id === null) {
    return sendError(res, 400, 'Invalid ID format');
  }

  switch (req.method) {
    case 'GET':
      return handleGet(id, res);
    case 'PATCH':
      return handlePatch(req, id, res);
    case 'DELETE':
      return handleDelete(id, res);
    default:
      return sendError(res, 405, 'Method not allowed');
  }
}

async function handleGet(id: number, res: VercelResponse) {
  try {
    const object = await storage.getCelestialObject(id);

    if (!object) {
      return sendError(res, 404, 'Celestial object not found');
    }

    res.status(200).json(object);
  } catch (error) {
    sendError(res, 500, `Failed to get celestial object: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function handlePatch(req: VercelRequest, id: number, res: VercelResponse) {
  try {
    // Check if this is an image update request (from the path)
    const path = req.url || '';
    if (path.includes('update-image')) {
      const result = await updateCelestialObjectImage(id);
      if (result.success) {
        return res.status(200).json(result);
      } else {
        return sendError(res, 404, result.message);
      }
    }

    // Regular update
    const object = await storage.getCelestialObject(id);
    if (!object) {
      return sendError(res, 404, 'Celestial object not found');
    }

    // For now, celestial objects don't have a general update method
    // This could be implemented if needed
    sendError(res, 501, 'General update not implemented');
  } catch (error) {
    sendError(res, 500, `Failed to update celestial object: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function handleDelete(id: number, res: VercelResponse) {
  try {
    const object = await storage.getCelestialObject(id);
    if (!object) {
      return sendError(res, 404, 'Celestial object not found');
    }

    // Delete not implemented yet - could be added to storage
    sendError(res, 501, 'Delete not implemented');
  } catch (error) {
    sendError(res, 500, `Failed to delete celestial object: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

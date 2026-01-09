import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { storage } from '../server/storage';
import { filterCelestialObjects } from '../server/services/celestialObjects';
import { searchCelestialObjectImage, updateCelestialObjectImage, updateAllCelestialObjectImages } from '../server/services/nasaImages';
import { celestialObjectExists } from '../server/services/cleanupDuplicates';
import { insertCelestialObjectSchema } from '../shared/schema';
import { setCorsHeaders, handleOptions, sendError } from './_lib/utils';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);
  if (handleOptions(req, res)) return;

  const { id, action } = req.query;

  // Route: POST /api/celestial-objects?action=update-all-images
  if (action === 'update-all-images' && req.method === 'POST') {
    return handleUpdateAllImages(req, res);
  }

  // Route: PATCH /api/celestial-objects?id=123&action=update-image
  if (id && action === 'update-image' && req.method === 'PATCH') {
    return handleUpdateImage(parseInt(id as string), res);
  }

  // Route: /api/celestial-objects?id=123
  if (id) {
    const objectId = parseInt(id as string, 10);
    if (isNaN(objectId)) {
      return sendError(res, 400, 'Invalid ID format');
    }

    switch (req.method) {
      case 'GET':
        return handleGetOne(objectId, res);
      case 'PATCH':
        return handleUpdateImage(objectId, res);
      case 'DELETE':
        return sendError(res, 501, 'Delete not implemented');
      default:
        return sendError(res, 405, 'Method not allowed');
    }
  }

  // Route: /api/celestial-objects
  switch (req.method) {
    case 'GET':
      return handleGetAll(req, res);
    case 'POST':
      return handleCreate(req, res);
    default:
      return sendError(res, 405, 'Method not allowed');
  }
}

async function handleGetAll(req: VercelRequest, res: VercelResponse) {
  try {
    const { type, month, hemisphere } = req.query;

    if (type || month || hemisphere) {
      const objects = await filterCelestialObjects(
        type as string | undefined,
        month as string | undefined,
        hemisphere as string | undefined
      );
      return res.status(200).json(objects);
    }

    const objects = await storage.getAllCelestialObjects();
    res.status(200).json(objects);
  } catch (error) {
    sendError(res, 500, `Failed to get celestial objects: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function handleGetOne(id: number, res: VercelResponse) {
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

async function handleCreate(req: VercelRequest, res: VercelResponse) {
  try {
    const body = req.body;
    let imageUrl = body.imageUrl;
    let imageSource = 'fallback';

    if (body.name) {
      try {
        const result = await searchCelestialObjectImage(body.name) as any;
        if (result.success && result.image_url) {
          imageUrl = result.image_url;
          imageSource = result.source || 'unknown';
        }
      } catch (error) {
        console.error(`Image search failed for ${body.name}:`, error);
      }
    }

    if (!imageUrl) {
      const objectType = body.type || 'galaxy';
      const fallbackImages: Record<string, string> = {
        'galaxy': 'https://images.unsplash.com/photo-1502134249126-9f3755a50d78?auto=format&fit=crop&w=800&h=500',
        'nebula': 'https://images.unsplash.com/photo-1502134249126-9f3755a50d78?auto=format&fit=crop&w=800&h=500',
        'star cluster': 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?auto=format&fit=crop&w=800&h=500',
        'planet': 'https://images.unsplash.com/photo-1614728263952-84ea256f9679?auto=format&fit=crop&w=800&h=500',
      };
      imageUrl = fallbackImages[objectType.toLowerCase()] || fallbackImages['galaxy'];
    }

    const validatedData = insertCelestialObjectSchema.parse({
      ...body,
      visibilityRating: body.visibilityRating || "Custom",
      information: body.information || "Custom celestial object",
      imageUrl: imageUrl,
      constellation: body.constellation || "Not specified",
      magnitude: body.magnitude || "Not specified",
      recommendedEyepiece: body.recommendedEyepiece || "Not specified",
    });

    const exists = await celestialObjectExists(validatedData.name);
    if (exists) {
      return sendError(res, 409, `A celestial object with the name "${validatedData.name}" already exists`);
    }

    const newObject = await storage.createCelestialObject(validatedData);
    res.status(201).json({ ...newObject, _debug: { imageSource } });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return sendError(res, 400, 'Invalid request data', error.errors);
    }
    sendError(res, 500, `Failed to create celestial object: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function handleUpdateImage(id: number, res: VercelResponse) {
  try {
    const result = await updateCelestialObjectImage(id);
    if (result.success) {
      res.status(200).json(result);
    } else {
      sendError(res, 404, result.message);
    }
  } catch (error) {
    sendError(res, 500, `Failed to update image: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function handleUpdateAllImages(req: VercelRequest, res: VercelResponse) {
  try {
    const { forceUpdate } = req.body || {};
    const result = await updateAllCelestialObjectImages(forceUpdate || false);
    res.status(200).json(result);
  } catch (error) {
    sendError(res, 500, `Failed to update all images: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { storage } from '../../server/storage';
import { filterCelestialObjects } from '../../server/services/celestialObjects';
import { searchCelestialObjectImage } from '../../server/services/nasaImages';
import { celestialObjectExists } from '../../server/services/cleanupDuplicates';
import { insertCelestialObjectSchema } from '../../shared/schema';
import { setCorsHeaders, handleOptions, sendError } from '../_lib/utils';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);
  if (handleOptions(req, res)) return;

  if (req.method === 'GET') {
    return handleGet(req, res);
  } else if (req.method === 'POST') {
    return handlePost(req, res);
  } else {
    return sendError(res, 405, 'Method not allowed');
  }
}

async function handleGet(req: VercelRequest, res: VercelResponse) {
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

async function handlePost(req: VercelRequest, res: VercelResponse) {
  try {
    const body = req.body;

    // Search for NASA or Wikipedia image if name is provided
    let imageUrl = body.imageUrl;
    let imageSource = 'fallback';

    if (body.name) {
      try {
        console.log(`Searching for image (NASA/Wikipedia) for: ${body.name}`);
        const result = await searchCelestialObjectImage(body.name) as any;
        if (result.success && result.image_url) {
          imageUrl = result.image_url;
          imageSource = result.source || 'unknown';
          console.log(`Found image for ${body.name} [${imageSource}]: ${imageUrl}`);
        }
      } catch (error) {
        console.error(`Image search failed for ${body.name}:`, error);
      }
    }

    // Use type-specific fallback if no image found
    if (!imageUrl) {
      const objectType = body.type || 'galaxy';
      const fallbackImages: Record<string, string> = {
        'galaxy': 'https://images.unsplash.com/photo-1502134249126-9f3755a50d78?auto=format&fit=crop&w=800&h=500',
        'nebula': 'https://images.unsplash.com/photo-1502134249126-9f3755a50d78?auto=format&fit=crop&w=800&h=500',
        'star cluster': 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?auto=format&fit=crop&w=800&h=500',
        'planet': 'https://images.unsplash.com/photo-1614728263952-84ea256f9679?auto=format&fit=crop&w=800&h=500',
        'star': 'https://images.unsplash.com/photo-1502134249126-9f3755a50d78?auto=format&fit=crop&w=800&h=500',
        'double star': 'https://images.unsplash.com/photo-1502134249126-9f3755a50d78?auto=format&fit=crop&w=800&h=500',
        'variable star': 'https://images.unsplash.com/photo-1502134249126-9f3755a50d78?auto=format&fit=crop&w=800&h=500'
      };
      imageUrl = fallbackImages[objectType.toLowerCase()] || fallbackImages['galaxy'];
      imageSource = 'fallback';
    }

    // Validate request body
    const validatedData = insertCelestialObjectSchema.parse({
      ...body,
      visibilityRating: body.visibilityRating || "Custom",
      information: body.information || "Custom celestial object",
      imageUrl: imageUrl,
      constellation: body.constellation || "Not specified",
      magnitude: body.magnitude || "Not specified",
      recommendedEyepiece: body.recommendedEyepiece || "Not specified",
    });

    // Check for duplicates
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

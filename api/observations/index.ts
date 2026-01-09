import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { storage } from '../../server/storage';
import { insertObservationSchema } from '../../shared/schema';
import { setCorsHeaders, handleOptions, sendError } from '../_lib/utils';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);
  if (handleOptions(req, res)) return;

  if (req.method === 'GET') {
    return handleGet(res);
  } else if (req.method === 'POST') {
    return handlePost(req, res);
  } else {
    return sendError(res, 405, 'Method not allowed');
  }
}

async function handleGet(res: VercelResponse) {
  try {
    // For demo purposes, use a fixed user ID of 1
    const userId = 1;
    const observations = await storage.getUserObservations(userId);

    // Enhance with celestial object details
    const enhancedObservations = await Promise.all(
      observations.map(async (obs) => {
        const celestialObject = await storage.getCelestialObject(obs.objectId!);
        return {
          ...obs,
          celestialObject
        };
      })
    );

    res.status(200).json(enhancedObservations);
  } catch (error) {
    sendError(res, 500, `Failed to get observations: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function handlePost(req: VercelRequest, res: VercelResponse) {
  try {
    const validatedData = insertObservationSchema.parse(req.body);

    // Check if celestial object exists
    const object = await storage.getCelestialObject(validatedData.objectId!);
    if (!object) {
      return sendError(res, 404, 'Celestial object not found');
    }

    // For demo purposes, use a fixed user ID of 1
    const userId = 1;
    validatedData.userId = userId;

    const newObservation = await storage.createObservation(validatedData);
    res.status(201).json(newObservation);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return sendError(res, 400, 'Invalid request data', error.errors);
    }
    sendError(res, 500, `Failed to create observation: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

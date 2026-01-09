import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { storage } from '../server/storage';
import { insertObservationSchema } from '../shared/schema';
import { setCorsHeaders, handleOptions, sendError } from './_lib/utils';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);
  if (handleOptions(req, res)) return;

  const { id } = req.query;

  // Route: /api/observations?id=123
  if (id) {
    const observationId = parseInt(id as string, 10);
    if (isNaN(observationId)) {
      return sendError(res, 400, 'Invalid ID format');
    }

    switch (req.method) {
      case 'PATCH':
        return handleUpdate(req, observationId, res);
      case 'DELETE':
        return handleDelete(observationId, res);
      default:
        return sendError(res, 405, 'Method not allowed');
    }
  }

  // Route: /api/observations
  switch (req.method) {
    case 'GET':
      return handleGetAll(res);
    case 'POST':
      return handleCreate(req, res);
    default:
      return sendError(res, 405, 'Method not allowed');
  }
}

async function handleGetAll(res: VercelResponse) {
  try {
    const userId = 1; // Demo user
    const observations = await storage.getUserObservations(userId);

    const enhancedObservations = await Promise.all(
      observations.map(async (obs) => {
        const celestialObject = await storage.getCelestialObject(obs.objectId!);
        return { ...obs, celestialObject };
      })
    );

    res.status(200).json(enhancedObservations);
  } catch (error) {
    sendError(res, 500, `Failed to get observations: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function handleCreate(req: VercelRequest, res: VercelResponse) {
  try {
    const validatedData = insertObservationSchema.parse(req.body);

    const object = await storage.getCelestialObject(validatedData.objectId!);
    if (!object) {
      return sendError(res, 404, 'Celestial object not found');
    }

    const userId = 1; // Demo user
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

async function handleUpdate(req: VercelRequest, id: number, res: VercelResponse) {
  try {
    const observation = await storage.getObservation(id);
    if (!observation) {
      return sendError(res, 404, 'Observation not found');
    }

    const userId = 1;
    if (observation.userId !== userId) {
      return sendError(res, 403, 'Not authorized to update this observation');
    }

    const updatedObservation = await storage.updateObservation(id, req.body);
    res.status(200).json(updatedObservation);
  } catch (error) {
    sendError(res, 500, `Failed to update observation: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function handleDelete(id: number, res: VercelResponse) {
  try {
    const observation = await storage.getObservation(id);
    if (!observation) {
      return sendError(res, 404, 'Observation not found');
    }

    const userId = 1;
    if (observation.userId !== userId) {
      return sendError(res, 403, 'Not authorized to delete this observation');
    }

    await storage.deleteObservation(id);
    res.status(204).end();
  } catch (error) {
    sendError(res, 500, `Failed to delete observation: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

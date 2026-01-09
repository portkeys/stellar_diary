import type { VercelRequest, VercelResponse } from '@vercel/node';
import { storage } from '../../server/storage';
import { setCorsHeaders, handleOptions, parseId, sendError } from '../_lib/utils';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);
  if (handleOptions(req, res)) return;

  const id = parseId(req);
  if (id === null) {
    return sendError(res, 400, 'Invalid ID format');
  }

  switch (req.method) {
    case 'PATCH':
      return handlePatch(req, id, res);
    case 'DELETE':
      return handleDelete(id, res);
    default:
      return sendError(res, 405, 'Method not allowed');
  }
}

async function handlePatch(req: VercelRequest, id: number, res: VercelResponse) {
  try {
    const observation = await storage.getObservation(id);

    if (!observation) {
      return sendError(res, 404, 'Observation not found');
    }

    // For demo purposes, use a fixed user ID of 1
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

    // For demo purposes, use a fixed user ID of 1
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

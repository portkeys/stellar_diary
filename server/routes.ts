import type { Express, Request, Response } from "express";
import { z } from "zod";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { fetchApod } from "./services/nasaApi";
import { seedDatabase, getCurrentMonth, getCurrentYear, filterCelestialObjects } from "./services/celestialObjects";
import { 
  insertObservationSchema,
  celestialObjectTypes
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Seed the database with initial data
  await seedDatabase();

  // NASA APOD API endpoint
  app.get("/api/apod", async (req: Request, res: Response) => {
    try {
      const { date } = req.query;
      const apodData = await fetchApod(date as string | undefined);
      res.json(apodData);
    } catch (error) {
      res.status(500).json({ 
        message: `Failed to fetch APOD: ${error instanceof Error ? error.message : 'Unknown error'}` 
      });
    }
  });

  // Get all celestial objects
  app.get("/api/celestial-objects", async (req: Request, res: Response) => {
    try {
      const { type, month, hemisphere } = req.query;
      
      // If any filters are provided, use the filter function
      if (type || month || hemisphere) {
        const objects = await filterCelestialObjects(
          type as string | undefined,
          month as string | undefined,
          hemisphere as string | undefined
        );
        return res.json(objects);
      }
      
      // Otherwise return all objects
      const objects = await storage.getAllCelestialObjects();
      res.json(objects);
    } catch (error) {
      res.status(500).json({ 
        message: `Failed to get celestial objects: ${error instanceof Error ? error.message : 'Unknown error'}` 
      });
    }
  });

  // Get celestial object by ID
  app.get("/api/celestial-objects/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const object = await storage.getCelestialObject(id);
      
      if (!object) {
        return res.status(404).json({ message: "Celestial object not found" });
      }
      
      res.json(object);
    } catch (error) {
      res.status(500).json({ 
        message: `Failed to get celestial object: ${error instanceof Error ? error.message : 'Unknown error'}` 
      });
    }
  });

  // Get celestial object types (for filtering)
  app.get("/api/celestial-object-types", async (_req: Request, res: Response) => {
    try {
      res.json(celestialObjectTypes);
    } catch (error) {
      res.status(500).json({ 
        message: `Failed to get celestial object types: ${error instanceof Error ? error.message : 'Unknown error'}` 
      });
    }
  });

  // Get monthly guide
  app.get("/api/monthly-guide", async (req: Request, res: Response) => {
    try {
      const month = (req.query.month as string) || getCurrentMonth();
      const year = parseInt((req.query.year as string) || getCurrentYear().toString());
      const hemisphere = (req.query.hemisphere as string) || "Northern";
      
      // Find a matching guide
      const guides = await storage.getAllMonthlyGuides();
      const guide = guides.find(g => 
        g.month === month && 
        g.year === year && 
        (g.hemisphere === hemisphere || g.hemisphere === "both")
      );
      
      if (!guide) {
        return res.status(404).json({ message: "Monthly guide not found" });
      }
      
      res.json(guide);
    } catch (error) {
      res.status(500).json({ 
        message: `Failed to get monthly guide: ${error instanceof Error ? error.message : 'Unknown error'}` 
      });
    }
  });

  // Get user's observation list
  app.get("/api/observations", async (req: Request, res: Response) => {
    try {
      // For demo purposes, we'll use a fixed user ID of 1
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
      
      res.json(enhancedObservations);
    } catch (error) {
      res.status(500).json({ 
        message: `Failed to get observations: ${error instanceof Error ? error.message : 'Unknown error'}` 
      });
    }
  });

  // Add to observation list
  app.post("/api/observations", async (req: Request, res: Response) => {
    try {
      // Validate request body
      const validatedData = insertObservationSchema.parse(req.body);
      
      // Check if celestial object exists
      const object = await storage.getCelestialObject(validatedData.objectId!);
      if (!object) {
        return res.status(404).json({ message: "Celestial object not found" });
      }
      
      // For demo purposes, we'll use a fixed user ID of 1
      const userId = 1;
      validatedData.userId = userId;
      
      // Create new observation
      const newObservation = await storage.createObservation(validatedData);
      
      res.status(201).json(newObservation);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request data", errors: error.errors });
      }
      
      res.status(500).json({ 
        message: `Failed to create observation: ${error instanceof Error ? error.message : 'Unknown error'}` 
      });
    }
  });

  // Update observation (mark as observed, add notes)
  app.patch("/api/observations/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const observation = await storage.getObservation(id);
      
      if (!observation) {
        return res.status(404).json({ message: "Observation not found" });
      }
      
      // For demo purposes, we'll use a fixed user ID of 1
      const userId = 1;
      if (observation.userId !== userId) {
        return res.status(403).json({ message: "Not authorized to update this observation" });
      }
      
      const updatedObservation = await storage.updateObservation(id, req.body);
      res.json(updatedObservation);
    } catch (error) {
      res.status(500).json({ 
        message: `Failed to update observation: ${error instanceof Error ? error.message : 'Unknown error'}` 
      });
    }
  });

  // Delete observation
  app.delete("/api/observations/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const observation = await storage.getObservation(id);
      
      if (!observation) {
        return res.status(404).json({ message: "Observation not found" });
      }
      
      // For demo purposes, we'll use a fixed user ID of 1
      const userId = 1;
      if (observation.userId !== userId) {
        return res.status(403).json({ message: "Not authorized to delete this observation" });
      }
      
      await storage.deleteObservation(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ 
        message: `Failed to delete observation: ${error instanceof Error ? error.message : 'Unknown error'}` 
      });
    }
  });

  // Get telescope tips
  app.get("/api/telescope-tips", async (req: Request, res: Response) => {
    try {
      const { category } = req.query;
      
      if (category) {
        const tips = await storage.getTelescopeTipsByCategory(category as string);
        return res.json(tips);
      }
      
      const tips = await storage.getAllTelescopeTips();
      res.json(tips);
    } catch (error) {
      res.status(500).json({ 
        message: `Failed to get telescope tips: ${error instanceof Error ? error.message : 'Unknown error'}` 
      });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}

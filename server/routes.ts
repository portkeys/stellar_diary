import type { Express, Request, Response } from "express";
import { z } from "zod";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { fetchApod } from "./services/nasaApi";
import { seedDatabase, getCurrentMonth, getCurrentYear, filterCelestialObjects } from "./services/celestialObjects";
import { celestialObjectExists, cleanupDuplicateCelestialObjects } from "./services/cleanupDuplicates";
import { 
  insertObservationSchema,
  insertCelestialObjectSchema,
  celestialObjectTypes
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Seed the database with initial data
  await seedDatabase();
  
  // Clean up any duplicate celestial objects
  await cleanupDuplicateCelestialObjects();

  // NASA APOD API endpoint
  app.get("/api/apod", async (req: Request, res: Response) => {
    try {
      // Extract query parameters
      const { date, refresh } = req.query;
      const forceRefresh = refresh === 'true';
      
      console.log(`APOD request received - Date: ${date || 'current'}, Force refresh: ${forceRefresh}`);
      
      // Set appropriate cache headers based on whether we want fresh data
      if (forceRefresh) {
        // If forcing refresh, prevent client-side caching
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        console.log('APOD cache headers set for forced refresh');
      } else {
        // If using cached data, allow client-side caching for 1 hour
        // The database will still serve the latest cached entry
        res.setHeader('Cache-Control', 'public, max-age=3600');
        console.log('APOD cache headers set for normal request');
      }
      
      console.log('Fetching APOD data from service...');
      const apodData = await fetchApod(date as string | undefined, forceRefresh);
      console.log(`APOD data returned: ${apodData.title} (${apodData.date})`);
      
      res.json(apodData);
    } catch (error) {
      console.error('NASA APOD API error:', error);
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
  
  // Create a new celestial object (for custom observations)
  app.post("/api/celestial-objects", async (req: Request, res: Response) => {
    try {
      // Validate request body
      const validatedData = insertCelestialObjectSchema.parse({
        ...req.body,
        // Set default values for required fields if they're not provided
        visibilityRating: req.body.visibilityRating || "Custom",
        information: req.body.information || "Custom celestial object",
        // Generate a placeholder image if none is provided
        imageUrl: req.body.imageUrl || "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=800&h=500",
        // Other fields
        constellation: req.body.constellation || "Not specified",
        magnitude: req.body.magnitude || "Not specified",
        recommendedEyepiece: req.body.recommendedEyepiece || "Not specified",
      });
      
      // Check if a celestial object with this name already exists
      const exists = await celestialObjectExists(validatedData.name);
      if (exists) {
        return res.status(409).json({ 
          message: `A celestial object with the name "${validatedData.name}" already exists` 
        });
      }
      
      // Create the celestial object
      const newObject = await storage.createCelestialObject(validatedData);
      
      res.status(201).json(newObject);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request data", errors: error.errors });
      }
      
      res.status(500).json({ 
        message: `Failed to create celestial object: ${error instanceof Error ? error.message : 'Unknown error'}` 
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

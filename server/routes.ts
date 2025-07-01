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
  
  // Update monthly guide
  app.patch("/api/monthly-guide/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      // Get the guide to make sure it exists
      const guide = await storage.getMonthlyGuide(id);
      
      if (!guide) {
        return res.status(404).json({ message: "Monthly guide not found" });
      }
      
      // Update the guide with the provided fields
      const updatedGuide = await storage.updateMonthlyGuide(id, req.body);
      
      res.json(updatedGuide);
    } catch (error) {
      res.status(500).json({ 
        message: `Failed to update monthly guide: ${error instanceof Error ? error.message : 'Unknown error'}` 
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

  // Admin routes for monthly guide management
  app.post("/api/admin/update-monthly-guide", async (req: Request, res: Response) => {
    try {
      const { url } = req.body;
      
      if (!url) {
        return res.status(400).json({ message: "URL is required" });
      }

      // For now, create a template guide that can be manually updated
      const currentDate = new Date();
      const month = currentDate.toLocaleString('default', { month: 'long' });
      const year = currentDate.getFullYear();
      
      const { createSimpleMonthlyGuide } = await import('./scripts/simpleMonthlyGuide');
      const result = await createSimpleMonthlyGuide(
        month,
        year,
        'Northern',
        `${month} ${year}: Astronomy Highlights`,
        `Featured celestial objects and viewing opportunities for ${month} ${year}. Content imported from: ${url}`,
        []
      );
      
      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: `Failed to update monthly guide: ${error instanceof Error ? error.message : 'Unknown error'}`,
        objectsAdded: 0,
        guideUpdated: false
      });
    }
  });

  app.post("/api/admin/manual-monthly-guide", async (req: Request, res: Response) => {
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

      res.json({
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
  });

  app.post("/api/admin/create-july-guide", async (req: Request, res: Response) => {
    try {
      // Create July 2025 guide with authentic objects from High Point Scientific video
      const featuredObjects = [
        {
          name: "Jupiter",
          type: "planet",
          description: "The largest planet in our solar system, Jupiter is prominently visible in the summer sky. Observable throughout the night with its four largest moons: Io, Europa, Ganymede, and Callisto.",
          constellation: "Gemini",
          magnitude: "-2.5",
          coordinates: "RA: Variable | Dec: Variable",
          visibility: "Excellent visibility all night",
          tips: "Use medium magnification to see the Great Red Spot and cloud bands. Look for the four Galilean moons changing positions nightly."
        },
        {
          name: "Saturn",
          type: "planet", 
          description: "The ringed planet Saturn reaches opposition in July, making it the perfect time for observation. The rings are beautifully tilted, showing their structure clearly.",
          constellation: "Aquarius",
          magnitude: "0.1",
          coordinates: "RA: Variable | Dec: Variable",
          visibility: "Best viewing after 10 PM",
          tips: "Even small telescopes will show Saturn's rings. Look for the Cassini Division in the rings and the moon Titan."
        },
        {
          name: "Ring Nebula (M57)",
          type: "nebula",
          description: "A classic planetary nebula in Lyra, often called the 'donut in the sky.' This is one of the most famous deep-sky objects for summer observing.",
          constellation: "Lyra",
          magnitude: "8.8",
          coordinates: "RA: 18h 53m 35s | Dec: +33° 01′ 45″",
          visibility: "Visible with binoculars, spectacular in telescopes",
          tips: "Use medium to high magnification to see the ring structure. A nebula filter can enhance the view significantly."
        },
        {
          name: "Great Globular Cluster in Hercules (M13)",
          type: "star_cluster",
          description: "The finest globular cluster visible from northern latitudes. Contains over 300,000 stars packed into a sphere about 145 light-years across.",
          constellation: "Hercules",
          magnitude: "5.8",
          coordinates: "RA: 16h 41m 42s | Dec: +36° 27′ 37″",
          visibility: "Visible to naked eye in dark skies, magnificent in telescopes",
          tips: "Start with low magnification to see the full cluster, then zoom in to resolve individual stars at the edges."
        },
        {
          name: "Double-Double Star (ε Lyrae)",
          type: "double_star",
          description: "A famous multiple star system in Lyra. What appears as a double star to the naked eye resolves into four stars with a telescope - a double-double.",
          constellation: "Lyra",
          magnitude: "5.0",
          coordinates: "RA: 18h 44m 20s | Dec: +39° 40′ 12″",
          visibility: "Easy target for all telescope sizes",
          tips: "Use high magnification to split each pair. Good test of telescope optics and atmospheric seeing."
        },
        {
          name: "Albireo (β Cygni)",
          type: "double_star",
          description: "One of the most beautiful double stars in the sky, showing striking color contrast between a golden-yellow primary and blue-green secondary star.",
          constellation: "Cygnus",
          magnitude: "3.1",
          coordinates: "RA: 19h 30m 43s | Dec: +27° 57′ 35″",
          visibility: "Easy target, beautiful in any telescope",
          tips: "Any magnification will split this pair. The color contrast is stunning and makes this a crowd favorite."
        }
      ];

      let objectsAdded = 0;
      
      // Helper function to map types
      const mapObjectType = (type: string): string => {
        const typeMap: { [key: string]: string } = {
          'galaxy': 'galaxy',
          'nebula': 'nebula',
          'planet': 'planet',
          'star_cluster': 'star_cluster',
          'double_star': 'double_star',
          'star': 'double_star',
          'moon': 'moon',
          'meteor_shower': 'other',
          'comet': 'other'
        };
        return typeMap[type.toLowerCase()] || 'other';
      };

      // Helper function for eyepiece recommendations
      const getRecommendedEyepiece = (type: string): string => {
        const eyepieceMap: { [key: string]: string } = {
          'planet': 'High power (6-10mm) for planetary detail',
          'nebula': 'Medium power (12-20mm) with nebula filter',
          'star_cluster': 'Low to medium power (20-40mm) for full cluster view',
          'double_star': 'High power (6-12mm) to split close pairs',
          'galaxy': 'Low to medium power (20-40mm) for extended objects'
        };
        return eyepieceMap[type] || 'Medium power recommended';
      };

      // Add objects to database
      for (const obj of featuredObjects) {
        const celestialObject = {
          name: obj.name,
          type: mapObjectType(obj.type),
          description: obj.description,
          coordinates: obj.coordinates,
          bestViewingTime: obj.visibility,
          imageUrl: `https://images.unsplash.com/photo-1446776877081-d282a0f896e2?auto=format&fit=crop&w=800&h=500`,
          visibilityRating: obj.visibility,
          information: obj.tips,
          constellation: obj.constellation,
          magnitude: obj.magnitude,
          hemisphere: 'Northern',
          recommendedEyepiece: getRecommendedEyepiece(obj.type),
          month: 'July'
        };
        
        try {
          const existingObject = await storage.getCelestialObjectByName(obj.name);
          if (!existingObject) {
            await storage.createCelestialObject(celestialObject);
            console.log(`✓ Added ${obj.name} (${obj.type})`);
            objectsAdded++;
          } else {
            console.log(`⚠ Skipped ${obj.name} (already exists)`);
          }
        } catch (error) {
          console.log(`⚠ Error processing ${obj.name}: ${error}`);
        }
      }

      res.json({
        success: true,
        message: `Successfully created July 2025 guide with ${objectsAdded} featured objects from High Point Scientific video`,
        objectsAdded,
        guideUpdated: true
      });
      
    } catch (error) {
      console.error("Error creating July 2025 guide:", error);
      res.status(500).json({
        success: false,
        message: `Failed to create July guide: ${error instanceof Error ? error.message : 'Unknown error'}`,
        objectsAdded: 0,
        guideUpdated: false
      });
    }
  });

  // NASA Image Update Routes
  app.post("/api/admin/update-object-image/:id", async (req: Request, res: Response) => {
    try {
      const objectId = parseInt(req.params.id);
      if (isNaN(objectId)) {
        return res.status(400).json({ 
          success: false, 
          message: "Invalid object ID" 
        });
      }

      const { updateCelestialObjectImage } = await import("./services/nasaImages");
      const result = await updateCelestialObjectImage(objectId);
      
      if (result.success) {
        res.json(result);
      } else {
        res.status(404).json(result);
      }
    } catch (error) {
      console.error("Error updating celestial object image:", error);
      res.status(500).json({ 
        success: false, 
        message: `Failed to update image: ${error instanceof Error ? error.message : 'Unknown error'}` 
      });
    }
  });

  app.post("/api/admin/update-all-images", async (req: Request, res: Response) => {
    try {
      const { forceUpdate } = req.body;
      const { updateAllCelestialObjectImages } = await import("./services/nasaImages");
      const result = await updateAllCelestialObjectImages(forceUpdate || false);
      res.json(result);
    } catch (error) {
      console.error("Error updating all celestial object images:", error);
      res.status(500).json({ 
        success: false, 
        message: `Failed to update images: ${error instanceof Error ? error.message : 'Unknown error'}` 
      });
    }
  });

  app.get("/api/admin/preview-nasa-image/:objectName", async (req: Request, res: Response) => {
    try {
      const objectName = decodeURIComponent(req.params.objectName);
      const { previewNasaImageSearch } = await import("./services/nasaImages");
      const result = await previewNasaImageSearch(objectName);
      res.json(result);
    } catch (error) {
      console.error("Error previewing NASA image search:", error);
      res.status(500).json({ 
        success: false, 
        message: `Failed to preview image search: ${error instanceof Error ? error.message : 'Unknown error'}` 
      });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}

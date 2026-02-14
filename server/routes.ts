import type { Express, Request, Response } from "express";
import { z } from "zod";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { fetchApod } from "./services/nasaApi";
import { searchCelestialObjectImage, updateCelestialObjectImage, updateAllCelestialObjectImages } from "./services/nasaImages";
import { seedDatabase, getCurrentMonth, getCurrentYear } from "./services/celestialObjects";
import { celestialObjectExists, cleanupDuplicateCelestialObjects } from "./services/cleanupDuplicates";
import {
  insertObservationSchema,
  insertCelestialObjectSchema,
  celestialObjectTypes
} from "@shared/schema";
import { extractCelestialObjectsFromText } from "./services/objectExtractor";
import { autoPopulatePreview } from "./services/guideAutoPopulate";

export async function registerRoutes(app: Express, options?: { skipSeeding?: boolean }): Promise<Server | null> {
  // Skip seeding in serverless environments (run npm run db:seed separately)
  const isServerless = process.env.VERCEL === '1' || options?.skipSeeding;

  if (!isServerless) {
    // Seed the database with initial data
    await seedDatabase();

    // Clean up any duplicate celestial objects
    await cleanupDuplicateCelestialObjects();
  }

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
      const { type } = req.query;

      // Filter by type if provided
      if (type) {
        const objects = await storage.getCelestialObjectsByType(type as string);
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
      // Search for NASA or Wikipedia image if name is provided
      let imageUrl = req.body.imageUrl;
      let imageSource = 'fallback';

      if (req.body.name) {
        try {
          console.log(`🔍 Searching for image (NASA/Wikipedia) for: ${req.body.name}`);
          const result = await searchCelestialObjectImage(req.body.name) as any;
          if (result.success && result.image_url) {
            imageUrl = result.image_url;
            imageSource = result.source || 'unknown';
            console.log(`✓ Found image for ${req.body.name} [${imageSource}]: ${imageUrl}`);
          } else {
            console.log(`⚠ No image found for ${req.body.name}: ${result.error || 'No image available'}`);
          }
        } catch (error) {
          console.error(`❌ Image search failed for ${req.body.name}:`, error);
        }
      }

      // If no image was found, use type-specific fallback
      if (!imageUrl) {
        const objectType = req.body.type || 'galaxy';
        const fallbackImages = {
          'galaxy': 'https://images.unsplash.com/photo-1502134249126-9f3755a50d78?auto=format&fit=crop&w=800&h=500',
          'nebula': 'https://images.unsplash.com/photo-1502134249126-9f3755a50d78?auto=format&fit=crop&w=800&h=500',
          'star cluster': 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?auto=format&fit=crop&w=800&h=500',
          'planet': 'https://images.unsplash.com/photo-1614728263952-84ea256f9679?auto=format&fit=crop&w=800&h=500',
          'star': 'https://images.unsplash.com/photo-1502134249126-9f3755a50d78?auto=format&fit=crop&w=800&h=500',
          'double star': 'https://images.unsplash.com/photo-1502134249126-9f3755a50d78?auto=format&fit=crop&w=800&h=500',
          'variable star': 'https://images.unsplash.com/photo-1502134249126-9f3755a50d78?auto=format&fit=crop&w=800&h=500'
        };
        const key = (objectType.toLowerCase() as keyof typeof fallbackImages);
        imageUrl = fallbackImages[key] || fallbackImages['galaxy'];
        imageSource = 'fallback';
        console.log(`📸 Using fallback image for type "${objectType}": ${imageUrl}`);
      }

      // Validate request body
      const validatedData = insertCelestialObjectSchema.parse({
        ...req.body,
        // Set default values for required fields if they're not provided
        visibilityRating: req.body.visibilityRating || "Custom",
        information: req.body.information || "Custom celestial object",
        // Use best image found
        imageUrl: imageUrl,
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

      // Include information about image source in response
      const response = {
        ...newObject,
        _debug: {
          imageSource
        }
      };

      res.status(201).json(response);
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

  // Update celestial object image with NASA image
  app.patch("/api/celestial-objects/:id/update-image", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }

      const result = await updateCelestialObjectImage(id);

      if (result.success) {
        res.json(result);
      } else {
        res.status(404).json(result);
      }
    } catch (error) {
      res.status(500).json({
        message: `Failed to update celestial object image: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  });

  // Update all celestial object images with NASA images
  app.post("/api/celestial-objects/update-all-images", async (req: Request, res: Response) => {
    try {
      const { forceUpdate } = req.body;
      const result = await updateAllCelestialObjectImages(forceUpdate || false);
      res.json(result);
    } catch (error) {
      res.status(500).json({
        message: `Failed to update all celestial object images: ${error instanceof Error ? error.message : 'Unknown error'}`
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

  // Get guide objects with details
  app.get("/api/monthly-guide/:id/objects", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }

      const guideObjects = await storage.getGuideObjectsWithDetails(id);
      // Return flat CelestialObject array (frontend expects CelestialObject[])
      const objects = guideObjects.map(go => go.object);
      res.json(objects);
    } catch (error) {
      res.status(500).json({
        message: `Failed to get guide objects: ${error instanceof Error ? error.message : 'Unknown error'}`
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

      const currentDate = new Date();
      const month = currentDate.toLocaleString('default', { month: 'long' });
      const year = currentDate.getFullYear();

      // Fetch and parse the URL content
      console.log(`Fetching content from: ${url}`);
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; StellarDiary/1.0)',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        }
      });

      if (!response.ok) {
        return res.status(400).json({
          success: false,
          message: `Failed to fetch URL: ${response.status} ${response.statusText}`,
          objectsAdded: 0
        });
      }

      const html = await response.text();

      // Extract text content (strip HTML)
      const textContent = html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      // Extract celestial objects from content
      const extractedObjects = extractCelestialObjectsFromText(textContent, month);
      console.log(`Extracted ${extractedObjects.length} celestial objects from article`);

      // Add objects to database with NASA/Wikipedia image search
      let objectsAdded = 0;
      for (const obj of extractedObjects) {
        try {
          const existing = await storage.getCelestialObjectByName(obj.name);
          if (!existing) {
            // Search for image from NASA or Wikipedia
            let imageUrl = 'https://images.unsplash.com/photo-1446776877081-d282a0f896e2?auto=format&fit=crop&w=800&h=500';
            let imageSource = 'fallback';

            try {
              console.log(`🔍 Searching for image: ${obj.name}`);
              const imageResult = await searchCelestialObjectImage(obj.name);
              if (imageResult.success && imageResult.image_url) {
                imageUrl = imageResult.image_url;
                imageSource = imageResult.source || 'unknown';
                console.log(`✓ Found image for ${obj.name} [${imageSource}]: ${imageUrl}`);
              } else {
                console.log(`⚠ No image found for ${obj.name}, using fallback`);
              }
            } catch (imgErr) {
              console.log(`⚠ Image search failed for ${obj.name}: ${imgErr}`);
            }

            await storage.createCelestialObject({
              name: obj.name,
              type: obj.type,
              description: obj.description,
              imageUrl: imageUrl,
              constellation: obj.constellation || null,
              magnitude: obj.magnitude || null,
            });
            objectsAdded++;
            console.log(`✓ Added: ${obj.name} [image: ${imageSource}]`);

            // Small delay between API calls to be respectful
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        } catch (err) {
          console.log(`Skipped ${obj.name}: ${err}`);
        }
      }

      // Create or update monthly guide
      const guides = await storage.getAllMonthlyGuides();
      const existingGuide = guides.find(g =>
        g.month === month && g.year === year && g.hemisphere === 'Northern'
      );

      if (existingGuide) {
        await storage.updateMonthlyGuide(existingGuide.id, {
          headline: `${month} ${year}: Astronomy Highlights`,
          description: `Featured celestial objects and viewing opportunities for ${month} ${year}. Content imported from: ${url}`,
        });
      } else {
        await storage.createMonthlyGuide({
          month,
          year,
          hemisphere: 'Northern',
          headline: `${month} ${year}: Astronomy Highlights`,
          description: `Featured celestial objects and viewing opportunities for ${month} ${year}. Content imported from: ${url}`,
          videoUrls: [],
          sources: [url],
        });
      }

      res.json({
        success: true,
        message: `Successfully imported ${objectsAdded} celestial objects for ${month} ${year}`,
        objectsAdded,
        guideUpdated: true
      });
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

  // Auto-populate preview - returns suggested objects from all 3 sources
  app.post("/api/admin/auto-populate-preview", async (req: Request, res: Response) => {
    try {
      const { month, year } = req.body;

      if (!month || !year) {
        return res.status(400).json({ message: "Month and year are required" });
      }

      const preview = await autoPopulatePreview(month, parseInt(year));
      res.json(preview);
    } catch (error) {
      res.status(500).json({
        message: `Failed to generate auto-populate preview: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  });

  // Auto-populate confirm - commits selected objects/videos to DB
  app.post("/api/admin/auto-populate-confirm", async (req: Request, res: Response) => {
    try {
      const { month, year, hemisphere, headline, description, videoUrls, sources, objects } = req.body;

      if (!month || !year || !headline || !description || !objects) {
        return res.status(400).json({
          success: false,
          message: "Month, year, headline, description, and objects are required",
        });
      }

      const yearNum = parseInt(year);

      // Create or update monthly guide
      const guides = await storage.getAllMonthlyGuides();
      const existingGuide = guides.find(g =>
        g.month === month && g.year === yearNum && g.hemisphere === (hemisphere || 'Northern')
      );

      let guide;
      if (existingGuide) {
        guide = await storage.updateMonthlyGuide(existingGuide.id, {
          headline,
          description,
          videoUrls: videoUrls || [],
          sources: sources || [],
        });
        // Clear existing guide objects to re-link
        await storage.deleteGuideObjectsByGuide(existingGuide.id);
      } else {
        guide = await storage.createMonthlyGuide({
          month,
          year: yearNum,
          hemisphere: hemisphere || 'Northern',
          headline,
          description,
          videoUrls: videoUrls || [],
          sources: sources || [],
        });
      }

      if (!guide) {
        return res.status(500).json({ success: false, message: "Failed to create/update guide" });
      }

      // Process each selected object
      let objectsAdded = 0;
      let objectsLinked = 0;

      for (let i = 0; i < objects.length; i++) {
        const obj = objects[i];
        try {
          let dbObject = await storage.getCelestialObjectByName(obj.name);

          if (!dbObject) {
            // Create new celestial object with image search
            let imageUrl = 'https://images.unsplash.com/photo-1446776877081-d282a0f896e2?auto=format&fit=crop&w=800&h=500';

            try {
              const imageResult = await searchCelestialObjectImage(obj.name) as any;
              if (imageResult.success && imageResult.image_url) {
                imageUrl = imageResult.image_url;
              }
            } catch {
              // Use fallback image
            }

            dbObject = await storage.createCelestialObject({
              name: obj.name,
              type: obj.type,
              description: obj.description,
              imageUrl,
              constellation: obj.constellation || null,
              magnitude: obj.magnitude || null,
            });
            objectsAdded++;

            // Small delay between image API calls
            await new Promise(resolve => setTimeout(resolve, 300));
          }

          // Link object to guide
          await storage.createGuideObject({
            guideId: guide.id,
            objectId: dbObject.id,
            viewingTips: obj.viewingTips || null,
            highlights: obj.highlights || null,
            sortOrder: i,
          });
          objectsLinked++;
        } catch (err) {
          console.log(`Skipped ${obj.name}: ${err}`);
        }
      }

      res.json({
        success: true,
        message: `Guide created for ${month} ${year} with ${objectsLinked} objects (${objectsAdded} new)`,
        guideId: guide.id,
        objectsAdded,
        objectsLinked,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: `Failed to confirm auto-populate: ${error instanceof Error ? error.message : 'Unknown error'}`,
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

  // Refresh images for objects that still have placeholder/unsplash images
  app.post("/api/admin/refresh-placeholder-images", async (req: Request, res: Response) => {
    try {
      const allObjects = await storage.getAllCelestialObjects();
      const placeholderObjects = allObjects.filter(obj =>
        !obj.imageUrl || obj.imageUrl.includes('unsplash.com') || obj.imageUrl.includes('placeholder')
      );

      if (placeholderObjects.length === 0) {
        return res.json({ success: true, message: "No objects with placeholder images found", updated: 0, total: allObjects.length });
      }

      let updated = 0;
      let failed = 0;
      for (const obj of placeholderObjects) {
        try {
          const imageResult = await searchCelestialObjectImage(obj.name);
          if (imageResult.success && imageResult.image_url) {
            await storage.updateCelestialObject(obj.id, { imageUrl: imageResult.image_url });
            updated++;
            console.log(`Updated image for ${obj.name}: ${imageResult.source}`);
          } else {
            failed++;
          }
          // Rate limit
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch {
          failed++;
        }
      }

      res.json({
        success: true,
        message: `Updated ${updated} of ${placeholderObjects.length} placeholder images (${failed} failed)`,
        updated,
        failed,
        total: placeholderObjects.length,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: `Failed to refresh images: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }
  });

  app.get("/api/admin/preview-nasa-image/:objectName", async (req: Request, res: Response) => {
    try {
      const objectName = decodeURIComponent(req.params.objectName);
      const { previewCelestialObjectImageSearch } = await import("./services/nasaImages");
      const result = await previewCelestialObjectImageSearch(objectName);
      res.json(result);
    } catch (error) {
      console.error("Error previewing NASA image search:", error);
      res.status(500).json({
        success: false,
        message: `Failed to preview image search: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  });

  // For serverless, we don't need an HTTP server
  if (isServerless) {
    return null;
  }

  const httpServer = createServer(app);
  return httpServer;
}

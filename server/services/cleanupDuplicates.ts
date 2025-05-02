import { storage } from "../storage";
import { db } from "../db";
import { eq } from "drizzle-orm";
import { celestialObjects, CelestialObject } from "@shared/schema";

/**
 * Clean up duplicate celestial objects from the database
 * - Removes duplicate objects with imageUrl from Unsplash
 * - Keeps only one instance of each object name
 */
export async function cleanupDuplicateCelestialObjects(): Promise<void> {
  try {
    console.log("Starting cleanup of duplicate celestial objects...");
    
    // Get all celestial objects
    const allObjects = await storage.getAllCelestialObjects();
    
    // Group by name to find duplicates
    const objectsByName = new Map<string, CelestialObject[]>();
    
    allObjects.forEach(obj => {
      if (!objectsByName.has(obj.name)) {
        objectsByName.set(obj.name, []);
      }
      objectsByName.get(obj.name)!.push(obj);
    });
    
    // Find and clean up duplicates
    let removedCount = 0;
    
    // Convert Map entries to array for iteration to avoid downlevelIteration flag issue
    const entries = Array.from(objectsByName.entries());
    
    for (const [name, objects] of entries) {
      if (objects.length > 1) {
        console.log(`Found ${objects.length} entries for "${name}"`);
        
        // Sort objects to prefer non-Unsplash images
        // Unsplash images contain "unsplash.com" in the URL
        objects.sort((a: CelestialObject, b: CelestialObject) => {
          const aIsUnsplash = a.imageUrl?.includes('unsplash.com') || false;
          const bIsUnsplash = b.imageUrl?.includes('unsplash.com') || false;
          
          if (aIsUnsplash && !bIsUnsplash) return 1; // a should come after b
          if (!aIsUnsplash && bIsUnsplash) return -1; // a should come before b
          return 0; // keep original order
        });
        
        // Keep the first object (non-Unsplash if available) and delete the rest
        const keepObject = objects[0];
        const objectsToRemove = objects.slice(1);
        
        console.log(`Keeping "${name}" with ID ${keepObject.id} and image ${keepObject.imageUrl}`);
        
        // Delete duplicates
        for (const objToRemove of objectsToRemove) {
          console.log(`Removing duplicate "${name}" with ID ${objToRemove.id}`);
          await storage.deleteCelestialObject(objToRemove.id);
          removedCount++;
        }
      }
    }
    
    console.log(`Cleanup complete. Removed ${removedCount} duplicate celestial objects.`);
  } catch (error) {
    console.error("Error during duplicate cleanup:", error);
    throw error;
  }
}

/**
 * Check if a celestial object with the same name already exists
 * @param name Name of the celestial object to check
 * @returns True if the object exists, false otherwise
 */
export async function celestialObjectExists(name: string): Promise<boolean> {
  const existingObject = await storage.getCelestialObjectByName(name);
  return !!existingObject;
}
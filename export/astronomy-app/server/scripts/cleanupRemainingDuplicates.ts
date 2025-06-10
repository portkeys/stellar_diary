import { storage } from "../storage";
import { db } from "../db";
import { celestialObjects } from "@shared/schema";
import { eq, and, like } from "drizzle-orm";

/**
 * One-time script to clean up the remaining duplicates we've identified
 */
async function cleanupRemainingDuplicates() {
  try {
    console.log("Starting manual cleanup of remaining duplicate objects...");
    
    // Remove duplicate Leo Triplet (keeping the one with better image)
    const leoTripletUnsplash = await db.select().from(celestialObjects)
      .where(
        and(
          eq(celestialObjects.name, "Leo Triplet"),
          like(celestialObjects.imageUrl, "%unsplash%")
        )
      );
    
    if (leoTripletUnsplash.length > 0) {
      console.log(`Removing duplicate "Leo Triplet" with ID ${leoTripletUnsplash[0].id}`);
      await storage.deleteCelestialObject(leoTripletUnsplash[0].id);
    }
    
    // Find all objects with unsplash images
    const objectsWithUnsplashImage = await db.select().from(celestialObjects)
      .where(like(celestialObjects.imageUrl, "%unsplash%"));
    
    console.log(`Found ${objectsWithUnsplashImage.length} objects with Unsplash images that could be improved in the future:`);
    objectsWithUnsplashImage.forEach(obj => {
      console.log(`- ${obj.name} (ID: ${obj.id})`);
    });

    // Clean up other known duplicates by name similarity
    // This looks for similar objects where one has a more detailed name like "Object (M##)"
    // and the other has just "Object" - we'll keep the more detailed one
    const allObjects = await storage.getAllCelestialObjects();
    const namePrefixMap = new Map<string, number[]>();
    
    // Group objects by name prefix
    allObjects.forEach(obj => {
      // Get the object name without the catalog designation (e.g., "Andromeda Galaxy" from "Andromeda Galaxy (M31)")
      const namePrefix = obj.name.split(/\s*\(/).shift()?.trim() || obj.name;
      
      if (!namePrefixMap.has(namePrefix)) {
        namePrefixMap.set(namePrefix, []);
      }
      namePrefixMap.get(namePrefix)?.push(obj.id);
    });
    
    // Check for prefix matches where we have both a base name and a full name (with designation)
    // Convert Map entries to array for iteration to avoid downlevelIteration flag issue
    const entries = Array.from(namePrefixMap.entries());
    for (const [namePrefix, ids] of entries) {
      if (ids.length > 1) {
        // Check if one of the objects has the exact prefix as its name (the simple version)
        // and another has a more detailed name (with catalog designation)
        const simpleNameObjects = allObjects.filter(obj => obj.name === namePrefix);
        const detailedNameObjects = allObjects.filter(obj => 
          obj.name !== namePrefix && obj.name.startsWith(namePrefix)
        );
        
        if (simpleNameObjects.length > 0 && detailedNameObjects.length > 0) {
          // Keep the detailed name and delete the simple one
          for (const objToDelete of simpleNameObjects) {
            console.log(`Removing duplicate with simple name "${objToDelete.name}" (ID: ${objToDelete.id}) in favor of detailed name "${detailedNameObjects[0].name}"`);
            await storage.deleteCelestialObject(objToDelete.id);
          }
        }
      }
    }
    
    console.log("Manual cleanup complete");
  } catch (error) {
    console.error("Error during manual cleanup:", error);
  }
}

// Execute the function
(async () => {
  await cleanupRemainingDuplicates();
  console.log("Cleanup script completed");
  process.exit(0);
})();
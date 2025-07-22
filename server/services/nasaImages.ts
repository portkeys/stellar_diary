import { promisify } from "util";
import { exec } from "child_process";
import path from "path";
import { db } from "../db";
import { celestialObjects } from "@shared/schema";
import { eq } from "drizzle-orm";

const execPromise = promisify(exec);

interface NasaImageSearchResult {
  success: boolean;
  object_name: string;
  image_url: string | null;
  error?: string;
  metadata?: {
    title: string;
    description: string;
    date_created: string;
    center: string;
    nasa_id: string;
  };
}

/**
 * Search for an image for a celestial object using the Python script (NASA or Wikipedia)
 * @param objectName Name of the celestial object to search for
 * @returns Promise with search result data
 */
async function searchCelestialObjectImageWithFallback(objectName: string): Promise<NasaImageSearchResult> {
  const scriptPath = path.join(process.cwd(), 'server', 'services', 'nasa_images.py');
  const cmd = `python3 "${scriptPath}" "${objectName}"`;
  
  console.log(`Searching for image (NASA/Wikipedia) for: ${objectName}`);
  
  try {
    const { stdout, stderr } = await execPromise(cmd);
    
    if (stderr) {
      console.error(`Image search warning: ${stderr}`);
    }
    
    const result = JSON.parse(stdout);
    return result;
  } catch (error) {
    console.error(`Error searching for image for ${objectName}:`, error);
    return {
      success: false,
      object_name: objectName,
      image_url: null,
      error: `Failed to search for image: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Update the image URL for a specific celestial object using NASA image search
 * @param objectId Database ID of the celestial object
 * @returns Promise with update result
 */
export async function updateCelestialObjectImage(objectId: number): Promise<{
  success: boolean;
  message: string;
  objectName?: string;
  newImageUrl?: string;
}> {
  try {
    // Get the celestial object from database
    const celestialObject = await db.select().from(celestialObjects).where(eq(celestialObjects.id, objectId));
    
    if (celestialObject.length === 0) {
      return {
        success: false,
        message: `Celestial object with ID ${objectId} not found`
      };
    }
    
    const object = celestialObject[0];
    const objectName = object.name;
    
    // Search for image (NASA or Wikipedia)
    const searchResult = await searchCelestialObjectImageWithFallback(objectName);
    
    if (!searchResult.success || !searchResult.image_url) {
      return {
        success: false,
        message: `No image found for ${objectName}: ${searchResult.error || 'Unknown error'}`,
        objectName
      };
    }
    
    // Update the database with the new image URL
    await db.update(celestialObjects)
      .set({ imageUrl: searchResult.image_url })
      .where(eq(celestialObjects.id, objectId));
    
    console.log(`✓ Updated image for ${objectName}: ${searchResult.image_url}`);
    
    return {
      success: true,
      message: `Successfully updated image for ${objectName}`,
      objectName,
      newImageUrl: searchResult.image_url
    };
    
  } catch (error) {
    console.error(`Error updating celestial object image:`, error);
    return {
      success: false,
      message: `Failed to update image: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Update images for all celestial objects that have inaccurate or missing images
 * @param forceUpdate If true, update all objects regardless of current image URL
 * @returns Promise with batch update results
 */
export async function updateAllCelestialObjectImages(forceUpdate: boolean = false): Promise<{
  success: boolean;
  message: string;
  totalProcessed: number;
  successCount: number;
  failureCount: number;
  results: Array<{
    objectName: string;
    success: boolean;
    message: string;
    newImageUrl?: string;
  }>;
}> {
  try {
    // Get all celestial objects
    const allObjects = await db.select().from(celestialObjects);
    
    if (allObjects.length === 0) {
      return {
        success: true,
        message: "No celestial objects found in database",
        totalProcessed: 0,
        successCount: 0,
        failureCount: 0,
        results: []
      };
    }
    
    // Filter objects that need image updates
    const objectsToUpdate = forceUpdate 
      ? allObjects 
      : allObjects.filter(obj => 
          !obj.imageUrl || 
          obj.imageUrl.includes('unsplash.com') || 
          obj.imageUrl.includes('placeholder') ||
          obj.imageUrl === ""
        );
    
    console.log(`Updating images for ${objectsToUpdate.length} celestial objects...`);
    
    const results = [];
    let successCount = 0;
    let failureCount = 0;
    
    // Process each object with a small delay to avoid overwhelming the API
    for (const object of objectsToUpdate) {
      const result = await updateCelestialObjectImage(object.id);
      
      results.push({
        objectName: object.name,
        success: result.success,
        message: result.message,
        newImageUrl: result.newImageUrl
      });
      
      if (result.success) {
        successCount++;
      } else {
        failureCount++;
      }
      
      // Small delay between requests to be respectful to NASA/Wikipedia API
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    return {
      success: true,
      message: `Processed ${objectsToUpdate.length} objects`,
      totalProcessed: objectsToUpdate.length,
      successCount,
      failureCount,
      results
    };
  } catch (error) {
    console.error(`Error updating all celestial object images:`, error);
    return {
      success: false,
      message: `Failed to update all images: ${error instanceof Error ? error.message : 'Unknown error'}`,
      totalProcessed: 0,
      successCount: 0,
      failureCount: 0,
      results: []
    };
  }
}

/**
 * Preview NASA image search results without updating the database
 * @param objectName Name of the celestial object to search for
 * @returns Promise with search preview data
 */
export async function previewCelestialObjectImageSearch(objectName: string): Promise<NasaImageSearchResult> {
  return await searchCelestialObjectImageWithFallback(objectName);
}

/**
 * Search for a celestial object image using NASA API
 * @param objectName Name of the celestial object to search for
 * @returns Promise with search result data
 */
export async function searchCelestialObjectImage(objectName: string): Promise<NasaImageSearchResult> {
  return await searchCelestialObjectImageWithFallback(objectName);
}
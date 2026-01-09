/**
 * NASA Images Integration
 *
 * Provides celestial object image search and update functionality.
 * Uses Node.js native fetch for NASA and Wikipedia APIs (Vercel compatible).
 */

import { db } from "../db";
import { celestialObjects } from "@shared/schema";
import { eq } from "drizzle-orm";
import {
  searchCelestialObjectImage as searchImage,
  previewCelestialObjectImageSearch as previewSearch,
  type NasaImageSearchResult
} from "./nasaImagesNode";

// Re-export types
export type { NasaImageSearchResult };

/**
 * Search for a celestial object image using NASA/Wikipedia APIs
 */
export async function searchCelestialObjectImage(objectName: string): Promise<NasaImageSearchResult> {
  return searchImage(objectName);
}

/**
 * Preview NASA image search results without updating the database
 */
export async function previewCelestialObjectImageSearch(objectName: string): Promise<NasaImageSearchResult> {
  return previewSearch(objectName);
}

/**
 * Update the image URL for a specific celestial object using NASA image search
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
    const searchResult = await searchCelestialObjectImage(objectName);

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

/**
 * Update Messier Objects with 2MASS Images
 *
 * This script updates all Messier catalog objects in the database with images
 * from the 2MASS (Two Micron All Sky Survey) gallery.
 *
 * Usage: npx tsx scripts/update2MASSImages.ts
 *
 * Source: https://www.ipac.caltech.edu/2mass/gallery/messiercat.html
 */

import { db } from "../server/db";
import { celestialObjects } from "../shared/schema";
import { eq } from "drizzle-orm";
import {
  MESSIER_2MASS_IMAGES,
  TWOMASS_BASE_URL,
  TWOMASS_ATTRIBUTION,
  extractMessierNumber,
} from "../server/data/messier2mass";

async function update2MASSImages() {
  console.log("Starting 2MASS image update for Messier objects...\n");
  console.log("Attribution:", TWOMASS_ATTRIBUTION);
  console.log("\n" + "=".repeat(60) + "\n");

  // Get all celestial objects from the database
  const allObjects = await db.select().from(celestialObjects);
  console.log(`Found ${allObjects.length} total celestial objects in database\n`);

  let updatedCount = 0;
  let skippedCount = 0;
  const updatedObjects: string[] = [];
  const skippedObjects: string[] = [];

  for (const obj of allObjects) {
    const messierNumber = extractMessierNumber(obj.name);

    if (!messierNumber) {
      // Not a Messier object, skip
      continue;
    }

    const imageFilename = MESSIER_2MASS_IMAGES[messierNumber];

    if (!imageFilename) {
      console.log(`⚠️  No 2MASS image found for ${obj.name} (${messierNumber})`);
      skippedObjects.push(obj.name);
      skippedCount++;
      continue;
    }

    const newImageUrl = `${TWOMASS_BASE_URL}${imageFilename}`;

    // Update the object with the new image URL
    await db
      .update(celestialObjects)
      .set({ imageUrl: newImageUrl })
      .where(eq(celestialObjects.id, obj.id));

    console.log(`✅ Updated ${obj.name}`);
    console.log(`   Old: ${obj.imageUrl || "(none)"}`);
    console.log(`   New: ${newImageUrl}\n`);

    updatedObjects.push(obj.name);
    updatedCount++;
  }

  console.log("\n" + "=".repeat(60));
  console.log("\nSummary:");
  console.log(`  ✅ Updated: ${updatedCount} objects`);
  console.log(`  ⚠️  Skipped: ${skippedCount} objects (no 2MASS image available)`);

  if (updatedObjects.length > 0) {
    console.log("\nUpdated objects:");
    updatedObjects.forEach((name) => console.log(`  - ${name}`));
  }

  if (skippedObjects.length > 0) {
    console.log("\nSkipped objects (no 2MASS image):");
    skippedObjects.forEach((name) => console.log(`  - ${name}`));
  }

  console.log("\n✨ Done!");
}

// Run the script
update2MASSImages()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error updating 2MASS images:", error);
    process.exit(1);
  });

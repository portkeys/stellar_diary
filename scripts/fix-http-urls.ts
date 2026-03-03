/**
 * Fix mixed content: update http:// NASA image URLs to https:// in the database.
 */
import { db } from "../server/db";
import { celestialObjects } from "../shared/schema";
import { like, sql } from "drizzle-orm";

async function fixHttpUrls() {
  console.log("Searching for celestial objects with http:// image URLs...");

  const httpObjects = await db
    .select({ id: celestialObjects.id, name: celestialObjects.name, imageUrl: celestialObjects.imageUrl })
    .from(celestialObjects)
    .where(like(celestialObjects.imageUrl, 'http://%'));

  console.log(`Found ${httpObjects.length} objects with http:// URLs`);

  if (httpObjects.length === 0) {
    console.log("Nothing to fix!");
    process.exit(0);
  }

  for (const obj of httpObjects) {
    const newUrl = obj.imageUrl!.replace(/^http:\/\//, 'https://');
    console.log(`  Fixing ${obj.name}: ${obj.imageUrl} -> ${newUrl}`);
    await db
      .update(celestialObjects)
      .set({ imageUrl: newUrl })
      .where(sql`${celestialObjects.id} = ${obj.id}`);
  }

  console.log(`\nDone! Fixed ${httpObjects.length} URLs.`);
  process.exit(0);
}

fixHttpUrls().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});

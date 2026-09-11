/**
 * One-time cleanup: merge celestial objects that share a catalog designation.
 *
 * Bare-name rows (e.g. "M15") created by guide auto-population are merged into the
 * descriptive row (e.g. "Great Pegasus Cluster (M15)"): guide links and observations
 * are repointed, then the bare row is deleted.
 *
 *   npx tsx --env-file=.env scripts/mergeDuplicateObjects.ts          # dry run
 *   npx tsx --env-file=.env scripts/mergeDuplicateObjects.ts --apply  # write changes
 */
import { db } from "../server/db";
import { celestialObjects, guideObjects, observations } from "../shared/schema";
import { extractCatalogIds } from "../shared/catalog";
import { eq } from "drizzle-orm";

const apply = process.argv.includes("--apply");

async function main() {
  const all = await db.select().from(celestialObjects);
  const bare = all.filter((o) => /^(M|NGC|IC)\s*\d+$/i.test(o.name.trim()));

  let merged = 0;
  for (const dup of bare) {
    const [id] = extractCatalogIds(dup.name);
    const canonical = all.find(
      (o) => o.id !== dup.id && !bare.includes(o) && extractCatalogIds(o.name)[0] === id
    );
    if (!canonical) continue;

    const links = await db.select().from(guideObjects).where(eq(guideObjects.objectId, dup.id));
    const obs = await db.select().from(observations).where(eq(observations.objectId, dup.id));
    console.log(
      `#${dup.id} "${dup.name}" -> #${canonical.id} "${canonical.name}"  (${links.length} guide links, ${obs.length} observations)`
    );

    if (apply) {
      for (const link of links) {
        const clash = await db.select().from(guideObjects)
          .where(eq(guideObjects.guideId, link.guideId));
        if (clash.some((l) => l.objectId === canonical.id)) {
          await db.delete(guideObjects).where(eq(guideObjects.id, link.id));
        } else {
          await db.update(guideObjects).set({ objectId: canonical.id }).where(eq(guideObjects.id, link.id));
        }
      }
      await db.update(observations).set({ objectId: canonical.id }).where(eq(observations.objectId, dup.id));
      await db.delete(celestialObjects).where(eq(celestialObjects.id, dup.id));
    }
    merged++;
  }
  console.log(`${apply ? "Merged" : "Would merge"} ${merged} duplicate object(s).`);
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });

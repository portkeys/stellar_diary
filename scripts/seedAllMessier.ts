/**
 * Seed All 110 Messier Objects with 2MASS Images
 *
 * This script adds all Messier catalog objects to the database with:
 * - Proper names and descriptions
 * - 2MASS atlas images
 * - Constellation and magnitude data
 *
 * Usage: npx tsx --env-file=.env scripts/seedAllMessier.ts
 */

import { db } from "../server/db";
import { celestialObjects } from "../shared/schema";
import { eq } from "drizzle-orm";
import { MESSIER_2MASS_IMAGES, TWOMASS_BASE_URL } from "../server/data/messier2mass";

interface MessierObject {
  messier: string;
  name: string;
  type: "galaxy" | "nebula" | "star_cluster" | "other";
  constellation: string;
  magnitude: string;
  description: string;
}

// Complete Messier catalog with descriptions
const MESSIER_CATALOG: MessierObject[] = [
  { messier: "M1", name: "Crab Nebula", type: "nebula", constellation: "Taurus", magnitude: "8.4", description: "A supernova remnant from the explosion recorded by Chinese astronomers in 1054 AD. Contains a pulsar at its center spinning 30 times per second." },
  { messier: "M2", name: "Globular Cluster in Aquarius", type: "star_cluster", constellation: "Aquarius", magnitude: "6.5", description: "One of the largest known globular clusters, containing about 150,000 stars in a sphere 175 light-years across." },
  { messier: "M3", name: "Globular Cluster in Canes Venatici", type: "star_cluster", constellation: "Canes Venatici", magnitude: "6.2", description: "Contains about half a million stars and is one of the brightest and best-studied globular clusters." },
  { messier: "M4", name: "Globular Cluster in Scorpius", type: "star_cluster", constellation: "Scorpius", magnitude: "5.6", description: "The nearest globular cluster to Earth at 7,200 light-years. Contains a distinct bar structure through its core." },
  { messier: "M5", name: "Globular Cluster in Serpens", type: "star_cluster", constellation: "Serpens", magnitude: "5.6", description: "One of the oldest globular clusters at 13 billion years. Contains over 100,000 stars." },
  { messier: "M6", name: "Butterfly Cluster", type: "star_cluster", constellation: "Scorpius", magnitude: "4.2", description: "An open cluster whose stars form a butterfly shape. Best viewed with binoculars or low power." },
  { messier: "M7", name: "Ptolemy Cluster", type: "star_cluster", constellation: "Scorpius", magnitude: "3.3", description: "A large, bright open cluster visible to the naked eye. Known since antiquity, recorded by Ptolemy in 130 AD." },
  { messier: "M8", name: "Lagoon Nebula", type: "nebula", constellation: "Sagittarius", magnitude: "6.0", description: "A giant emission nebula with an embedded open cluster. One of only two star-forming nebulae visible to the naked eye." },
  { messier: "M9", name: "Globular Cluster in Ophiuchus", type: "star_cluster", constellation: "Ophiuchus", magnitude: "7.7", description: "One of the nearer globular clusters to the galactic center at only 5,500 light-years from it." },
  { messier: "M10", name: "Globular Cluster in Ophiuchus", type: "star_cluster", constellation: "Ophiuchus", magnitude: "6.6", description: "A rich globular cluster that appears slightly elliptical. Located about 14,300 light-years away." },
  { messier: "M11", name: "Wild Duck Cluster", type: "star_cluster", constellation: "Scutum", magnitude: "6.3", description: "One of the richest and most compact open clusters known, containing about 2,900 stars." },
  { messier: "M12", name: "Globular Cluster in Ophiuchus", type: "star_cluster", constellation: "Ophiuchus", magnitude: "6.7", description: "A loose globular cluster with relatively few stars for its type. About 16,000 light-years distant." },
  { messier: "M13", name: "Great Hercules Cluster", type: "star_cluster", constellation: "Hercules", magnitude: "5.8", description: "The brightest globular cluster in the northern sky, containing several hundred thousand stars packed into 145 light-years." },
  { messier: "M14", name: "Globular Cluster in Ophiuchus", type: "star_cluster", constellation: "Ophiuchus", magnitude: "7.6", description: "A slightly elliptical globular cluster containing several hundred thousand stars." },
  { messier: "M15", name: "Great Pegasus Cluster", type: "star_cluster", constellation: "Pegasus", magnitude: "6.2", description: "One of the most densely packed globulars known. May contain a central black hole." },
  { messier: "M16", name: "Eagle Nebula", type: "nebula", constellation: "Serpens", magnitude: "6.4", description: "Famous for the 'Pillars of Creation' photographed by Hubble. An active star-forming region." },
  { messier: "M17", name: "Omega Nebula", type: "nebula", constellation: "Sagittarius", magnitude: "6.0", description: "Also called the Swan or Horseshoe Nebula. One of the brightest emission nebulae in the sky." },
  { messier: "M18", name: "Open Cluster in Sagittarius", type: "star_cluster", constellation: "Sagittarius", magnitude: "7.5", description: "A sparse open cluster located in a rich Milky Way star field." },
  { messier: "M19", name: "Globular Cluster in Ophiuchus", type: "star_cluster", constellation: "Ophiuchus", magnitude: "6.8", description: "One of the most oblate globular clusters known, appearing distinctly elongated." },
  { messier: "M20", name: "Trifid Nebula", type: "nebula", constellation: "Sagittarius", magnitude: "6.3", description: "A combination emission, reflection, and dark nebula. Named for its three-lobed appearance." },
  { messier: "M21", name: "Open Cluster in Sagittarius", type: "star_cluster", constellation: "Sagittarius", magnitude: "6.5", description: "A young open cluster located near the Trifid Nebula." },
  { messier: "M22", name: "Sagittarius Cluster", type: "star_cluster", constellation: "Sagittarius", magnitude: "5.1", description: "One of the brightest globular clusters, and one of the nearest to Earth at 10,600 light-years." },
  { messier: "M23", name: "Open Cluster in Sagittarius", type: "star_cluster", constellation: "Sagittarius", magnitude: "6.9", description: "A loose open cluster with about 150 stars spread over 15 light-years." },
  { messier: "M24", name: "Sagittarius Star Cloud", type: "star_cluster", constellation: "Sagittarius", magnitude: "4.6", description: "Not a true cluster but a dense star cloud in the Milky Way, spanning 600 light-years." },
  { messier: "M25", name: "Open Cluster in Sagittarius", type: "star_cluster", constellation: "Sagittarius", magnitude: "4.6", description: "A bright open cluster containing the Cepheid variable U Sagittarii." },
  { messier: "M26", name: "Open Cluster in Scutum", type: "star_cluster", constellation: "Scutum", magnitude: "8.0", description: "A compact open cluster partially obscured by interstellar dust." },
  { messier: "M27", name: "Dumbbell Nebula", type: "nebula", constellation: "Vulpecula", magnitude: "7.5", description: "The first planetary nebula ever discovered. Shows an hourglass shape in telescopes." },
  { messier: "M28", name: "Globular Cluster in Sagittarius", type: "star_cluster", constellation: "Sagittarius", magnitude: "6.8", description: "A dense globular cluster that was the first in which a millisecond pulsar was discovered." },
  { messier: "M29", name: "Open Cluster in Cygnus", type: "star_cluster", constellation: "Cygnus", magnitude: "7.1", description: "A small but bright open cluster embedded in rich Milky Way star fields." },
  { messier: "M30", name: "Globular Cluster in Capricornus", type: "star_cluster", constellation: "Capricornus", magnitude: "7.2", description: "A globular cluster that has undergone core collapse, making its center extremely dense." },
  { messier: "M31", name: "Andromeda Galaxy", type: "galaxy", constellation: "Andromeda", magnitude: "3.4", description: "The nearest major galaxy to the Milky Way at 2.5 million light-years. Visible to the naked eye." },
  { messier: "M32", name: "Dwarf Elliptical Galaxy", type: "galaxy", constellation: "Andromeda", magnitude: "8.1", description: "A compact satellite galaxy of Andromeda, visible as a small fuzzy spot near M31." },
  { messier: "M33", name: "Triangulum Galaxy", type: "galaxy", constellation: "Triangulum", magnitude: "5.7", description: "The third-largest galaxy in the Local Group. A face-on spiral with prominent HII regions." },
  { messier: "M34", name: "Open Cluster in Perseus", type: "star_cluster", constellation: "Perseus", magnitude: "5.5", description: "A young open cluster about 1,500 light-years away, spanning about 35 light-years." },
  { messier: "M35", name: "Open Cluster in Gemini", type: "star_cluster", constellation: "Gemini", magnitude: "5.3", description: "A large, bright open cluster visible to the naked eye under good conditions." },
  { messier: "M36", name: "Pinwheel Cluster", type: "star_cluster", constellation: "Auriga", magnitude: "6.3", description: "A young open cluster in Auriga, part of a trio with M37 and M38." },
  { messier: "M37", name: "Open Cluster in Auriga", type: "star_cluster", constellation: "Auriga", magnitude: "6.2", description: "The richest of the three Auriga clusters, containing about 500 stars." },
  { messier: "M38", name: "Starfish Cluster", type: "star_cluster", constellation: "Auriga", magnitude: "7.4", description: "An open cluster whose brighter stars form a pattern resembling the Greek letter Pi." },
  { messier: "M39", name: "Open Cluster in Cygnus", type: "star_cluster", constellation: "Cygnus", magnitude: "4.6", description: "A very loose, nearby open cluster best viewed with binoculars or low power." },
  { messier: "M40", name: "Winnecke 4", type: "other", constellation: "Ursa Major", magnitude: "8.4", description: "A double star, not a deep sky object. Messier cataloged it while searching for a nebula reported nearby." },
  { messier: "M41", name: "Open Cluster in Canis Major", type: "star_cluster", constellation: "Canis Major", magnitude: "4.5", description: "A bright open cluster about 4 degrees south of Sirius. Contains about 100 stars." },
  { messier: "M42", name: "Orion Nebula", type: "nebula", constellation: "Orion", magnitude: "4.0", description: "The brightest diffuse nebula in the sky, visible to the naked eye. The nearest massive star-forming region." },
  { messier: "M43", name: "De Mairan's Nebula", type: "nebula", constellation: "Orion", magnitude: "9.0", description: "Part of the Orion Nebula complex, separated from M42 by a dark dust lane." },
  { messier: "M44", name: "Beehive Cluster", type: "star_cluster", constellation: "Cancer", magnitude: "3.7", description: "Also called Praesepe. One of the nearest open clusters, best viewed with binoculars." },
  { messier: "M45", name: "Pleiades", type: "star_cluster", constellation: "Taurus", magnitude: "1.6", description: "The Seven Sisters. The most famous open cluster, visible to the naked eye with reflection nebulosity." },
  { messier: "M46", name: "Open Cluster in Puppis", type: "star_cluster", constellation: "Puppis", magnitude: "6.1", description: "A rich open cluster with a planetary nebula (NGC 2438) apparently superimposed on it." },
  { messier: "M47", name: "Open Cluster in Puppis", type: "star_cluster", constellation: "Puppis", magnitude: "4.2", description: "A bright, loose open cluster about 1,600 light-years away." },
  { messier: "M48", name: "Open Cluster in Hydra", type: "star_cluster", constellation: "Hydra", magnitude: "5.5", description: "A large open cluster spanning about half a degree, visible to the naked eye under dark skies." },
  { messier: "M49", name: "Elliptical Galaxy in Virgo", type: "galaxy", constellation: "Virgo", magnitude: "8.4", description: "The brightest galaxy in the Virgo Cluster and the first Virgo Cluster member discovered." },
  { messier: "M50", name: "Open Cluster in Monoceros", type: "star_cluster", constellation: "Monoceros", magnitude: "5.9", description: "A heart-shaped open cluster about 3,000 light-years away." },
  { messier: "M51", name: "Whirlpool Galaxy", type: "galaxy", constellation: "Canes Venatici", magnitude: "8.4", description: "A grand-design spiral galaxy interacting with NGC 5195. First galaxy with spiral structure identified." },
  { messier: "M52", name: "Open Cluster in Cassiopeia", type: "star_cluster", constellation: "Cassiopeia", magnitude: "7.3", description: "A rich open cluster near the Bubble Nebula." },
  { messier: "M53", name: "Globular Cluster in Coma Berenices", type: "star_cluster", constellation: "Coma Berenices", magnitude: "7.6", description: "One of the more outlying globular clusters at 58,000 light-years from the galactic center." },
  { messier: "M54", name: "Globular Cluster in Sagittarius", type: "star_cluster", constellation: "Sagittarius", magnitude: "7.6", description: "Not a Milky Way globular but belongs to the Sagittarius Dwarf Elliptical Galaxy." },
  { messier: "M55", name: "Summer Rose Star", type: "star_cluster", constellation: "Sagittarius", magnitude: "6.3", description: "A large, loose globular cluster that is relatively easy to resolve into stars." },
  { messier: "M56", name: "Globular Cluster in Lyra", type: "star_cluster", constellation: "Lyra", magnitude: "8.3", description: "A moderately concentrated globular cluster located between Albireo and Sulafat." },
  { messier: "M57", name: "Ring Nebula", type: "nebula", constellation: "Lyra", magnitude: "8.8", description: "The best-known planetary nebula, showing a distinct ring shape in small telescopes." },
  { messier: "M58", name: "Barred Spiral Galaxy in Virgo", type: "galaxy", constellation: "Virgo", magnitude: "9.7", description: "One of the brightest barred spiral galaxies in the Virgo Cluster." },
  { messier: "M59", name: "Elliptical Galaxy in Virgo", type: "galaxy", constellation: "Virgo", magnitude: "9.6", description: "An elliptical galaxy in the Virgo Cluster with a large central supermassive black hole." },
  { messier: "M60", name: "Elliptical Galaxy in Virgo", type: "galaxy", constellation: "Virgo", magnitude: "8.8", description: "One of the largest elliptical galaxies in the Virgo Cluster." },
  { messier: "M61", name: "Spiral Galaxy in Virgo", type: "galaxy", constellation: "Virgo", magnitude: "9.7", description: "A face-on barred spiral galaxy, one of the largest in the Virgo Cluster." },
  { messier: "M62", name: "Globular Cluster in Ophiuchus", type: "star_cluster", constellation: "Ophiuchus", magnitude: "6.5", description: "One of the most irregularly shaped globular clusters due to tidal effects from the galactic center." },
  { messier: "M63", name: "Sunflower Galaxy", type: "galaxy", constellation: "Canes Venatici", magnitude: "8.6", description: "A flocculent spiral galaxy with patchy, discontinuous spiral arms." },
  { messier: "M64", name: "Black Eye Galaxy", type: "galaxy", constellation: "Coma Berenices", magnitude: "8.5", description: "Famous for the dark band of dust in front of its bright nucleus." },
  { messier: "M65", name: "Spiral Galaxy in Leo", type: "galaxy", constellation: "Leo", magnitude: "9.3", description: "Part of the Leo Triplet along with M66 and NGC 3628." },
  { messier: "M66", name: "Spiral Galaxy in Leo", type: "galaxy", constellation: "Leo", magnitude: "8.9", description: "The largest member of the Leo Triplet, showing asymmetric spiral arms." },
  { messier: "M67", name: "Open Cluster in Cancer", type: "star_cluster", constellation: "Cancer", magnitude: "6.1", description: "One of the oldest known open clusters at about 4 billion years old." },
  { messier: "M68", name: "Globular Cluster in Hydra", type: "star_cluster", constellation: "Hydra", magnitude: "7.8", description: "A relatively loose globular cluster about 33,000 light-years away." },
  { messier: "M69", name: "Globular Cluster in Sagittarius", type: "star_cluster", constellation: "Sagittarius", magnitude: "7.6", description: "A small, dense globular cluster near the galactic center." },
  { messier: "M70", name: "Globular Cluster in Sagittarius", type: "star_cluster", constellation: "Sagittarius", magnitude: "7.9", description: "A core-collapsed globular cluster similar in size and structure to M69." },
  { messier: "M71", name: "Globular Cluster in Sagitta", type: "star_cluster", constellation: "Sagitta", magnitude: "8.2", description: "A loosely concentrated globular cluster that was long thought to be an open cluster." },
  { messier: "M72", name: "Globular Cluster in Aquarius", type: "star_cluster", constellation: "Aquarius", magnitude: "9.3", description: "One of the more remote globular clusters at about 55,000 light-years away." },
  { messier: "M73", name: "Asterism in Aquarius", type: "other", constellation: "Aquarius", magnitude: "9.0", description: "A Y-shaped asterism of four stars, not a true cluster." },
  { messier: "M74", name: "Phantom Galaxy", type: "galaxy", constellation: "Pisces", magnitude: "9.4", description: "A face-on grand design spiral galaxy, challenging to observe due to low surface brightness." },
  { messier: "M75", name: "Globular Cluster in Sagittarius", type: "star_cluster", constellation: "Sagittarius", magnitude: "8.5", description: "One of the more densely concentrated globular clusters known." },
  { messier: "M76", name: "Little Dumbbell Nebula", type: "nebula", constellation: "Perseus", magnitude: "10.1", description: "A planetary nebula resembling a miniature version of M27. One of the faintest Messier objects." },
  { messier: "M77", name: "Cetus A", type: "galaxy", constellation: "Cetus", magnitude: "8.9", description: "A Seyfert galaxy with an active galactic nucleus. One of the largest Messier galaxies." },
  { messier: "M78", name: "Reflection Nebula in Orion", type: "nebula", constellation: "Orion", magnitude: "8.3", description: "The brightest diffuse reflection nebula in the sky." },
  { messier: "M79", name: "Globular Cluster in Lepus", type: "star_cluster", constellation: "Lepus", magnitude: "7.7", description: "An unusual globular cluster located on the opposite side of the sky from the galactic center." },
  { messier: "M80", name: "Globular Cluster in Scorpius", type: "star_cluster", constellation: "Scorpius", magnitude: "7.3", description: "One of the densest globular clusters in the Milky Way." },
  { messier: "M81", name: "Bode's Galaxy", type: "galaxy", constellation: "Ursa Major", magnitude: "6.9", description: "A grand design spiral galaxy and one of the brightest in the night sky." },
  { messier: "M82", name: "Cigar Galaxy", type: "galaxy", constellation: "Ursa Major", magnitude: "8.4", description: "A starburst galaxy with intense star formation, interacting with M81." },
  { messier: "M83", name: "Southern Pinwheel Galaxy", type: "galaxy", constellation: "Hydra", magnitude: "7.5", description: "A barred spiral galaxy, one of the closest and brightest in the southern sky." },
  { messier: "M84", name: "Lenticular Galaxy in Virgo", type: "galaxy", constellation: "Virgo", magnitude: "9.1", description: "A lenticular galaxy in the core of the Virgo Cluster with jets from its active nucleus." },
  { messier: "M85", name: "Lenticular Galaxy in Coma Berenices", type: "galaxy", constellation: "Coma Berenices", magnitude: "9.1", description: "A lenticular galaxy that is the northernmost member of the Virgo Cluster." },
  { messier: "M86", name: "Lenticular Galaxy in Virgo", type: "galaxy", constellation: "Virgo", magnitude: "8.9", description: "A lenticular galaxy in the Virgo Cluster, approaching us rather than receding." },
  { messier: "M87", name: "Virgo A", type: "galaxy", constellation: "Virgo", magnitude: "8.6", description: "A giant elliptical galaxy at the center of the Virgo Cluster with a famous relativistic jet." },
  { messier: "M88", name: "Spiral Galaxy in Coma Berenices", type: "galaxy", constellation: "Coma Berenices", magnitude: "9.6", description: "A multi-armed spiral galaxy in the Virgo Cluster." },
  { messier: "M89", name: "Elliptical Galaxy in Virgo", type: "galaxy", constellation: "Virgo", magnitude: "9.8", description: "An almost perfectly circular elliptical galaxy in the Virgo Cluster." },
  { messier: "M90", name: "Spiral Galaxy in Virgo", type: "galaxy", constellation: "Virgo", magnitude: "9.5", description: "A spiral galaxy approaching us, one of the largest in the Virgo Cluster." },
  { messier: "M91", name: "Barred Spiral Galaxy in Coma Berenices", type: "galaxy", constellation: "Coma Berenices", magnitude: "10.2", description: "A barred spiral galaxy, one of the faintest Messier objects." },
  { messier: "M92", name: "Globular Cluster in Hercules", type: "star_cluster", constellation: "Hercules", magnitude: "6.4", description: "One of the brightest globular clusters, often overlooked due to nearby M13." },
  { messier: "M93", name: "Open Cluster in Puppis", type: "star_cluster", constellation: "Puppis", magnitude: "6.0", description: "A bright open cluster with about 80 stars in a wedge shape." },
  { messier: "M94", name: "Cat's Eye Galaxy", type: "galaxy", constellation: "Canes Venatici", magnitude: "8.2", description: "A spiral galaxy with a bright inner ring of active star formation." },
  { messier: "M95", name: "Barred Spiral Galaxy in Leo", type: "galaxy", constellation: "Leo", magnitude: "9.7", description: "A barred spiral galaxy with a distinct ring structure." },
  { messier: "M96", name: "Spiral Galaxy in Leo", type: "galaxy", constellation: "Leo", magnitude: "9.2", description: "The brightest member of the Leo I galaxy group." },
  { messier: "M97", name: "Owl Nebula", type: "nebula", constellation: "Ursa Major", magnitude: "9.9", description: "A planetary nebula named for the two dark regions resembling owl eyes." },
  { messier: "M98", name: "Spiral Galaxy in Coma Berenices", type: "galaxy", constellation: "Coma Berenices", magnitude: "10.1", description: "An elongated spiral galaxy on the edge of the Virgo Cluster." },
  { messier: "M99", name: "Coma Pinwheel Galaxy", type: "galaxy", constellation: "Coma Berenices", magnitude: "9.9", description: "A face-on spiral galaxy showing asymmetric spiral arms." },
  { messier: "M100", name: "Mirror Galaxy", type: "galaxy", constellation: "Coma Berenices", magnitude: "9.3", description: "A grand design spiral galaxy, one of the brightest in the Virgo Cluster." },
  { messier: "M101", name: "Pinwheel Galaxy", type: "galaxy", constellation: "Ursa Major", magnitude: "7.9", description: "A face-on spiral galaxy nearly twice the diameter of the Milky Way." },
  { messier: "M102", name: "Spindle Galaxy", type: "galaxy", constellation: "Draco", magnitude: "9.9", description: "An edge-on lenticular galaxy (NGC 5866), though the identification is debated." },
  { messier: "M103", name: "Open Cluster in Cassiopeia", type: "star_cluster", constellation: "Cassiopeia", magnitude: "7.4", description: "A fan-shaped open cluster near the star Ruchbah in Cassiopeia." },
  { messier: "M104", name: "Sombrero Galaxy", type: "galaxy", constellation: "Virgo", magnitude: "8.0", description: "Famous for its bright nucleus and prominent dust lane creating a sombrero appearance." },
  { messier: "M105", name: "Elliptical Galaxy in Leo", type: "galaxy", constellation: "Leo", magnitude: "9.3", description: "An elliptical galaxy in the Leo I group with a supermassive black hole." },
  { messier: "M106", name: "Spiral Galaxy in Canes Venatici", type: "galaxy", constellation: "Canes Venatici", magnitude: "8.4", description: "A Seyfert II galaxy with anomalous arms likely caused by its active nucleus." },
  { messier: "M107", name: "Globular Cluster in Ophiuchus", type: "star_cluster", constellation: "Ophiuchus", magnitude: "7.9", description: "One of the more loosely concentrated globular clusters in the Messier catalog." },
  { messier: "M108", name: "Surfboard Galaxy", type: "galaxy", constellation: "Ursa Major", magnitude: "10.0", description: "An edge-on barred spiral galaxy near the Owl Nebula M97." },
  { messier: "M109", name: "Barred Spiral Galaxy in Ursa Major", type: "galaxy", constellation: "Ursa Major", magnitude: "9.8", description: "A barred spiral galaxy near the star Phecda in the Big Dipper." },
  { messier: "M110", name: "Dwarf Elliptical Galaxy", type: "galaxy", constellation: "Andromeda", magnitude: "8.5", description: "A satellite galaxy of Andromeda, the last object added to the Messier catalog." },
];

async function seedAllMessier() {
  console.log("Seeding all 110 Messier objects with 2MASS images...\n");

  let addedCount = 0;
  let skippedCount = 0;
  let updatedCount = 0;

  for (const obj of MESSIER_CATALOG) {
    const imageFilename = MESSIER_2MASS_IMAGES[obj.messier];
    const imageUrl = imageFilename ? `${TWOMASS_BASE_URL}${imageFilename}` : null;

    // Create the display name (e.g., "Crab Nebula (M1)")
    const displayName = obj.name === obj.messier ? obj.messier : `${obj.name} (${obj.messier})`;

    // Check if object already exists (by Messier number in name)
    const existing = await db.select().from(celestialObjects);
    const existingObj = existing.find(e =>
      e.name.includes(`(${obj.messier})`) ||
      e.name === obj.messier ||
      e.name.toLowerCase().includes(obj.name.toLowerCase())
    );

    if (existingObj) {
      // Update existing object with 2MASS image if it doesn't have one or has a placeholder
      if (imageUrl && (!existingObj.imageUrl || existingObj.imageUrl.includes('unsplash'))) {
        await db.update(celestialObjects)
          .set({ imageUrl })
          .where(eq(celestialObjects.id, existingObj.id));
        console.log(`🔄 Updated ${existingObj.name} with 2MASS image`);
        updatedCount++;
      } else {
        console.log(`⏭️  Skipped ${existingObj.name} (already exists)`);
        skippedCount++;
      }
      continue;
    }

    // Insert new object
    await db.insert(celestialObjects).values({
      name: displayName,
      type: obj.type,
      description: obj.description,
      imageUrl: imageUrl,
      constellation: obj.constellation,
      magnitude: obj.magnitude,
    });

    console.log(`✅ Added ${displayName}`);
    addedCount++;
  }

  console.log("\n" + "=".repeat(50));
  console.log("\nSummary:");
  console.log(`  ✅ Added: ${addedCount} new objects`);
  console.log(`  🔄 Updated: ${updatedCount} existing objects`);
  console.log(`  ⏭️  Skipped: ${skippedCount} objects (already exist)`);
  console.log("\n✨ Done!");

  process.exit(0);
}

seedAllMessier().catch(err => {
  console.error("Error:", err);
  process.exit(1);
});

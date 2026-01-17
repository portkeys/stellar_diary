import { CelestialObject, InsertCelestialObject, InsertApodCache, apodCache } from "@shared/schema";
import { storage } from "../storage";
import { db } from "../db";
import { get2MASSImageUrl, isMessierObject } from "../data/messier2mass";

// Seed data for celestial objects (static catalog - no time-specific info)
const seedCelestialObjects: InsertCelestialObject[] = [
  {
    name: "Whirlpool Galaxy (M51)",
    type: "galaxy",
    description: "One of the most popular targets for visual observers and astrophotographers. Through a small scope, the galaxy appears as a faint patch with its companion NGC 5195. Larger telescopes (250mm+) show its famous spiral arms.",
    imageUrl: "https://www.ipac.caltech.edu/2mass/gallery/m51atlas.jpg",
    constellation: "Canes Venatici",
    magnitude: "8.4",
  },
  {
    name: "Leo Triplet (M65, M66, NGC 3628)",
    type: "galaxy",
    description: "A small group of galaxies about 35 million light-years away. M65 and M66 are visible with binoculars, but you'll need a scope for NGC 3628. At 70x, all three appear as elongated patches.",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/8/83/Leo-Triplet.png",
    constellation: "Leo",
    magnitude: "9.3",
  },
  {
    name: "Mizar & Alcor",
    type: "double_star",
    description: "An outstanding double star for beginners in the handle of the Big Dipper. Mizar itself is double, making this a great target for any telescope.",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/e/e4/ALCOR_et_MIZAR_%287060991417%29.jpg",
    constellation: "Ursa Major",
    magnitude: "2.2",
  },
  {
    name: "Ring Nebula (M57)",
    type: "nebula",
    description: "A planetary nebula formed by an expanding shell of gas around an aging star. Approximately 2,000 light-years away, it's one of the most prominent examples of its type.",
    imageUrl: "https://www.ipac.caltech.edu/2mass/gallery/ringatlas.jpg",
    constellation: "Lyra",
    magnitude: "8.8",
  },
  {
    name: "Jupiter",
    type: "planet",
    description: "The largest planet in our solar system. An 8-inch Dobsonian can reveal cloud bands and the four Galilean moons: Io, Europa, Ganymede, and Callisto.",
    imageUrl: "https://images-assets.nasa.gov/image/PIA22946/PIA22946~large.jpg",
    constellation: null,
    magnitude: "-2.2",
  },
  {
    name: "Saturn",
    type: "planet",
    description: "The ringed planet is a stunning sight in any telescope. Look for the Cassini Division in the rings and its largest moon Titan.",
    imageUrl: "https://images-assets.nasa.gov/image/PIA21046/PIA21046~large.jpg",
    constellation: null,
    magnitude: "0.5",
  },
  {
    name: "Andromeda Galaxy (M31)",
    type: "galaxy",
    description: "The nearest major galaxy to the Milky Way at 2.5 million light-years. Visible to the naked eye on dark nights, it's the largest galaxy in our Local Group.",
    imageUrl: "https://www.ipac.caltech.edu/2mass/gallery/m31atlas.jpg",
    constellation: "Andromeda",
    magnitude: "3.4",
  },
  {
    name: "Orion Nebula (M42)",
    type: "nebula",
    description: "A diffuse nebula south of Orion's Belt. One of the brightest nebulae, visible to the naked eye, and the closest region of massive star formation to Earth at 1,344 light-years.",
    imageUrl: "https://www.ipac.caltech.edu/2mass/gallery/orionatlas.jpg",
    constellation: "Orion",
    magnitude: "4.0",
  },
  {
    name: "Pleiades (M45)",
    type: "star_cluster",
    description: "The Seven Sisters - an open star cluster containing hot B-type stars. Contains over 1,000 confirmed members, best viewed with low power wide-field eyepieces.",
    imageUrl: "https://www.ipac.caltech.edu/2mass/gallery/pleiadesatlas.jpg",
    constellation: "Taurus",
    magnitude: "1.6",
  },
  {
    name: "Great Globular Cluster (M13)",
    type: "star_cluster",
    description: "One of the brightest globular clusters in the northern sky. Contains several hundred thousand stars packed into a sphere about 145 light-years across.",
    imageUrl: "https://www.ipac.caltech.edu/2mass/gallery/m13atlas.jpg",
    constellation: "Hercules",
    magnitude: "5.8",
  },
  {
    name: "Dumbbell Nebula (M27)",
    type: "nebula",
    description: "A large, bright planetary nebula. One of the easiest planetaries to observe, showing an hourglass or apple-core shape in modest telescopes.",
    imageUrl: "https://www.ipac.caltech.edu/2mass/gallery/dumbbellatlas.jpg",
    constellation: "Vulpecula",
    magnitude: "7.5",
  },
];

// Telescope tips seed data
const seedTelescopeTips = [
  {
    title: "Collimating Your Apertura AD8 Dobsonian",
    content: "Good collimation is crucial for sharp views with your Apertura AD8. The included laser collimator makes this easy with just two main steps: 1) First, align the secondary mirror by adjusting the secondary mirror housing hex screws until the laser hits the center spot on the primary mirror. 2) Then, align the primary mirror by loosening the white thumb screws and adjusting the black knobs until the laser returns back to the laser collimator's 45-degree reflective surface. This process takes under 2 minutes once you've practiced a few times and will significantly improve your viewing experience.",
    category: "Maintenance",
    imageUrl: "/collimate_AD8.jpg"
  },
  {
    title: "Best Eyepieces for Your Dob",
    content: "Discover which eyepieces work best with your 8-inch Dobsonian for different celestial objects, from planets to deep sky targets.",
    category: "Equipment",
    imageUrl: "https://images.unsplash.com/photo-1536697246787-1f7ae568d89a?auto=format&fit=crop&w=600&h=300"
  },
  {
    title: "Understanding Aperture",
    content: "When it comes to telescopes, there's one key feature that stands out from everything else: aperture. The aperture of a telescope is the diameter of the lens or mirror, and the bigger the aperture, the more light the telescope can gather. As a result, observers are able to identify fainter objects and see more detail than would be possible with a smaller aperture scope. The downside? Larger apertures can lack portability, and of course, they cost more!",
    category: "Astronomy Basics",
    imageUrl: "https://images.unsplash.com/photo-1522124624696-7ea32eb9592c?auto=format&fit=crop&w=600&h=300"
  }
];

/**
 * Seeds the database with initial celestial objects and telescope tips
 */
export async function seedDatabase(): Promise<void> {
  // Seed celestial objects
  const existingObjects = await storage.getAllCelestialObjects();
  if (existingObjects.length === 0) {
    for (const object of seedCelestialObjects) {
      await storage.createCelestialObject(object);
    }
    console.log('Seeded celestial objects');
  }

  // Seed telescope tips
  const existingTips = await storage.getAllTelescopeTips();
  if (existingTips.length === 0) {
    for (const tip of seedTelescopeTips) {
      await storage.createTelescopeTip(tip);
    }
    console.log('Seeded telescope tips');
  }

  // Check if we have an APOD cache entry
  try {
    const existingApodEntries = await db.select().from(apodCache);

    // If no APOD entries exist, seed with a default one
    if (existingApodEntries.length === 0) {
      const today = new Date();
      const year = today.getFullYear();
      const month = today.getMonth() + 1;
      const day = today.getDate();
      const formattedDate = `${year}-${month < 10 ? '0' + month : month}-${day < 10 ? '0' + day : day}`;

      const defaultApod: InsertApodCache = {
        date: formattedDate,
        title: "A Happy Sky over Bufa Hill in Mexico",
        explanation: "Sometimes, the sky itself seems to smile. A few days ago, visible over much of the world, an unusual superposition of our Moon with the planets Venus and Saturn created just such an iconic facial expression.",
        media_type: "image",
        service_version: "v1",
        url: "https://apod.nasa.gov/apod/image/2504/HappySkyMexico_Korona_960.jpg",
        hdurl: "https://apod.nasa.gov/apod/image/2504/HappySkyMexico_Korona_1358.jpg",
        copyright: "Daniel Korona"
      };

      await db.insert(apodCache).values(defaultApod);
      console.log("Seeded APOD cache with default entry");
    }
  } catch (error) {
    console.error("Error checking APOD cache:", error);
  }
}

/**
 * Gets the current month's name
 */
export function getCurrentMonth(): string {
  return new Date().toLocaleString('default', { month: 'long' });
}

/**
 * Gets the current year
 */
export function getCurrentYear(): number {
  return new Date().getFullYear();
}

/**
 * Get an appropriate image URL for a celestial object
 * Uses 2MASS for Messier objects, falls back to NASA search or type-specific defaults
 */
export function getImageUrlForObject(name: string, type: string): string | null {
  // Check if it's a Messier object first
  const messierUrl = get2MASSImageUrl(name);
  if (messierUrl) {
    return messierUrl;
  }

  // Return null - caller should use NASA image search or fallback
  return null;
}

/**
 * Get type-specific fallback image URLs
 */
export function getTypeSpecificFallbackImage(type: string): string {
  switch (type) {
    case 'galaxy':
      return 'https://images.unsplash.com/photo-1502134249126-9f3755a50d78?w=800&h=500&fit=crop';
    case 'nebula':
      return 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=800&h=500&fit=crop';
    case 'planet':
      return 'https://images.unsplash.com/photo-1614728263952-84ea256f9679?w=800&h=500&fit=crop';
    case 'star_cluster':
      return 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=800&h=500&fit=crop';
    case 'double_star':
      return 'https://images.unsplash.com/photo-1502134249126-9f3755a50d78?w=800&h=500&fit=crop';
    case 'moon':
      return 'https://images.unsplash.com/photo-1446776877081-d282a0f896e2?w=800&h=500&fit=crop';
    default:
      return 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=800&h=500&fit=crop';
  }
}

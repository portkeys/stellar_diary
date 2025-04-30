import { CelestialObject, InsertCelestialObject } from "@shared/schema";
import { storage } from "../storage";

// Seed data for celestial objects (to be used on application startup)
const seedCelestialObjects: InsertCelestialObject[] = [
  {
    name: "Whirlpool Galaxy (M51)",
    type: "galaxy",
    description: "The Whirlpool Galaxy is a classic spiral galaxy located in the constellation Canes Venatici. It's one of the best examples of a face-on spiral galaxy visible from Earth.",
    coordinates: "RA: 13h 29m 53s | Dec: +47° 11′ 48″",
    bestViewingTime: "Best after 10 PM",
    imageUrl: "https://images.unsplash.com/photo-1543722530-d2c3201371e7?auto=format&fit=crop&w=800&h=500",
    visibilityRating: "Good Visibility",
    information: "Also known as NGC 5194, the Whirlpool Galaxy is interacting with a smaller galaxy called NGC 5195. This interaction is distorting the spiral arms of M51 due to gravitational effects.",
    constellation: "Canes Venatici",
    magnitude: "8.4",
    hemisphere: "Northern",
    recommendedEyepiece: "Low power, wide field eyepiece (20-25mm)",
    month: "May"
  },
  {
    name: "Ring Nebula (M57)",
    type: "nebula",
    description: "The Ring Nebula is a planetary nebula in the northern constellation of Lyra. It's one of the most prominent examples of a planetary nebula, formed by an expanding shell of gas around an aging star.",
    coordinates: "RA: 18h 53m 35s | Dec: +33° 01′ 45″",
    bestViewingTime: "Best after 11 PM",
    imageUrl: "https://images.unsplash.com/photo-1520034475321-cbe63696469a?auto=format&fit=crop&w=800&h=500",
    visibilityRating: "Excellent Visibility",
    information: "The Ring Nebula is approximately 2,000 light-years away from Earth. It was formed when a dying star expelled its outer layers of gas into space.",
    constellation: "Lyra",
    magnitude: "8.8",
    hemisphere: "Northern",
    recommendedEyepiece: "Medium power eyepiece (10-15mm)",
    month: "May"
  },
  {
    name: "Jupiter & Its Moons",
    type: "planet",
    description: "Jupiter is a gas giant and the largest planet in our solar system. With your 8-inch Dobsonian, you'll be able to see its cloud bands and four Galilean moons: Io, Europa, Ganymede, and Callisto.",
    coordinates: "RA: 04h 30m | Dec: +20° 00′",
    bestViewingTime: "Early morning",
    imageUrl: "https://images.unsplash.com/photo-1614732414444-096e5f1122d5?auto=format&fit=crop&w=800&h=500",
    visibilityRating: "Excellent Visibility",
    information: "Jupiter takes about 12 Earth years to orbit the Sun. Its most notable feature, the Great Red Spot, is a giant storm that has been raging for at least 400 years.",
    constellation: "Varies",
    magnitude: "-2.2",
    hemisphere: "Both",
    recommendedEyepiece: "High power eyepiece (6-10mm)",
    month: "May"
  },
  {
    name: "Andromeda Galaxy (M31)",
    type: "galaxy",
    description: "The Andromeda Galaxy is the nearest major galaxy to our Milky Way. It's a spiral galaxy approximately 2.5 million light-years away and is visible to the naked eye on dark nights.",
    coordinates: "RA: 00h 42m 44s | Dec: +41° 16′ 9″",
    bestViewingTime: "Best on Fall and Winter evenings",
    imageUrl: "https://images.unsplash.com/photo-1438978401421-16031dd4a8ae?auto=format&fit=crop&w=800&h=500",
    visibilityRating: "Good Visibility",
    information: "The Andromeda Galaxy is the largest galaxy in the Local Group, which also includes the Milky Way, the Triangulum Galaxy, and about 30 other smaller galaxies.",
    constellation: "Andromeda",
    magnitude: "3.4",
    hemisphere: "Northern",
    recommendedEyepiece: "Low power, wide field eyepiece (25mm or higher)",
    month: "October"
  },
  {
    name: "Orion Nebula (M42)",
    type: "nebula",
    description: "The Orion Nebula is a diffuse nebula situated in the Milky Way, south of Orion's Belt. It is one of the brightest nebulae and visible to the naked eye.",
    coordinates: "RA: 05h 35m 17s | Dec: -05° 23′ 28″",
    bestViewingTime: "Winter evenings",
    imageUrl: "https://images.unsplash.com/photo-1579033078051-5ab3503cc953?auto=format&fit=crop&w=800&h=500",
    visibilityRating: "Excellent Visibility",
    information: "The Orion Nebula is approximately 1,344 light-years away and is the closest region of massive star formation to Earth.",
    constellation: "Orion",
    magnitude: "4.0",
    hemisphere: "Both",
    recommendedEyepiece: "Low power eyepiece (20-25mm)",
    month: "January"
  },
  {
    name: "Pleiades (M45)",
    type: "star_cluster",
    description: "The Pleiades, also known as the Seven Sisters, is an open star cluster containing middle-aged, hot B-type stars in the northwest of the constellation Taurus.",
    coordinates: "RA: 03h 47m 24s | Dec: +24° 07′ 00″",
    bestViewingTime: "Winter evenings",
    imageUrl: "https://images.unsplash.com/photo-1593331292296-1bb2644113cb?auto=format&fit=crop&w=800&h=500",
    visibilityRating: "Excellent Visibility",
    information: "The cluster contains over 1,000 statistically confirmed members, though its most recognizable feature is the small asterism of stars that appear together in the night sky.",
    constellation: "Taurus",
    magnitude: "1.6",
    hemisphere: "Both",
    recommendedEyepiece: "Low power, wide field eyepiece (25mm or higher)",
    month: "December"
  }
];

// Monthly sky guides seed data
const seedMonthlyGuides = [
  {
    month: "May",
    year: 2023,
    headline: "Galaxy Season in the Northern Hemisphere",
    description: "May offers excellent opportunities to observe galaxies in the northern hemisphere, particularly in the Virgo Cluster. It's also a good time to observe Jupiter in the early morning sky.",
    hemisphere: "Northern"
  },
  {
    month: "June",
    year: 2023,
    headline: "Summer Nebulae and Globular Clusters",
    description: "June brings warmer nights and excellent viewing of nebulae and globular clusters in the Sagittarius region, including the Lagoon Nebula (M8) and Omega Nebula (M17).",
    hemisphere: "Northern"
  }
];

// Telescope tips seed data
const seedTelescopeTips = [
  {
    title: "Collimation Guide",
    content: "Proper mirror alignment (collimation) is crucial for seeing sharp images. Learn how to quickly collimate your 8-inch Dobsonian in under 5 minutes.",
    category: "Maintenance",
    imageUrl: "https://images.unsplash.com/photo-1516339901601-2e1b62dc0c45?auto=format&fit=crop&w=600&h=300"
  },
  {
    title: "Best Eyepieces for Your Dob",
    content: "Discover which eyepieces work best with your 8-inch Dobsonian for different celestial objects, from planets to deep sky targets.",
    category: "Equipment",
    imageUrl: "https://images.unsplash.com/photo-1536697246787-1f7ae568d89a?auto=format&fit=crop&w=600&h=300"
  }
];

/**
 * Seeds the database with initial celestial objects, monthly guides, and telescope tips
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

  // Seed monthly guides
  const existingGuides = await storage.getAllMonthlyGuides();
  if (existingGuides.length === 0) {
    for (const guide of seedMonthlyGuides) {
      await storage.createMonthlyGuide(guide);
    }
    console.log('Seeded monthly guides');
  }

  // Seed telescope tips
  const existingTips = await storage.getAllTelescopeTips();
  if (existingTips.length === 0) {
    for (const tip of seedTelescopeTips) {
      await storage.createTelescopeTip(tip);
    }
    console.log('Seeded telescope tips');
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
 * Filters celestial objects by multiple criteria
 */
export async function filterCelestialObjects(
  type?: string,
  month?: string,
  hemisphere?: string
): Promise<CelestialObject[]> {
  let objects = await storage.getAllCelestialObjects();
  
  if (type) {
    objects = objects.filter(obj => obj.type === type);
  }
  
  if (month) {
    objects = objects.filter(obj => obj.month === month);
  }
  
  if (hemisphere) {
    objects = objects.filter(obj => obj.hemisphere === hemisphere || obj.hemisphere === 'both');
  }
  
  return objects;
}

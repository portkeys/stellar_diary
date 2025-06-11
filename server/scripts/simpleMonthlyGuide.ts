import { storage } from '../storage';
import { InsertCelestialObject, InsertMonthlyGuide } from '../../shared/schema';

interface UpdateResult {
  success: boolean;
  message: string;
  objectsAdded: number;
  guideUpdated: boolean;
}

/**
 * Creates a simple monthly guide with predefined celestial objects
 */
export async function createSimpleMonthlyGuide(
  month: string,
  year: number,
  hemisphere: string,
  headline: string,
  description: string,
  videoUrls: string[] = []
): Promise<UpdateResult> {
  try {
    console.log(`Creating monthly guide for ${month} ${year}`);

    // Create the monthly guide
    const monthlyGuide: InsertMonthlyGuide = {
      month,
      year,
      hemisphere,
      headline,
      description,
      videoUrls,
      isAdmin: true
    };

    await storage.createMonthlyGuide(monthlyGuide);

    // Add some featured celestial objects for the month
    const featuredObjects = getFeaturedObjectsForMonth(month);
    let objectsAdded = 0;

    for (const obj of featuredObjects) {
      try {
        // Check if object already exists
        const existing = await storage.getCelestialObjectByName(obj.name);
        if (!existing) {
          await storage.createCelestialObject(obj);
          objectsAdded++;
        }
      } catch (error) {
        console.log(`Skipped object ${obj.name}:`, error);
      }
    }

    return {
      success: true,
      message: `Successfully created ${month} ${year} guide with ${objectsAdded} objects`,
      objectsAdded,
      guideUpdated: true
    };

  } catch (error) {
    console.error('Error creating monthly guide:', error);
    return {
      success: false,
      message: `Failed to create monthly guide: ${error instanceof Error ? error.message : 'Unknown error'}`,
      objectsAdded: 0,
      guideUpdated: false
    };
  }
}

/**
 * Returns featured celestial objects for a given month
 */
function getFeaturedObjectsForMonth(month: string): InsertCelestialObject[] {
  const baseObjects: InsertCelestialObject[] = [
    {
      name: "Saturn",
      type: "planet",
      description: "The ringed planet, easily visible through telescopes with its distinctive ring system.",
      imageUrl: "https://images.unsplash.com/photo-1614313913007-2b4ae8ce32d6",
      magnitude: "0.2",
      coordinates: "RA 21h 15m, Dec -16° 30'",
      constellation: "Aquarius",
      hemisphere: "Both",
      month: month
    },
    {
      name: "Jupiter",
      type: "planet", 
      description: "The largest planet in our solar system, showing cloud bands and four bright moons through telescopes.",
      imageUrl: "https://images.unsplash.com/photo-1614313913007-2b4ae8ce32d6",
      magnitude: "-2.8",
      coordinates: "RA 22h 45m, Dec -12° 15'", 
      constellation: "Pisces",
      hemisphere: "Both",
      month: month
    }
  ];

  // Add month-specific objects
  switch (month.toLowerCase()) {
    case 'june':
      baseObjects.push({
        name: "M13",
        type: "star_cluster",
        description: "The Great Hercules Cluster - a stunning globular cluster with hundreds of thousands of stars.",
        imageUrl: "https://images.unsplash.com/photo-1446776877081-d282a0f896e2",
        magnitude: "5.8",
        coordinates: "RA 16h 41m, Dec +36° 28'",
        constellation: "Hercules", 
        hemisphere: "Northern",
        month: "June"
      });
      break;
    case 'july':
      baseObjects.push({
        name: "M57",
        type: "nebula",
        description: "The Ring Nebula - a beautiful planetary nebula resembling a cosmic donut.",
        imageUrl: "https://images.unsplash.com/photo-1446776877081-d282a0f896e2",
        magnitude: "8.8",
        coordinates: "RA 18h 53m, Dec +33° 02'",
        constellation: "Lyra",
        hemisphere: "Northern", 
        month: "July"
      });
      break;
    default:
      baseObjects.push({
        name: "Andromeda Galaxy",
        type: "galaxy",
        description: "Our nearest major galactic neighbor, visible as a faint smudge to the naked eye.",
        imageUrl: "https://images.unsplash.com/photo-1446776877081-d282a0f896e2",
        magnitude: "3.4",
        coordinates: "RA 00h 42m, Dec +41° 16'",
        constellation: "Andromeda",
        hemisphere: "Northern",
        month: month
      });
  }

  return baseObjects;
}
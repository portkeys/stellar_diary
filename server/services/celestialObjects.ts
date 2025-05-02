import { CelestialObject, InsertCelestialObject, InsertApodCache, apodCache } from "@shared/schema";
import { storage } from "../storage";
import { db } from "../db";

// Seed data for celestial objects (to be used on application startup)
const seedCelestialObjects: InsertCelestialObject[] = [
  {
    name: "Whirlpool Galaxy (M51)",
    type: "galaxy",
    description: "Spring is galaxy season, and one of the most popular targets for visual observers and astrophotographers alike is the Whirlpool Galaxy.",
    coordinates: "RA: 13h 29m 53s | Dec: +47° 11′ 48″",
    bestViewingTime: "Best after 9 PM",
    imageUrl: "https://science.nasa.gov/wp-content/uploads/2023/04/m51-and-companion_0-jpg.webp",
    visibilityRating: "Good Visibility",
    information: "It's conveniently located about three and a half degrees from Alkaid, the star at the end of the handle of the Big Dipper, and forms a triangle with another star, 24 Canum Venaticorum. Through a small scope, the galaxy appears as a faint patch, with some texture potentially being visible, while its tiny companion, NGC 5195, shows a starlike core. Larger telescopes (250mm, or 10 inches in aperture) are needed to clearly show its famous spiral arms.",
    constellation: "Canes Venatici",
    magnitude: "8.4",
    hemisphere: "Northern",
    recommendedEyepiece: "Low power first, then higher magnification",
    month: "April"
  },
  {
    name: "Leo Triplet (M65, M66, NGC 3628)",
    type: "galaxy",
    description: "The Leo Triplet is a small group of galaxies about 35 million light-years away in the constellation Leo consisting of M65, M66, and NGC 3628.",
    coordinates: "RA: 11h 20m | Dec: +13° 00′",
    bestViewingTime: "Best after 9 PM",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/8/83/Leo-Triplet.png",
    visibilityRating: "Good Visibility",
    information: "The two brightest galaxies in this trio - M65 and M66 - are bright enough to be spotted with binoculars, but you'll need a scope to see NGC 3628. A magnification of around 70x will show all three as elongated patches within the same field of view, but you'll likely need a scope of 250mm in aperture to see any detail.",
    constellation: "Leo",
    magnitude: "9.3",
    hemisphere: "Northern",
    recommendedEyepiece: "Low power, wide field eyepiece (25mm or higher)",
    month: "April"
  },
  {
    name: "Mizar & Alcor (Zeta Ursae Majoris)",
    type: "double_star",
    description: "An outstanding double star for beginners, located in the handle of the Big Dipper.",
    coordinates: "RA: 13h 23m 56s | Dec: +54° 55′ 31″",
    bestViewingTime: "Best after 8 PM",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/e/e4/ALCOR_et_MIZAR_%287060991417%29.jpg",
    visibilityRating: "Excellent Visibility",
    information: "Look carefully with the naked eye at Mizar, the middle star in the handle of the Big Dipper, and you'll see a tiny star beside it. This is Alcor, and while the pair make a pretty sight for binoculars, almost any telescope will show Mizar itself to be double.",
    constellation: "Ursa Major",
    magnitude: "2.2",
    hemisphere: "Northern",
    recommendedEyepiece: "Low power eyepiece (30x)",
    month: "April"
  },
  {
    name: "Cor Caroli (Alpha Canum Venaticorum)",
    type: "double_star",
    description: "A relatively easy double star for beginners, located near the Big Dipper.",
    coordinates: "RA: 12h 56m 02s | Dec: +38° 19′ 06″",
    bestViewingTime: "Best after 9 PM",
    imageUrl: "https://assets.science.nasa.gov/dynamicimage/assets/science/psd/solar-system/skywatching/2025/april/skychart_m3_location_april_2025.png?w=1536&h=864&fit=crop&crop=faces%2Cfocalpoint",
    visibilityRating: "Good Visibility",
    information: "Like the Whirlpool Galaxy, Cor Caroli is located close to Alkaid in the Big Dipper, and like Mizar, it's a relatively easy double for beginners. A low magnification of around 30x will show a brilliant white star with a fainter creamy-white companion.",
    constellation: "Canes Venatici",
    magnitude: "2.9",
    hemisphere: "Northern",
    recommendedEyepiece: "Low power eyepiece (30x)",
    month: "April"
  },
  {
    name: "Mars Near Pollux",
    type: "planet",
    description: "Mars is visible just four degrees from Pollux in Gemini, giving observers the opportunity to compare their colors.",
    coordinates: "Varies by date",
    bestViewingTime: "Evening after sunset",
    imageUrl: "https://images-assets.nasa.gov/image/GSFC_20171208_Archive_e000019/GSFC_20171208_Archive_e000019~large.jpg?w=1920&h=1536&fit=clip&crop=faces%2Cfocalpoint",
    visibilityRating: "Good Visibility",
    information: "Mars is just four degrees from Pollux in Gemini, giving observers the opportunity to compare their colors. You'll find them high in the southwest after sunset.",
    constellation: "Gemini",
    magnitude: "1.2",
    hemisphere: "Northern",
    recommendedEyepiece: "Medium power eyepiece (10-15mm)",
    month: "April"
  },
  {
    name: "Lyrid Meteor Shower",
    type: "other",
    description: "The Lyrids are one of the oldest recorded meteor showers, with observations dating back 2,700 years.",
    coordinates: "Radiant near star Vega",
    bestViewingTime: "April 21-22, after midnight",
    imageUrl: "https://dq0hsqwjhea1.cloudfront.net/Lyrids-2022-V2-1042x783.jpg",
    visibilityRating: "Good Visibility",
    information: "The Lyrids reach their maximum on the evening of the 21st but are best seen during the early hours of the 22nd. Fortunately, the Moon is a waning crescent this year, and its light won't brighten the sky, allowing you to see up to 18 shooting stars every hour under ideal conditions.",
    constellation: "Lyra",
    magnitude: "Variable",
    hemisphere: "Northern",
    recommendedEyepiece: "No telescope needed - use your naked eyes",
    month: "April"
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
    month: "April",
    year: 2025,
    headline: "Galaxy Season and Double Stars in the Northern Hemisphere",
    description: "Spring is galaxy season, and April 2025 offers excellent opportunities to observe spectacular galaxies like the Whirlpool and Leo Triplet. It's also a great time to observe the Lyrid meteor shower (peaking April 21-22) and interesting double stars like Mizar & Alcor and Cor Caroli. Mars can be found near Pollux in Gemini, and Jupiter remains visible in the early evening during the first half of the month.",
    hemisphere: "Northern"
  },
  {
    month: "April",
    year: 2025,
    headline: "Autumn Night Sky in the Southern Hemisphere",
    description: "April in the southern hemisphere brings clear views of the Large and Small Magellanic Clouds, as well as excellent visibility of the southern constellations like Crux and Centaurus.",
    hemisphere: "Southern"
  },
  {
    month: "May",
    year: 2025,
    headline: "Meteor Showers, Saturn, and Deep Sky Treasures",
    description: "May 2025 brings the beautiful Eta Aquariid meteor shower (peaking May 4-5), created from the debris of Halley's Comet. Saturn reaches opposition on May 7th, making it visible all night with its rings clearly visible in telescopes. The bright star Arcturus dominates the evening sky, while the constellation Virgo offers excellent galaxy hunting with M87, M84, and M86. In the early morning hours, spot Mars and Venus low on the eastern horizon.",
    hemisphere: "Northern"
  },
  {
    month: "June",
    year: 2025,
    headline: "Summer Nebulae and Globular Clusters",
    description: "June brings warmer nights and excellent viewing of nebulae and globular clusters in the Sagittarius region, including the Lagoon Nebula (M8) and Omega Nebula (M17).",
    hemisphere: "Northern"
  }
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
 * Seeds the database with initial celestial objects, monthly guides, telescope tips, and APOD cache
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
  
  // Check if we have an APOD cache entry
  try {
    const existingApodEntries = await db.select().from(apodCache);
    
    // If no APOD entries exist, seed with a default one for the current date
    if (existingApodEntries.length === 0) {
      const today = new Date();
      const year = 2025;
      const month = today.getMonth() + 1;
      const day = today.getDate();
      const formattedDate = `${year}-${month < 10 ? '0' + month : month}-${day < 10 ? '0' + day : day}`;
      
      // Create a default APOD entry that will serve as fallback
      const defaultApod: InsertApodCache = {
        date: formattedDate,
        title: "A Happy Sky over Bufa Hill in Mexico",
        explanation: "Sometimes, the sky itself seems to smile. A few days ago, visible over much of the world, an unusual superposition of our Moon with the planets Venus and Saturn created just such an iconic facial expression. Specifically, a crescent Moon appeared to make a happy face on the night sky when paired with seemingly nearby planets.",
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

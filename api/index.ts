import type { VercelRequest, VercelResponse } from '@vercel/node';
import express from 'express';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { pgTable, text, serial, integer, boolean, date, timestamp } from 'drizzle-orm/pg-core';
import { eq, desc } from 'drizzle-orm';

// Inline schema definitions (Vercel can't resolve imports from outside /api)
const celestialObjects = pgTable('celestial_objects', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  type: text('type').notNull(),
  description: text('description').notNull(),
  coordinates: text('coordinates').notNull(),
  bestViewingTime: text('best_viewing_time'),
  imageUrl: text('image_url'),
  visibilityRating: text('visibility_rating'),
  information: text('information'),
  constellation: text('constellation'),
  magnitude: text('magnitude'),
  hemisphere: text('hemisphere'),
  recommendedEyepiece: text('recommended_eyepiece'),
  month: text('month'),
});

const observations = pgTable('observations', {
  id: serial('id').primaryKey(),
  userId: integer('user_id'),
  objectId: integer('object_id'),
  isObserved: boolean('is_observed').default(false),
  observationNotes: text('observation_notes'),
  dateAdded: timestamp('date_added').defaultNow(),
  plannedDate: date('planned_date'),
});

const apodCache = pgTable('apod_cache', {
  id: serial('id').primaryKey(),
  date: text('date').notNull(),
  title: text('title').notNull(),
  explanation: text('explanation').notNull(),
  url: text('url').notNull(),
  hdurl: text('hdurl'),
  media_type: text('media_type').notNull(),
  copyright: text('copyright'),
  service_version: text('service_version'),
  cached_at: timestamp('cached_at').defaultNow().notNull(),
});

const monthlyGuides = pgTable('monthly_guides', {
  id: serial('id').primaryKey(),
  month: text('month').notNull(),
  year: integer('year').notNull(),
  headline: text('headline').notNull(),
  description: text('description').notNull(),
  hemisphere: text('hemisphere').notNull(),
  videoUrls: text('video_urls').array(),
  isAdmin: boolean('is_admin').default(false),
});

// Database connection (lazy initialization)
let db: ReturnType<typeof drizzle> | null = null;
function getDb() {
  if (!db) {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL is not set');
    }
    const sql = neon(process.env.DATABASE_URL);
    db = drizzle({ client: sql });
  }
  return db;
}

// NASA/Wikipedia Image Search Functions (inline for Vercel)
interface NasaImageSearchResult {
  success: boolean;
  object_name: string;
  image_url: string | null;
  error?: string;
  source?: 'nasa' | 'wikipedia';
}

async function makeApiRequest<T>(url: string, maxRetries: number = 3): Promise<T | null> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'StellarDiary/1.0 (+https://stellar-diary.vercel.app)'
        }
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return await response.json() as T;
    } catch (error) {
      console.error(`Attempt ${attempt + 1} failed:`, error);
      if (attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
  }
  return null;
}

async function searchNasaImages(query: string): Promise<string | null> {
  try {
    const params = new URLSearchParams({
      q: query,
      media_type: 'image',
      page: '1',
      page_size: '3'
    });
    const url = `https://images-api.nasa.gov/search?${params.toString()}`;
    const response = await makeApiRequest<any>(url);

    if (!response?.collection?.items?.length) return null;

    const firstItem = response.collection.items[0];
    const nasaId = firstItem.data?.[0]?.nasa_id;

    if (nasaId) {
      const assetUrl = `https://images-api.nasa.gov/asset/${nasaId}`;
      const assetResponse = await makeApiRequest<any>(assetUrl);

      if (assetResponse?.collection?.items) {
        for (const item of assetResponse.collection.items) {
          const href = item.href;
          if (href && (href.endsWith('.jpg') || href.endsWith('.jpeg') || href.endsWith('.png'))) {
            if (href.toLowerCase().includes('large') || href.includes('1024')) {
              return href;
            }
          }
        }
        // Return first image if no large version found
        const firstImage = assetResponse.collection.items.find((i: any) =>
          i.href?.endsWith('.jpg') || i.href?.endsWith('.jpeg') || i.href?.endsWith('.png')
        );
        if (firstImage) return firstImage.href;
      }
    }

    // Fallback to preview link
    const previewLink = firstItem.links?.find((link: any) => link.rel === 'preview');
    return previewLink?.href || null;
  } catch (error) {
    console.error('NASA image search failed:', error);
    return null;
  }
}

async function searchWikipediaImage(objectName: string): Promise<string | null> {
  try {
    const params = new URLSearchParams({
      action: 'query',
      format: 'json',
      prop: 'pageimages',
      piprop: 'thumbnail',
      pithumbsize: '800',
      titles: objectName,
      redirects: '1',
      origin: '*'
    });
    const url = `https://en.wikipedia.org/w/api.php?${params.toString()}`;
    const response = await makeApiRequest<any>(url);

    if (response?.query?.pages) {
      for (const pageId in response.query.pages) {
        const page = response.query.pages[pageId];
        if (page.thumbnail?.source) {
          return page.thumbnail.source;
        }
      }
    }
    return null;
  } catch (error) {
    console.error('Wikipedia image search failed:', error);
    return null;
  }
}

async function searchCelestialObjectImage(objectName: string): Promise<NasaImageSearchResult> {
  console.log(`🔍 Searching for image: ${objectName}`);

  // Try NASA first
  const nasaUrl = await searchNasaImages(objectName);
  if (nasaUrl) {
    console.log(`✓ Found NASA image for ${objectName}`);
    return { success: true, object_name: objectName, image_url: nasaUrl, source: 'nasa' };
  }

  // Try Wikipedia
  console.log(`NASA search failed for ${objectName}, trying Wikipedia...`);
  const wikiUrl = await searchWikipediaImage(objectName);
  if (wikiUrl) {
    console.log(`✓ Found Wikipedia image for ${objectName}`);
    return { success: true, object_name: objectName, image_url: wikiUrl, source: 'wikipedia' };
  }

  return { success: false, object_name: objectName, image_url: null, error: 'No image found' };
}

const app = express();
app.use(express.json());

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    hasDbUrl: !!process.env.DATABASE_URL
  });
});

// Get all celestial objects (with optional filtering)
app.get('/api/celestial-objects', async (req, res) => {
  try {
    const { type, month, hemisphere } = req.query;

    let objects = await getDb().select().from(celestialObjects);

    // Filter by type if provided
    if (type && typeof type === 'string') {
      objects = objects.filter(obj => obj.type === type);
    }

    // Filter by month if provided
    if (month && typeof month === 'string') {
      objects = objects.filter(obj => obj.month === month);
    }

    // Filter by hemisphere if provided
    if (hemisphere && typeof hemisphere === 'string') {
      objects = objects.filter(obj =>
        obj.hemisphere === hemisphere ||
        obj.hemisphere?.toLowerCase() === 'both' ||
        obj.hemisphere === 'Both'
      );
    }

    res.json(objects);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch celestial objects',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get all observations
app.get('/api/observations', async (_req, res) => {
  try {
    const obs = await getDb().select().from(observations);
    // Enhance with celestial object details
    const enhanced = await Promise.all(
      obs.map(async (o) => {
        const [celestialObject] = await getDb()
          .select()
          .from(celestialObjects)
          .where(eq(celestialObjects.id, o.objectId!));
        return { ...o, celestialObject };
      })
    );
    res.json(enhanced);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch observations',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Helper to fetch today's APOD from NASA API (no date param = today)
async function fetchApodFromNasa(): Promise<{
  date: string;
  title: string;
  explanation: string;
  url: string;
  hdurl?: string;
  media_type: string;
  copyright?: string;
  service_version?: string;
}> {
  const apiKey = process.env.NASA_API_KEY || 'DEMO_KEY';

  const response = await fetch(`https://api.nasa.gov/planetary/apod?api_key=${apiKey}`, {
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'StellarDiary/1.0'
    }
  });

  if (!response.ok) {
    throw new Error(`NASA API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

// Get APOD - always fetch fresh from NASA, use cache only as fallback
app.get('/api/apod', async (_req, res) => {
  try {
    // Always fetch today's APOD from NASA (no date param = today)
    const nasaData = await fetchApodFromNasa();
    const apodDate = nasaData.date;

    // Check if we already have this date cached
    const [existingCache] = await getDb()
      .select()
      .from(apodCache)
      .where(eq(apodCache.date, apodDate))
      .limit(1);

    // Save to cache if not already cached
    if (!existingCache) {
      await getDb().insert(apodCache).values({
        date: nasaData.date,
        title: nasaData.title,
        explanation: nasaData.explanation,
        url: nasaData.url,
        hdurl: nasaData.hdurl || null,
        media_type: nasaData.media_type,
        copyright: nasaData.copyright || null,
        service_version: nasaData.service_version || null,
      });
    }

    // Return fresh data from NASA
    res.json(nasaData);
  } catch (error) {
    console.error('NASA API error, falling back to cache:', error);

    // NASA API failed - fall back to most recent cached APOD
    try {
      const [cachedApod] = await getDb()
        .select()
        .from(apodCache)
        .orderBy(desc(apodCache.id))
        .limit(1);

      if (cachedApod) {
        res.json({
          ...cachedApod,
          _cached: true,
          _error: error instanceof Error ? error.message : 'Unknown error'
        });
        return;
      }
    } catch (cacheError) {
      // Cache also failed
    }

    res.status(500).json({
      error: 'Failed to fetch APOD',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get monthly guide
app.get('/api/monthly-guide', async (req, res) => {
  try {
    const month = (req.query.month as string) || new Date().toLocaleString('default', { month: 'long' });
    const year = parseInt((req.query.year as string) || new Date().getFullYear().toString());
    const hemisphere = (req.query.hemisphere as string) || 'Northern';

    const guides = await getDb().select().from(monthlyGuides);
    const guide = guides.find(g =>
      g.month === month &&
      g.year === year &&
      (g.hemisphere === hemisphere || g.hemisphere === 'both' || g.hemisphere === 'Both')
    );

    if (!guide) {
      return res.status(404).json({ message: 'Monthly guide not found' });
    }

    res.json(guide);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch monthly guide',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Update monthly guide (for adding/removing videos)
app.patch('/api/monthly-guide/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid ID format' });
    }

    // Get the guide to make sure it exists
    const [existingGuide] = await getDb()
      .select()
      .from(monthlyGuides)
      .where(eq(monthlyGuides.id, id))
      .limit(1);

    if (!existingGuide) {
      return res.status(404).json({ message: 'Monthly guide not found' });
    }

    // Update the guide with the provided fields
    const updateData: Partial<typeof existingGuide> = {};
    if (req.body.videoUrls !== undefined) updateData.videoUrls = req.body.videoUrls;
    if (req.body.headline !== undefined) updateData.headline = req.body.headline;
    if (req.body.description !== undefined) updateData.description = req.body.description;

    const [updatedGuide] = await getDb()
      .update(monthlyGuides)
      .set(updateData)
      .where(eq(monthlyGuides.id, id))
      .returning();

    res.json(updatedGuide);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to update monthly guide',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Helper: Extract celestial objects from article text
function extractCelestialObjects(text: string, month: string): Array<{
  name: string;
  type: string;
  description: string;
  constellation?: string;
  magnitude?: string;
}> {
  const objects: Array<{
    name: string;
    type: string;
    description: string;
    constellation?: string;
    magnitude?: string;
  }> = [];
  const foundNames = new Set<string>();

  // Messier object patterns (M1, M31, M42, etc.)
  const messierPattern = /\b(M|Messier\s*)(\d{1,3})\b/gi;
  let match;
  while ((match = messierPattern.exec(text)) !== null) {
    const num = match[2];
    const name = `M${num}`;
    if (!foundNames.has(name)) {
      foundNames.add(name);
      objects.push({
        name,
        type: getMessierType(parseInt(num)),
        description: getMessierDescription(parseInt(num)),
        constellation: getMessierConstellation(parseInt(num)),
        magnitude: getMessierMagnitude(parseInt(num)),
      });
    }
  }

  // NGC objects (NGC 224, NGC 7000, etc.)
  const ngcPattern = /\bNGC\s*(\d{1,4})\b/gi;
  while ((match = ngcPattern.exec(text)) !== null) {
    const name = `NGC ${match[1]}`;
    if (!foundNames.has(name)) {
      foundNames.add(name);
      objects.push({
        name,
        type: 'galaxy',
        description: `NGC ${match[1]} - a deep sky object visible in ${month}.`,
      });
    }
  }

  // IC objects (IC 434, etc.)
  const icPattern = /\bIC\s*(\d{1,4})\b/gi;
  while ((match = icPattern.exec(text)) !== null) {
    const name = `IC ${match[1]}`;
    if (!foundNames.has(name)) {
      foundNames.add(name);
      objects.push({
        name,
        type: 'nebula',
        description: `IC ${match[1]} - a deep sky object visible in ${month}.`,
      });
    }
  }

  // Planets
  const planets = ['Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune'];
  for (const planet of planets) {
    const planetPattern = new RegExp(`\\b${planet}\\b`, 'gi');
    if (planetPattern.test(text) && !foundNames.has(planet)) {
      foundNames.add(planet);
      objects.push({
        name: planet,
        type: 'planet',
        description: getPlanetDescription(planet, month),
        magnitude: getPlanetMagnitude(planet),
      });
    }
  }

  // Named deep sky objects
  const namedObjects: Record<string, { type: string; description: string; constellation?: string }> = {
    'Orion Nebula': { type: 'nebula', description: 'The Orion Nebula (M42) is a diffuse nebula in the Milky Way, south of Orion\'s Belt.', constellation: 'Orion' },
    'Andromeda Galaxy': { type: 'galaxy', description: 'The Andromeda Galaxy (M31) is the nearest major galaxy to the Milky Way.', constellation: 'Andromeda' },
    'Pleiades': { type: 'star_cluster', description: 'The Pleiades (M45), also known as the Seven Sisters, is an open star cluster.', constellation: 'Taurus' },
    'Ring Nebula': { type: 'nebula', description: 'The Ring Nebula (M57) is a planetary nebula in the constellation Lyra.', constellation: 'Lyra' },
    'Whirlpool Galaxy': { type: 'galaxy', description: 'The Whirlpool Galaxy (M51) is a grand-design spiral galaxy.', constellation: 'Canes Venatici' },
    'Lagoon Nebula': { type: 'nebula', description: 'The Lagoon Nebula (M8) is a giant interstellar cloud in Sagittarius.', constellation: 'Sagittarius' },
    'Eagle Nebula': { type: 'nebula', description: 'The Eagle Nebula (M16) contains the famous Pillars of Creation.', constellation: 'Serpens' },
    'Crab Nebula': { type: 'nebula', description: 'The Crab Nebula (M1) is a supernova remnant in the constellation Taurus.', constellation: 'Taurus' },
    'Hercules Cluster': { type: 'star_cluster', description: 'The Great Hercules Cluster (M13) is a globular cluster in Hercules.', constellation: 'Hercules' },
    'Beehive Cluster': { type: 'star_cluster', description: 'The Beehive Cluster (M44) is an open cluster in the constellation Cancer.', constellation: 'Cancer' },
    'Double Cluster': { type: 'star_cluster', description: 'The Double Cluster consists of NGC 869 and NGC 884 in Perseus.', constellation: 'Perseus' },
  };

  for (const [name, info] of Object.entries(namedObjects)) {
    const pattern = new RegExp(name, 'gi');
    if (pattern.test(text) && !foundNames.has(name)) {
      foundNames.add(name);
      objects.push({
        name,
        type: info.type,
        description: info.description,
        constellation: info.constellation,
      });
    }
  }

  return objects;
}

// Helper functions for Messier objects
function getMessierType(num: number): string {
  const galaxies = [31, 32, 33, 49, 51, 58, 59, 60, 61, 63, 64, 65, 66, 74, 77, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 94, 95, 96, 98, 99, 100, 101, 104, 105, 106, 108, 109, 110];
  const nebulae = [1, 8, 16, 17, 20, 27, 42, 43, 57, 76, 78, 97];
  const globularClusters = [2, 3, 4, 5, 9, 10, 12, 13, 14, 15, 19, 22, 28, 30, 53, 54, 55, 56, 62, 68, 69, 70, 71, 72, 75, 79, 80, 92, 107];

  if (galaxies.includes(num)) return 'galaxy';
  if (nebulae.includes(num)) return 'nebula';
  if (globularClusters.includes(num)) return 'star_cluster';
  return 'star_cluster'; // default to open cluster
}

function getMessierDescription(num: number): string {
  const descriptions: Record<number, string> = {
    1: 'The Crab Nebula - a supernova remnant, the result of a supernova recorded in 1054 AD.',
    13: 'The Great Hercules Cluster - one of the brightest globular clusters, containing several hundred thousand stars.',
    31: 'The Andromeda Galaxy - the nearest major galaxy to our Milky Way, visible to the naked eye.',
    42: 'The Orion Nebula - a diffuse nebula situated in the Milky Way, one of the brightest nebulae.',
    45: 'The Pleiades - an open star cluster also known as the Seven Sisters.',
    51: 'The Whirlpool Galaxy - a grand-design spiral galaxy interacting with NGC 5195.',
    57: 'The Ring Nebula - a planetary nebula, the glowing remains of a sun-like star.',
    81: 'Bode\'s Galaxy - a grand design spiral galaxy about 12 million light-years away.',
    82: 'The Cigar Galaxy - a starburst galaxy approximately 12 million light-years away.',
    104: 'The Sombrero Galaxy - an unusual galaxy with a bright nucleus and large central bulge.',
  };
  return descriptions[num] || `Messier ${num} - a deep sky object in the Messier catalog.`;
}

function getMessierConstellation(num: number): string {
  const constellations: Record<number, string> = {
    1: 'Taurus', 13: 'Hercules', 31: 'Andromeda', 42: 'Orion', 45: 'Taurus',
    51: 'Canes Venatici', 57: 'Lyra', 81: 'Ursa Major', 82: 'Ursa Major', 104: 'Virgo',
    8: 'Sagittarius', 16: 'Serpens', 17: 'Sagittarius', 20: 'Sagittarius', 27: 'Vulpecula',
  };
  return constellations[num] || 'Unknown';
}

function getMessierMagnitude(num: number): string {
  const magnitudes: Record<number, string> = {
    1: '8.4', 13: '5.8', 31: '3.4', 42: '4.0', 45: '1.6',
    51: '8.4', 57: '8.8', 81: '6.9', 82: '8.4', 104: '8.0',
  };
  return magnitudes[num] || 'Variable';
}

function getPlanetDescription(planet: string, month: string): string {
  const descriptions: Record<string, string> = {
    Mercury: `Mercury - the smallest planet and closest to the Sun, visible in ${month} during twilight.`,
    Venus: `Venus - the brightest planet, often called the morning or evening star.`,
    Mars: `Mars - the Red Planet, showing surface features through telescopes.`,
    Jupiter: `Jupiter - the largest planet with visible cloud bands and four bright Galilean moons.`,
    Saturn: `Saturn - the ringed planet, one of the most spectacular sights through a telescope.`,
    Uranus: `Uranus - an ice giant appearing as a small blue-green disc.`,
    Neptune: `Neptune - the most distant planet, requiring a telescope to observe.`,
  };
  return descriptions[planet] || `${planet} - visible in ${month}.`;
}

function getPlanetMagnitude(planet: string): string {
  const magnitudes: Record<string, string> = {
    Mercury: '-1.9 to 5.7', Venus: '-4.9 to -3.8', Mars: '-2.9 to 1.8',
    Jupiter: '-2.9 to -1.6', Saturn: '-0.5 to 1.5', Uranus: '5.3 to 6.0', Neptune: '7.8 to 8.0',
  };
  return magnitudes[planet] || 'Variable';
}

// Admin: Update monthly guide from URL
app.post('/api/admin/update-monthly-guide', async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({
        success: false,
        message: 'URL is required',
        objectsAdded: 0
      });
    }

    // Get current month/year
    const currentDate = new Date();
    const month = currentDate.toLocaleString('default', { month: 'long' });
    const year = currentDate.getFullYear();

    // Fetch the URL content
    console.log(`Fetching content from: ${url}`);
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; StellarDiary/1.0)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      }
    });

    if (!response.ok) {
      return res.status(400).json({
        success: false,
        message: `Failed to fetch URL: ${response.status} ${response.statusText}`,
        objectsAdded: 0
      });
    }

    const html = await response.text();

    // Extract text content (simple HTML stripping)
    const textContent = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // Extract celestial objects from the content
    const extractedObjects = extractCelestialObjects(textContent, month);
    console.log(`Extracted ${extractedObjects.length} celestial objects from article`);

    // Add objects to database with NASA/Wikipedia image search
    let objectsAdded = 0;
    const existingObjects = await getDb().select().from(celestialObjects);
    const existingNames = new Set(existingObjects.map(o => o.name.toLowerCase()));

    for (const obj of extractedObjects) {
      if (!existingNames.has(obj.name.toLowerCase())) {
        try {
          // Search for image from NASA or Wikipedia
          let imageUrl = 'https://images.unsplash.com/photo-1446776877081-d282a0f896e2?auto=format&fit=crop&w=800&h=500';
          let imageSource = 'fallback';

          try {
            const imageResult = await searchCelestialObjectImage(obj.name);
            if (imageResult.success && imageResult.image_url) {
              imageUrl = imageResult.image_url;
              imageSource = imageResult.source || 'unknown';
            }
          } catch (imgErr) {
            console.log(`⚠ Image search failed for ${obj.name}: ${imgErr}`);
          }

          await getDb().insert(celestialObjects).values({
            name: obj.name,
            type: obj.type,
            description: obj.description,
            coordinates: 'See star chart',
            bestViewingTime: `Best viewed in ${month}`,
            imageUrl: imageUrl,
            visibilityRating: 'Good',
            information: `Featured in ${month} ${year} sky guide.`,
            constellation: obj.constellation || 'Various',
            magnitude: obj.magnitude || 'Variable',
            hemisphere: 'Northern',
            recommendedEyepiece: obj.type === 'planet' ? 'High power (6-10mm)' : 'Low to medium power (20-40mm)',
            month: month,
          });
          objectsAdded++;
          existingNames.add(obj.name.toLowerCase());
          console.log(`✓ Added: ${obj.name} [image: ${imageSource}]`);

          // Small delay between API calls
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (err) {
          console.log(`Skipped ${obj.name}: ${err}`);
        }
      }
    }

    // Check if guide already exists for this month/year
    const existingGuides = await getDb().select().from(monthlyGuides);
    const existingGuide = existingGuides.find(g =>
      g.month === month &&
      g.year === year &&
      g.hemisphere === 'Northern'
    );

    if (existingGuide) {
      // Update existing guide
      await getDb()
        .update(monthlyGuides)
        .set({
          headline: `${month} ${year}: Astronomy Highlights`,
          description: `Featured celestial objects and viewing opportunities for ${month} ${year}. Content imported from: ${url}`,
        })
        .where(eq(monthlyGuides.id, existingGuide.id));
    } else {
      // Create new guide
      await getDb().insert(monthlyGuides).values({
        month,
        year,
        hemisphere: 'Northern',
        headline: `${month} ${year}: Astronomy Highlights`,
        description: `Featured celestial objects and viewing opportunities for ${month} ${year}. Content imported from: ${url}`,
        videoUrls: [],
        isAdmin: false,
      });
    }

    res.json({
      success: true,
      message: `Successfully imported ${objectsAdded} celestial objects for ${month} ${year}`,
      objectsAdded,
      guideUpdated: true
    });
  } catch (error) {
    console.error('Error in update-monthly-guide:', error);
    res.status(500).json({
      success: false,
      message: `Failed to update monthly guide: ${error instanceof Error ? error.message : 'Unknown error'}`,
      objectsAdded: 0,
      guideUpdated: false
    });
  }
});

// Create a new celestial object
app.post('/api/celestial-objects', async (req, res) => {
  try {
    // Search for NASA or Wikipedia image if name is provided
    let imageUrl = req.body.imageUrl;
    let imageSource = 'fallback';

    if (req.body.name) {
      try {
        console.log(`🔍 Searching for image (NASA/Wikipedia) for: ${req.body.name}`);
        const result = await searchCelestialObjectImage(req.body.name);
        if (result.success && result.image_url) {
          imageUrl = result.image_url;
          imageSource = result.source || 'unknown';
          console.log(`✓ Found image for ${req.body.name} [${imageSource}]: ${imageUrl}`);
        } else {
          console.log(`⚠ No image found for ${req.body.name}: ${result.error || 'No image available'}`);
        }
      } catch (error) {
        console.error(`❌ Image search failed for ${req.body.name}:`, error);
      }
    }

    // If no image was found, use type-specific fallback
    if (!imageUrl) {
      const objectType = req.body.type || 'galaxy';
      const fallbackImages: Record<string, string> = {
        'galaxy': 'https://images.unsplash.com/photo-1502134249126-9f3755a50d78?auto=format&fit=crop&w=800&h=500',
        'nebula': 'https://images.unsplash.com/photo-1502134249126-9f3755a50d78?auto=format&fit=crop&w=800&h=500',
        'star_cluster': 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?auto=format&fit=crop&w=800&h=500',
        'planet': 'https://images.unsplash.com/photo-1614728263952-84ea256f9679?auto=format&fit=crop&w=800&h=500',
        'star': 'https://images.unsplash.com/photo-1502134249126-9f3755a50d78?auto=format&fit=crop&w=800&h=500',
        'double_star': 'https://images.unsplash.com/photo-1502134249126-9f3755a50d78?auto=format&fit=crop&w=800&h=500',
        'meteor_shower': 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=800&h=500',
      };
      imageUrl = fallbackImages[objectType.toLowerCase()] || fallbackImages['galaxy'];
      imageSource = 'fallback';
      console.log(`📸 Using fallback image for type "${objectType}": ${imageUrl}`);
    }

    // Check if a celestial object with this name already exists
    const existingObjects = await getDb().select().from(celestialObjects);
    const exists = existingObjects.some(
      (obj) => obj.name.toLowerCase() === req.body.name?.toLowerCase()
    );

    if (exists) {
      return res.status(409).json({
        message: `A celestial object with the name "${req.body.name}" already exists`
      });
    }

    // Create the celestial object
    const [newObject] = await getDb().insert(celestialObjects).values({
      name: req.body.name,
      type: req.body.type,
      description: req.body.description || `${req.body.name} - a celestial object.`,
      coordinates: req.body.coordinates || 'See star chart',
      bestViewingTime: req.body.bestViewingTime || 'Variable',
      imageUrl: imageUrl,
      visibilityRating: req.body.visibilityRating || 'Custom',
      information: req.body.information || 'Custom celestial object',
      constellation: req.body.constellation || 'Not specified',
      magnitude: req.body.magnitude || 'Not specified',
      hemisphere: req.body.hemisphere || 'Both',
      recommendedEyepiece: req.body.recommendedEyepiece || 'Not specified',
      month: req.body.month || null,
    }).returning();

    res.status(201).json({
      ...newObject,
      _debug: { imageSource }
    });
  } catch (error) {
    console.error('Error creating celestial object:', error);
    res.status(500).json({
      error: 'Failed to create celestial object',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Create a new observation
app.post('/api/observations', async (req, res) => {
  try {
    const { objectId, isObserved, observationNotes, plannedDate } = req.body;

    if (!objectId) {
      return res.status(400).json({ message: 'objectId is required' });
    }

    // Check if celestial object exists
    const [object] = await getDb()
      .select()
      .from(celestialObjects)
      .where(eq(celestialObjects.id, objectId))
      .limit(1);

    if (!object) {
      return res.status(404).json({ message: 'Celestial object not found' });
    }

    // For demo purposes, use a fixed user ID of 1
    const userId = 1;

    // Create new observation
    const [newObservation] = await getDb().insert(observations).values({
      userId,
      objectId,
      isObserved: isObserved || false,
      observationNotes: observationNotes || null,
      plannedDate: plannedDate || null,
    }).returning();

    res.status(201).json(newObservation);
  } catch (error) {
    console.error('Error creating observation:', error);
    res.status(500).json({
      error: 'Failed to create observation',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Update observation (mark as observed, add notes)
app.patch('/api/observations/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid ID format' });
    }

    // Check if observation exists
    const [observation] = await getDb()
      .select()
      .from(observations)
      .where(eq(observations.id, id))
      .limit(1);

    if (!observation) {
      return res.status(404).json({ message: 'Observation not found' });
    }

    // For demo purposes, use a fixed user ID of 1
    const userId = 1;
    if (observation.userId !== userId) {
      return res.status(403).json({ message: 'Not authorized to update this observation' });
    }

    // Build update object
    const updateData: Partial<typeof observation> = {};
    if (req.body.isObserved !== undefined) updateData.isObserved = req.body.isObserved;
    if (req.body.observationNotes !== undefined) updateData.observationNotes = req.body.observationNotes;
    if (req.body.plannedDate !== undefined) updateData.plannedDate = req.body.plannedDate;

    const [updatedObservation] = await getDb()
      .update(observations)
      .set(updateData)
      .where(eq(observations.id, id))
      .returning();

    res.json(updatedObservation);
  } catch (error) {
    console.error('Error updating observation:', error);
    res.status(500).json({
      error: 'Failed to update observation',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Delete observation
app.delete('/api/observations/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid ID format' });
    }

    // Check if observation exists
    const [observation] = await getDb()
      .select()
      .from(observations)
      .where(eq(observations.id, id))
      .limit(1);

    if (!observation) {
      return res.status(404).json({ message: 'Observation not found' });
    }

    // For demo purposes, use a fixed user ID of 1
    const userId = 1;
    if (observation.userId !== userId) {
      return res.status(403).json({ message: 'Not authorized to delete this observation' });
    }

    await getDb().delete(observations).where(eq(observations.id, id));
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting observation:', error);
    res.status(500).json({
      error: 'Failed to delete observation',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Catch-all for other routes
app.all('*', (req, res) => {
  res.status(404).json({ error: 'Not found', path: req.path });
});

export default function handler(req: VercelRequest, res: VercelResponse) {
  return app(req, res);
}

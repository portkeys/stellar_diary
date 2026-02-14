import type { VercelRequest, VercelResponse } from '@vercel/node';
import express from 'express';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { pgTable, text, serial, integer, boolean, date, timestamp } from 'drizzle-orm/pg-core';
import { eq, desc } from 'drizzle-orm';

// Inline schema definitions (Vercel can't resolve imports from outside /api)
// Simplified celestial objects - static catalog without time-specific info
const celestialObjects = pgTable('celestial_objects', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(),
  type: text('type').notNull(),
  description: text('description').notNull(),
  imageUrl: text('image_url'),
  constellation: text('constellation'),
  magnitude: text('magnitude'),
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
  sources: text('sources').array(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Guide objects junction table - links celestial objects to specific monthly guides
const guideObjects = pgTable('guide_objects', {
  id: serial('id').primaryKey(),
  guideId: integer('guide_id').notNull(),
  objectId: integer('object_id').notNull(),
  viewingTips: text('viewing_tips'),
  highlights: text('highlights'),
  sortOrder: integer('sort_order').default(0),
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

// Get all celestial objects (static catalog, optional type filter)
app.get('/api/celestial-objects', async (req, res) => {
  try {
    const { type } = req.query;

    let objects = await getDb().select().from(celestialObjects);

    // Filter by type if provided
    if (type && typeof type === 'string') {
      objects = objects.filter(obj => obj.type === type);
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

// Get objects linked to a monthly guide
app.get('/api/monthly-guide/:id/objects', async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid ID format' });
    }

    // Get guide objects for this guide
    const links = await getDb().select().from(guideObjects)
      .where(eq(guideObjects.guideId, id));

    if (links.length === 0) {
      return res.json([]);
    }

    // Get the actual celestial objects
    const objectIds = links.map(link => link.objectId);
    const objects = await getDb().select().from(celestialObjects);
    const linkedObjects = objects.filter(obj => objectIds.includes(obj.id));

    // Combine with viewing tips and highlights
    const result = links.map(link => {
      const obj = linkedObjects.find(o => o.id === link.objectId);
      return {
        ...obj,
        viewingTips: link.viewingTips,
        highlights: link.highlights,
        sortOrder: link.sortOrder,
      };
    }).filter(item => item.id).sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

    res.json(result);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch guide objects',
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
            imageUrl: imageUrl,
            constellation: obj.constellation || null,
            magnitude: obj.magnitude || null,
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
    let guide = existingGuides.find(g =>
      g.month === month &&
      g.year === year &&
      g.hemisphere === 'Northern'
    );

    if (guide) {
      // Update existing guide with new source
      const existingSources = guide.sources || [];
      const newSources = existingSources.includes(url) ? existingSources : [...existingSources, url];
      await getDb()
        .update(monthlyGuides)
        .set({
          headline: `${month} ${year}: Astronomy Highlights`,
          description: `Featured celestial objects and viewing opportunities for ${month} ${year}.`,
          sources: newSources,
        })
        .where(eq(monthlyGuides.id, guide.id));
    } else {
      // Create new guide
      const [newGuide] = await getDb().insert(monthlyGuides).values({
        month,
        year,
        hemisphere: 'Northern',
        headline: `${month} ${year}: Astronomy Highlights`,
        description: `Featured celestial objects and viewing opportunities for ${month} ${year}.`,
        videoUrls: [],
        sources: [url],
      }).returning();
      guide = newGuide;
    }

    // Link extracted objects to this guide via guideObjects junction table
    if (guide) {
      // Get all objects that were just added or already exist
      const allObjects = await getDb().select().from(celestialObjects);
      const extractedNames = new Set(extractedObjects.map(o => o.name.toLowerCase()));

      for (const obj of allObjects) {
        if (extractedNames.has(obj.name.toLowerCase())) {
          // Check if already linked
          const existingLinks = await getDb().select().from(guideObjects)
            .where(eq(guideObjects.guideId, guide.id));
          const alreadyLinked = existingLinks.some(link => link.objectId === obj.id);

          if (!alreadyLinked) {
            await getDb().insert(guideObjects).values({
              guideId: guide.id,
              objectId: obj.id,
              sortOrder: existingLinks.length,
            });
          }
        }
      }
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

// Create a new celestial object (static catalog entry)
app.post('/api/celestial-objects', async (req, res) => {
  try {
    // Search for NASA or Wikipedia image if name is provided
    let imageUrl = req.body.imageUrl;
    let imageSource = 'provided';

    if (!imageUrl && req.body.name) {
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
        'nebula': 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=800&h=500',
        'star_cluster': 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?auto=format&fit=crop&w=800&h=500',
        'planet': 'https://images.unsplash.com/photo-1614728263952-84ea256f9679?auto=format&fit=crop&w=800&h=500',
        'double_star': 'https://images.unsplash.com/photo-1502134249126-9f3755a50d78?auto=format&fit=crop&w=800&h=500',
        'other': 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=800&h=500',
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

    // Create the celestial object with simplified schema
    const [newObject] = await getDb().insert(celestialObjects).values({
      name: req.body.name,
      type: req.body.type || 'other',
      description: req.body.description || `${req.body.name} - a celestial object.`,
      imageUrl: imageUrl,
      constellation: req.body.constellation || null,
      magnitude: req.body.magnitude || null,
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

// ========== Auto-Populate Monthly Guide ==========

// Turn Left at Orion data (inline for Vercel)
type Season = 'winter' | 'spring' | 'summer' | 'fall';
type Difficulty = 'easy' | 'moderate' | 'challenging';

interface TLTOObject {
  name: string;
  commonName?: string | null;
  type: string;
  constellation: string;
  magnitude: string;
  difficulty: Difficulty;
  description: string;
  viewingTips: string;
}

const seasonMonths: Record<Season, string[]> = {
  winter: ['December', 'January', 'February'],
  spring: ['March', 'April', 'May'],
  summer: ['June', 'July', 'August'],
  fall: ['September', 'October', 'November'],
};

const transitionOverlap: Record<string, Season[]> = {
  'March': ['winter', 'spring'],
  'June': ['spring', 'summer'],
  'September': ['summer', 'fall'],
  'December': ['fall', 'winter'],
};

const tltoWinter: TLTOObject[] = [
  { name: 'M42', commonName: 'Orion Nebula', type: 'nebula', constellation: 'Orion', magnitude: '4.0', difficulty: 'easy', description: 'The Great Orion Nebula - a vast stellar nursery visible to the naked eye.', viewingTips: 'Use low power to see the full extent. Look for the Trapezium star cluster at the center.' },
  { name: 'M1', commonName: 'Crab Nebula', type: 'nebula', constellation: 'Taurus', magnitude: '8.4', difficulty: 'moderate', description: 'Supernova remnant from a stellar explosion recorded in 1054 AD.', viewingTips: 'Appears as an oval glow. Use averted vision for best results.' },
  { name: 'M45', commonName: 'Pleiades', type: 'star_cluster', constellation: 'Taurus', magnitude: '1.6', difficulty: 'easy', description: 'The Seven Sisters - one of the nearest open clusters to Earth.', viewingTips: 'Best in binoculars or a wide-field eyepiece.' },
  { name: 'M35', commonName: null, type: 'star_cluster', constellation: 'Gemini', magnitude: '5.3', difficulty: 'easy', description: 'A rich open cluster near Castor\'s foot in Gemini.', viewingTips: 'Look for the smaller cluster NGC 2158 nearby.' },
  { name: 'M36', commonName: null, type: 'star_cluster', constellation: 'Auriga', magnitude: '6.3', difficulty: 'easy', description: 'A compact open cluster in Auriga.', viewingTips: 'Part of the Auriga cluster trio with M37 and M38.' },
  { name: 'M37', commonName: null, type: 'star_cluster', constellation: 'Auriga', magnitude: '6.2', difficulty: 'easy', description: 'The richest of the three Auriga clusters.', viewingTips: 'Best of the Auriga trio. Look for the orange central star.' },
  { name: 'M38', commonName: null, type: 'star_cluster', constellation: 'Auriga', magnitude: '7.4', difficulty: 'easy', description: 'An open cluster with stars arranged in a cross pattern.', viewingTips: 'Note the cross-shaped pattern.' },
  { name: 'M78', commonName: null, type: 'nebula', constellation: 'Orion', magnitude: '8.3', difficulty: 'moderate', description: 'A reflection nebula northeast of Orion\'s Belt.', viewingTips: 'Look for a comet-like glow with two embedded stars.' },
  { name: 'M41', commonName: null, type: 'star_cluster', constellation: 'Canis Major', magnitude: '4.5', difficulty: 'easy', description: 'A bright open cluster just south of Sirius.', viewingTips: 'Contains a distinctive orange star near center.' },
  { name: 'NGC 457', commonName: 'Owl Cluster', type: 'star_cluster', constellation: 'Cassiopeia', magnitude: '6.4', difficulty: 'easy', description: 'An open cluster resembling an owl with two bright "eyes".', viewingTips: 'The two brightest stars form the eyes.' },
];

const tltoSpring: TLTOObject[] = [
  { name: 'M81', commonName: 'Bode\'s Galaxy', type: 'galaxy', constellation: 'Ursa Major', magnitude: '6.9', difficulty: 'moderate', description: 'A grand design spiral galaxy, one of the brightest galaxies.', viewingTips: 'Best with M82 in the same field of view.' },
  { name: 'M82', commonName: 'Cigar Galaxy', type: 'galaxy', constellation: 'Ursa Major', magnitude: '8.4', difficulty: 'moderate', description: 'A starburst galaxy with a distinctive edge-on elongated shape.', viewingTips: 'Note the cigar shape compared to M81.' },
  { name: 'M51', commonName: 'Whirlpool Galaxy', type: 'galaxy', constellation: 'Canes Venatici', magnitude: '8.4', difficulty: 'moderate', description: 'A face-on spiral galaxy interacting with companion NGC 5195.', viewingTips: 'With good conditions you may glimpse spiral arms.' },
  { name: 'M104', commonName: 'Sombrero Galaxy', type: 'galaxy', constellation: 'Virgo', magnitude: '8.0', difficulty: 'moderate', description: 'A nearly edge-on galaxy with a prominent dust lane.', viewingTips: 'Look for the dark dust lane cutting across the bright center.' },
  { name: 'M65', commonName: null, type: 'galaxy', constellation: 'Leo', magnitude: '10.3', difficulty: 'moderate', description: 'Part of the Leo Triplet with M66 and NGC 3628.', viewingTips: 'View all three in the same field.' },
  { name: 'M66', commonName: null, type: 'galaxy', constellation: 'Leo', magnitude: '9.7', difficulty: 'moderate', description: 'The brightest member of the Leo Triplet.', viewingTips: 'Note the slightly asymmetric shape.' },
  { name: 'M44', commonName: 'Beehive Cluster', type: 'star_cluster', constellation: 'Cancer', magnitude: '3.7', difficulty: 'easy', description: 'A large open cluster visible to the naked eye.', viewingTips: 'Best in binoculars.' },
  { name: 'M3', commonName: null, type: 'star_cluster', constellation: 'Canes Venatici', magnitude: '6.2', difficulty: 'easy', description: 'A brilliant globular cluster.', viewingTips: 'Try higher magnification to resolve individual stars.' },
  { name: 'M87', commonName: 'Virgo A', type: 'galaxy', constellation: 'Virgo', magnitude: '9.6', difficulty: 'moderate', description: 'A giant elliptical galaxy at the heart of the Virgo Cluster.', viewingTips: 'Appears as a round glow.' },
  { name: 'M64', commonName: 'Black Eye Galaxy', type: 'galaxy', constellation: 'Coma Berenices', magnitude: '9.4', difficulty: 'moderate', description: 'A spiral galaxy with a prominent dark dust band.', viewingTips: 'Higher magnification may reveal the dark "black eye" feature.' },
];

const tltoSummer: TLTOObject[] = [
  { name: 'M13', commonName: 'Great Hercules Cluster', type: 'star_cluster', constellation: 'Hercules', magnitude: '5.8', difficulty: 'easy', description: 'The finest globular cluster in the northern sky.', viewingTips: 'Use medium-high power to resolve stars at the edges.' },
  { name: 'M57', commonName: 'Ring Nebula', type: 'nebula', constellation: 'Lyra', magnitude: '8.8', difficulty: 'moderate', description: 'A planetary nebula - the glowing shell of a dying star.', viewingTips: 'Use medium to high power. Looks like a tiny smoke ring.' },
  { name: 'M27', commonName: 'Dumbbell Nebula', type: 'nebula', constellation: 'Vulpecula', magnitude: '7.5', difficulty: 'easy', description: 'The largest and brightest planetary nebula.', viewingTips: 'An OIII filter enhances the view dramatically.' },
  { name: 'M8', commonName: 'Lagoon Nebula', type: 'nebula', constellation: 'Sagittarius', magnitude: '6.0', difficulty: 'easy', description: 'A bright emission nebula with an embedded open cluster.', viewingTips: 'Visible to the naked eye from dark sites.' },
  { name: 'M20', commonName: 'Trifid Nebula', type: 'nebula', constellation: 'Sagittarius', magnitude: '6.3', difficulty: 'moderate', description: 'Emission, reflection, and dark nebula divided into three lobes.', viewingTips: 'Look for the dark lanes. Pair with nearby M8.' },
  { name: 'M17', commonName: 'Omega Nebula', type: 'nebula', constellation: 'Sagittarius', magnitude: '6.0', difficulty: 'easy', description: 'A bright emission nebula also known as the Swan Nebula.', viewingTips: 'Look for the distinctive swan or checkmark shape.' },
  { name: 'M16', commonName: 'Eagle Nebula', type: 'nebula', constellation: 'Serpens', magnitude: '6.4', difficulty: 'moderate', description: 'Home of the Pillars of Creation.', viewingTips: 'The cluster is easy; the nebula requires dark skies.' },
  { name: 'M22', commonName: null, type: 'star_cluster', constellation: 'Sagittarius', magnitude: '5.1', difficulty: 'easy', description: 'One of the nearest and brightest globular clusters.', viewingTips: 'Resolves well into stars.' },
  { name: 'M11', commonName: 'Wild Duck Cluster', type: 'star_cluster', constellation: 'Scutum', magnitude: '6.3', difficulty: 'easy', description: 'One of the richest and most compact open clusters.', viewingTips: 'Looks almost like a globular cluster at low power.' },
  { name: 'M5', commonName: null, type: 'star_cluster', constellation: 'Serpens', magnitude: '5.7', difficulty: 'easy', description: 'One of the finest globular clusters, rivaling M13.', viewingTips: 'Resolves beautifully at medium power.' },
];

const tltoFall: TLTOObject[] = [
  { name: 'M31', commonName: 'Andromeda Galaxy', type: 'galaxy', constellation: 'Andromeda', magnitude: '3.4', difficulty: 'easy', description: 'The nearest major galaxy to the Milky Way.', viewingTips: 'Use lowest magnification. Look for M32 and M110 nearby.' },
  { name: 'M33', commonName: 'Triangulum Galaxy', type: 'galaxy', constellation: 'Triangulum', magnitude: '5.7', difficulty: 'challenging', description: 'A face-on spiral galaxy with very low surface brightness.', viewingTips: 'Requires dark skies and low power.' },
  { name: 'M15', commonName: null, type: 'star_cluster', constellation: 'Pegasus', magnitude: '6.2', difficulty: 'easy', description: 'A bright, compact globular cluster with a very dense core.', viewingTips: 'Note the intensely concentrated core.' },
  { name: 'M2', commonName: null, type: 'star_cluster', constellation: 'Aquarius', magnitude: '6.5', difficulty: 'easy', description: 'A rich globular cluster in Aquarius.', viewingTips: 'Resolves nicely at medium magnification.' },
  { name: 'NGC 869', commonName: 'Double Cluster', type: 'star_cluster', constellation: 'Perseus', magnitude: '5.3', difficulty: 'easy', description: 'Half of the famous Double Cluster.', viewingTips: 'Both clusters fit in a wide-field eyepiece.' },
  { name: 'NGC 884', commonName: 'Double Cluster', type: 'star_cluster', constellation: 'Perseus', magnitude: '6.1', difficulty: 'easy', description: 'The second half of the Double Cluster.', viewingTips: 'Note the red supergiant stars.' },
  { name: 'M52', commonName: null, type: 'star_cluster', constellation: 'Cassiopeia', magnitude: '5.0', difficulty: 'easy', description: 'A rich open cluster in Cassiopeia.', viewingTips: 'Fan-shaped cluster.' },
  { name: 'NGC 7009', commonName: 'Saturn Nebula', type: 'nebula', constellation: 'Aquarius', magnitude: '8.0', difficulty: 'moderate', description: 'A bright planetary nebula resembling Saturn.', viewingTips: 'Use high magnification.' },
  { name: 'M34', commonName: null, type: 'star_cluster', constellation: 'Perseus', magnitude: '5.5', difficulty: 'easy', description: 'A scattered open cluster easily seen in binoculars.', viewingTips: 'Contains several nice double stars.' },
  { name: 'M77', commonName: null, type: 'galaxy', constellation: 'Cetus', magnitude: '9.6', difficulty: 'moderate', description: 'A Seyfert galaxy with an active nucleus.', viewingTips: 'Bright compact core with a faint halo.' },
];

const allTltoSeasons: Record<Season, TLTOObject[]> = {
  winter: tltoWinter, spring: tltoSpring, summer: tltoSummer, fall: tltoFall,
};

function getSeasonalObjects(month: string): TLTOObject[] {
  const overlapSeasons = transitionOverlap[month];
  if (overlapSeasons) {
    const combined: TLTOObject[] = [];
    const seen = new Set<string>();
    for (const season of overlapSeasons) {
      for (const obj of allTltoSeasons[season]) {
        if (!seen.has(obj.name)) { seen.add(obj.name); combined.push(obj); }
      }
    }
    return combined;
  }
  for (const [season, months] of Object.entries(seasonMonths)) {
    if (months.includes(month)) return allTltoSeasons[season as Season];
  }
  return [...tltoWinter, ...tltoSpring, ...tltoSummer, ...tltoFall];
}

// YouTube API helpers (inline for Vercel)
const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';
const HIGH_POINT_CHANNEL_ID = 'UC1bUfNsIxfXmaCBPkeMkaxg';
const SKY_TEL_PLAYLIST_ID = 'PLjjX7u93iVQsau_F2CDOs53aQZK16rBgI';

interface YouTubeVideoResult {
  videoId: string;
  title: string;
  description: string;
  videoUrl: string;
  channelTitle: string;
}

async function fetchYouTubeHighPoint(month: string, year: number): Promise<YouTubeVideoResult | null> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) return null;
  try {
    const params = new URLSearchParams({
      part: 'snippet', channelId: HIGH_POINT_CHANNEL_ID,
      q: `${month} ${year} what's in the sky`, type: 'video', maxResults: '3', order: 'date', key: apiKey,
    });
    const resp = await fetch(`${YOUTUBE_API_BASE}/search?${params}`);
    if (!resp.ok) return null;
    const data = await resp.json();
    const items = data.items;
    if (!items?.length) return null;
    const monthLower = month.toLowerCase();
    const best = items.find((i: any) => {
      const t = i.snippet?.title?.toLowerCase() || '';
      return t.includes(monthLower) && (t.includes("what's in the sky") || t.includes('night sky') || t.includes('monthly'));
    }) || items[0];
    const videoId = best.id?.videoId;
    if (!videoId) return null;
    // Get full description
    const dResp = await fetch(`${YOUTUBE_API_BASE}/videos?${new URLSearchParams({ part: 'snippet', id: videoId, key: apiKey })}`);
    if (dResp.ok) {
      const dd = await dResp.json();
      const v = dd.items?.[0];
      if (v) return { videoId, title: v.snippet.title, description: v.snippet.description, videoUrl: `https://www.youtube.com/watch?v=${videoId}`, channelTitle: v.snippet.channelTitle };
    }
    return { videoId, title: best.snippet?.title || '', description: best.snippet?.description || '', videoUrl: `https://www.youtube.com/watch?v=${videoId}`, channelTitle: 'High Point Scientific' };
  } catch { return null; }
}

async function fetchYouTubeSkyTel(month: string, year: number): Promise<YouTubeVideoResult | null> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) return null;
  try {
    const params = new URLSearchParams({
      part: 'snippet', playlistId: SKY_TEL_PLAYLIST_ID, maxResults: '10', key: apiKey,
    });
    const resp = await fetch(`${YOUTUBE_API_BASE}/playlistItems?${params}`);
    if (!resp.ok) return null;
    const data = await resp.json();
    const items = data.items;
    if (!items?.length) return null;
    const monthLower = month.toLowerCase();
    const best = items.find((i: any) => {
      const t = i.snippet?.title?.toLowerCase() || '';
      const d = i.snippet?.description?.toLowerCase() || '';
      return (t.includes(monthLower) || d.includes(monthLower)) && (t.includes(year.toString()) || d.includes(year.toString()));
    });
    if (!best) return null;
    const videoId = best.snippet?.resourceId?.videoId;
    if (!videoId) return null;
    const dResp = await fetch(`${YOUTUBE_API_BASE}/videos?${new URLSearchParams({ part: 'snippet', id: videoId, key: apiKey })}`);
    if (dResp.ok) {
      const dd = await dResp.json();
      const v = dd.items?.[0];
      if (v) return { videoId, title: v.snippet.title, description: v.snippet.description, videoUrl: `https://www.youtube.com/watch?v=${videoId}`, channelTitle: v.snippet.channelTitle };
    }
    return { videoId, title: best.snippet?.title || '', description: best.snippet?.description || '', videoUrl: `https://www.youtube.com/watch?v=${videoId}`, channelTitle: 'Sky & Telescope' };
  } catch { return null; }
}

// Auto-populate preview endpoint
app.post('/api/admin/auto-populate-preview', async (req, res) => {
  try {
    const { month, year } = req.body;
    if (!month || !year) {
      return res.status(400).json({ message: 'Month and year are required' });
    }
    const yearNum = parseInt(year);

    // Run all 3 sources in parallel
    const [tltoResult, hpResult, stResult] = await Promise.allSettled([
      Promise.resolve(getSeasonalObjects(month)),
      fetchYouTubeHighPoint(month, yearNum),
      fetchYouTubeSkyTel(month, yearNum),
    ]);

    const sources: any[] = [];
    const videoUrls: string[] = [];

    // TLTO source
    const tltoObjects = tltoResult.status === 'fulfilled' ? tltoResult.value : [];
    sources.push({
      name: 'Turn Left at Orion',
      status: tltoResult.status,
      objects: (tltoObjects as TLTOObject[]).map(o => ({
        name: o.name, type: o.type, description: o.description,
        constellation: o.constellation, magnitude: o.magnitude,
        viewingTips: o.viewingTips, difficulty: o.difficulty,
        sources: ['Turn Left at Orion'], existsInDb: false,
      })),
    });

    // High Point
    const hpVideo = hpResult.status === 'fulfilled' ? hpResult.value : null;
    const hpExtracted = hpVideo ? extractCelestialObjects(hpVideo.description, month) : [];
    sources.push({
      name: 'High Point Scientific',
      status: hpResult.status,
      error: hpResult.status === 'rejected' ? String(hpResult.reason) : undefined,
      video: hpVideo,
      objects: hpExtracted.map(o => ({ ...o, sources: ['High Point Scientific'], existsInDb: false })),
    });
    if (hpVideo) videoUrls.push(hpVideo.videoUrl);

    // Sky & Telescope
    const stVideo = stResult.status === 'fulfilled' ? stResult.value : null;
    const stExtracted = stVideo ? extractCelestialObjects(stVideo.description, month) : [];
    sources.push({
      name: 'Sky & Telescope',
      status: stResult.status,
      error: stResult.status === 'rejected' ? String(stResult.reason) : undefined,
      video: stVideo,
      objects: stExtracted.map(o => ({ ...o, sources: ['Sky & Telescope'], existsInDb: false })),
    });
    if (stVideo) videoUrls.push(stVideo.videoUrl);

    // Merge and deduplicate
    const objectMap = new Map<string, any>();
    for (const source of sources) {
      for (const obj of source.objects) {
        const key = obj.name.toLowerCase();
        const existing = objectMap.get(key);
        if (existing) {
          for (const s of obj.sources) {
            if (!existing.sources.includes(s)) existing.sources.push(s);
          }
          if (obj.viewingTips && !existing.viewingTips) existing.viewingTips = obj.viewingTips;
          if (obj.difficulty && !existing.difficulty) existing.difficulty = obj.difficulty;
          if (obj.description.length > existing.description.length) existing.description = obj.description;
          if (obj.constellation && !existing.constellation) existing.constellation = obj.constellation;
          if (obj.magnitude && !existing.magnitude) existing.magnitude = obj.magnitude;
        } else {
          objectMap.set(key, { ...obj });
        }
      }
    }

    const mergedObjects = Array.from(objectMap.values());

    // Check DB existence
    const existingObjects = await getDb().select().from(celestialObjects);
    const existingMap = new Map(existingObjects.map(o => [o.name.toLowerCase(), o]));
    for (const obj of mergedObjects) {
      const dbObj = existingMap.get(obj.name.toLowerCase());
      if (dbObj) {
        obj.existsInDb = true;
        obj.dbId = dbObj.id;
      }
    }

    res.json({
      month, year: yearNum, sources, mergedObjects, videoUrls,
      suggestedHeadline: `${month} ${yearNum}: What to See in the Night Sky`,
      suggestedDescription: `Your guide to the ${month} ${yearNum} night sky featuring ${mergedObjects.length} celestial objects.${videoUrls.length > 0 ? ' Includes video guides from astronomy experts.' : ''}`,
    });
  } catch (error) {
    res.status(500).json({
      message: `Failed to generate preview: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
  }
});

// Auto-populate confirm endpoint
app.post('/api/admin/auto-populate-confirm', async (req, res) => {
  try {
    const { month, year, hemisphere, headline, description, videoUrls, sources, objects } = req.body;
    if (!month || !year || !headline || !description || !objects) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    const yearNum = parseInt(year);

    // Find or create guide
    const existingGuides = await getDb().select().from(monthlyGuides);
    let guide = existingGuides.find(g =>
      g.month === month && g.year === yearNum && g.hemisphere === (hemisphere || 'Northern')
    );

    if (guide) {
      const [updated] = await getDb().update(monthlyGuides).set({
        headline, description, videoUrls: videoUrls || [], sources: sources || [],
      }).where(eq(monthlyGuides.id, guide.id)).returning();
      guide = updated;
      // Clear existing guide objects
      await getDb().delete(guideObjects).where(eq(guideObjects.guideId, guide.id));
    } else {
      const [created] = await getDb().insert(monthlyGuides).values({
        month, year: yearNum, hemisphere: hemisphere || 'Northern',
        headline, description, videoUrls: videoUrls || [], sources: sources || [],
      }).returning();
      guide = created;
    }

    let objectsAdded = 0;
    let objectsLinked = 0;
    const allExisting = await getDb().select().from(celestialObjects);
    const nameMap = new Map(allExisting.map(o => [o.name.toLowerCase(), o]));

    for (let i = 0; i < objects.length; i++) {
      const obj = objects[i];
      try {
        let dbObj = nameMap.get(obj.name.toLowerCase());

        if (!dbObj) {
          let imageUrl = 'https://images.unsplash.com/photo-1446776877081-d282a0f896e2?auto=format&fit=crop&w=800&h=500';
          try {
            const imgResult = await searchCelestialObjectImage(obj.name);
            if (imgResult.success && imgResult.image_url) imageUrl = imgResult.image_url;
          } catch { /* use fallback */ }

          const [created] = await getDb().insert(celestialObjects).values({
            name: obj.name, type: obj.type, description: obj.description,
            imageUrl, constellation: obj.constellation || null, magnitude: obj.magnitude || null,
          }).returning();
          dbObj = created;
          nameMap.set(obj.name.toLowerCase(), dbObj);
          objectsAdded++;
          await new Promise(resolve => setTimeout(resolve, 300));
        }

        await getDb().insert(guideObjects).values({
          guideId: guide.id, objectId: dbObj.id,
          viewingTips: obj.viewingTips || null, highlights: obj.highlights || null,
          sortOrder: i,
        });
        objectsLinked++;
      } catch (err) {
        console.log(`Skipped ${obj.name}: ${err}`);
      }
    }

    res.json({
      success: true,
      message: `Guide created for ${month} ${yearNum} with ${objectsLinked} objects (${objectsAdded} new)`,
      guideId: guide.id, objectsAdded, objectsLinked,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: `Failed to confirm: ${error instanceof Error ? error.message : 'Unknown error'}`,
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

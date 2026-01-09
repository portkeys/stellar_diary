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

// Get all celestial objects
app.get('/api/celestial-objects', async (_req, res) => {
  try {
    const objects = await getDb().select().from(celestialObjects);
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

// Helper to get today's date in YYYY-MM-DD format
function getTodayDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Helper to fetch APOD from NASA API
async function fetchApodFromNasa(date: string): Promise<{
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
  const params = new URLSearchParams({
    api_key: apiKey,
    date: date
  });

  const response = await fetch(`https://api.nasa.gov/planetary/apod?${params.toString()}`, {
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

// Get APOD (cached with auto-refresh)
app.get('/api/apod', async (_req, res) => {
  try {
    const today = getTodayDate();

    // Check if we have today's APOD cached
    const [cachedApod] = await getDb()
      .select()
      .from(apodCache)
      .where(eq(apodCache.date, today))
      .limit(1);

    if (cachedApod) {
      // Return cached data for today
      res.json(cachedApod);
      return;
    }

    // No cache for today - fetch from NASA API
    console.log(`Fetching fresh APOD for ${today}`);
    const nasaData = await fetchApodFromNasa(today);

    // Store in cache
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

    // Return fresh data
    res.json(nasaData);
  } catch (error) {
    console.error('APOD fetch error:', error);

    // If NASA API fails, try to return the most recent cached APOD as fallback
    try {
      const [fallbackApod] = await getDb()
        .select()
        .from(apodCache)
        .orderBy(desc(apodCache.id))
        .limit(1);

      if (fallbackApod) {
        res.json({ ...fallbackApod, _fallback: true });
        return;
      }
    } catch (fallbackError) {
      // Ignore fallback errors
    }

    res.status(500).json({
      error: 'Failed to fetch APOD',
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

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

// Get APOD (cached)
app.get('/api/apod', async (_req, res) => {
  try {
    const [cachedApod] = await getDb()
      .select()
      .from(apodCache)
      .orderBy(desc(apodCache.id))
      .limit(1);

    if (cachedApod) {
      res.json(cachedApod);
    } else {
      res.status(404).json({ error: 'No APOD cached' });
    }
  } catch (error) {
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

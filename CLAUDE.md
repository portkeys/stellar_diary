# StellarDiary - Project Context

> **Last Updated:** 2026-08-28
> **Status:** Active development - Deployed on Vercel at stellardiary.org

## Overview

StellarDiary is an astronomy companion web app for telescope enthusiasts (specifically Apertura AD8 Dobsonian users). It serves as a personal observational journal and sky-watching guide with NASA data integration.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, Shadcn/ui |
| Backend | Node.js, Express.js, TypeScript |
| Database | PostgreSQL (Neon serverless), Drizzle ORM |
| State | TanStack React Query |
| Routing | Wouter |
| Forms | React Hook Form + Zod |
| Deployment | Vercel (serverless) |

## Project Structure

```
StellarDiary/
├── api/                 # Vercel serverless API routes
│   ├── apod.ts          # APOD endpoint
│   ├── celestial-objects/
│   ├── observations/
│   ├── monthly-guide/
│   └── admin/           # Admin endpoints
├── client/src/
│   ├── pages/           # Route pages (Home, MonthlyGuide, MyObservations, Learn, Admin)
│   ├── components/
│   │   ├── ui/          # Shadcn/ui components (50+)
│   │   └── astronomy/   # Domain components (ApodSection, CelestialCard, ObservationList)
│   ├── hooks/           # Custom hooks (use-mobile, use-toast)
│   └── lib/             # Utilities (queryClient, utils)
├── server/
│   ├── index.ts         # Express app entry (local dev)
│   ├── routes.ts        # Express routes (local dev)
│   ├── storage.ts       # Database interface (IStorage pattern)
│   ├── db.ts            # Drizzle + Neon setup
│   └── services/        # Business logic (nasaApi, celestialObjects, nasaImagesNode)
├── shared/
│   └── schema.ts        # Drizzle tables + Zod schemas (single source of truth)
├── scripts/
│   └── seed.ts          # One-time database seeding
└── vercel.json          # Vercel deployment config
```

## Key Features

1. **NASA APOD Integration** - Daily astronomy picture with caching
2. **Celestial Object Database** - Planets, galaxies, nebulae, clusters (7 types)
3. **Observation Tracking** - Personal observation journal with CRUD
4. **Monthly Sky Guides** - Curated viewing guides by hemisphere
5. **Educational Content** - Collimation guide
6. **Image Fallback System** - NASA Images → Wikipedia → defaults

## API Endpoints

| Endpoint | Purpose |
|----------|---------|
| `GET /api/apod` | NASA Astronomy Picture of the Day |
| `GET/POST /api/celestial-objects` | Celestial object CRUD |
| `GET/POST/PATCH/DELETE /api/observations` | User observations |
| `GET/PATCH /api/monthly-guide` | Monthly sky guides |
| `GET/POST/PATCH/DELETE /api/sky-events` | Anticipated events watchlist (e.g. T CrB nova) |
| `POST /api/sky-events/:id/check` | Run AAVSO brightness + news check for one event now |
| `GET /api/cron/monthly-guide` | Vercel cron (1st of month, 14:00 UTC): auto-create current month's guide |
| `GET /api/cron/check-sky-events` | Vercel cron (daily, 15:00 UTC): check all sky events |
| `POST /api/admin/*` | Admin operations |

## Database Schema (shared/schema.ts)

- `celestialObjects` - Astronomical objects with coordinates, magnitude, images
- `observations` - User observation records (incl. optional `videoUrl` for the user's own footage)
- `monthlyGuides` - Curated monthly viewing guides
- `apodCache` - NASA APOD response cache
- `skyEvents` - Anticipated events watchlist (AAVSO star name, trigger magnitude, news query, status)
- `users` - User accounts (Passport.js ready)

## Commands

```bash
npm run dev          # Start local dev server (port 5000)
npm run build        # Build for production (Express)
npm run build:vercel # Build for Vercel deployment
npm start            # Run production build locally
npm run db:push      # Apply schema changes
npm run db:seed      # Seed database (run once after deploy)
npm run check        # TypeScript validation
vercel dev           # Test Vercel functions locally
```

## Environment Variables

```
DATABASE_URL=      # Neon PostgreSQL connection string
NASA_API_KEY=      # NASA API key (optional, has DEMO_KEY fallback)
YOUTUBE_API_KEY=   # YouTube Data API v3 key (optional, for auto-populate monthly guides)
CRON_SECRET=       # Optional; if set on Vercel, cron endpoints require Authorization: Bearer <secret>
NODE_ENV=          # production | development
```

## Patterns & Conventions

- **Components:** PascalCase (`ApodSection.tsx`)
- **Utilities:** camelCase (`queryClient.ts`)
- **API paths:** kebab-case (`/api/celestial-objects`)
- **DB columns:** snake_case in SQL, camelCase in TypeScript
- **Validation:** Zod at API boundaries
- **State:** TanStack Query for server state, local state for UI

## Recent Changes

<!-- Update this section after each significant PR -->
- **2026-08-28:** Removed the telescope-tips feature (orphaned since the Learn page was replaced by My Progress): component, Express route, storage methods, seed data, and the `telescope_tips` table
- **2026-08-28:** My Progress gained an Eclipses Seen tracker (lunar + solar) under the planet grid; counts sightings rather than a one-time check, since eclipses recur
- **2026-08-28:** Observations can carry a personal video link (`observations.video_url`); YouTube watch/shorts/youtu.be URLs render as an inline embed on My Observations, other URLs as a link
- **2026-07-02:** Sky events watchlist: `sky_events` table, daily AAVSO brightness check (T CrB nova) + Google News headline pull, app-wide alert banner when triggered
- **2026-07-02:** Monthly guide now auto-creates via Vercel cron on the 1st (skips if guide exists; `?force=true` regenerates)
- **2026-07-02:** My Progress planet tracker shows real NASA planet portraits from DB (grayscale until observed); replaced bad planet images (Mars was the InSight lander) with classic portraits
- **2026-02-04:** Completed Vercel migration with custom domain (stellardiary.org)
- **2026-01-08:** Migrated from Render to Vercel (serverless)
- **2026-01-08:** Replaced Python scripts with Node.js for NASA/Wikipedia image search
- **2026-01-08:** Fixed APOD and sorting order
- **2026-01-07:** Added NASA/Wikipedia image fallback for new objects

## Development Notes

- Image search uses native Node.js fetch for NASA/Wikipedia APIs (no Python)
- Celestial objects support hemisphere-based filtering (Northern/Southern/Both)
- Monthly guides auto-create via cron on the 1st; Admin panel still works for manual curation
- Sky event checks scrape AAVSO WebObs (visual magnitude) and Google News RSS — no API keys needed
- `npm run check` does NOT cover `api/` (tsconfig excludes it) — typecheck with `npx tsc --noEmit --esModuleInterop --skipLibCheck --strict --target es2022 --module esnext --moduleResolution bundler api/index.ts`
- Session auth infrastructure in place but not fully implemented
- Deployed on Vercel with serverless functions in `/api/`
- Database seeding is a one-time operation via `npm run db:seed`

## Common Tasks

### Adding a new celestial object type
1. Update `objectType` enum in `shared/schema.ts`
2. Add default image in `server/services/celestialObjects.ts`
3. Update filter options in `client/src/components/astronomy/`

### Adding a new API endpoint
1. Define Zod schema in `shared/schema.ts`
2. Create Vercel API route in `api/` directory
3. Implement storage method in `server/storage.ts`
4. Create React Query hook in client
5. (Optional) Add Express route in `server/routes.ts` for local dev

### Updating monthly guide
1. Use Admin panel at `/admin`
2. Or run `server/scripts/updateMonthlyGuide.ts`

---

*This file is auto-read by Claude Code at session start. Update after significant changes.*

# Deployment Guide

This document provides step-by-step instructions for deploying the Astronomy Companion App.

## Prerequisites

- GitHub account
- Database provider (recommended: Neon PostgreSQL)
- Vercel account (free tier works)

---

## Vercel Deployment (Recommended)

Vercel provides always-on serverless deployment with no cold start delays.

### Step 1: Prepare Your Repository

1. Push your code to GitHub:
   ```bash
   git add .
   git commit -m "Prepare for Vercel deployment"
   git push origin main
   ```

### Step 2: Set Up Database (Neon)

1. Go to [Neon Console](https://console.neon.tech/)
2. Create a new project
3. Copy the connection string (format: `postgresql://user:pass@ep-xyz.region.aws.neon.tech/dbname?sslmode=require`)

### Step 3: Deploy to Vercel

#### Option A: Vercel Dashboard (Easiest)

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New..."** → **"Project"**
3. Import your GitHub repository
4. Configure the project:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build:vercel`
   - **Output Directory**: `dist/public`
   - **Install Command**: `npm install`

5. Add environment variables:
   | Variable | Value |
   |----------|-------|
   | `DATABASE_URL` | Your Neon connection string |
   | `NASA_API_KEY` | (Optional) Your NASA API key |
   | `NODE_ENV` | `production` |

6. Click **"Deploy"**

#### Option B: Vercel CLI

1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Login to Vercel:
   ```bash
   vercel login
   ```

3. Deploy:
   ```bash
   vercel
   ```

4. Follow the prompts:
   - Link to existing project? **No**
   - Project name: `stellar-diary` (or your choice)
   - Directory: `.` (current directory)

5. Add environment variables:
   ```bash
   vercel env add DATABASE_URL
   # Paste your Neon connection string when prompted

   vercel env add NASA_API_KEY
   # Paste your NASA API key (or skip for DEMO_KEY)
   ```

6. Deploy to production:
   ```bash
   vercel --prod
   ```

### Step 4: Initialize Database

After first deployment, seed the database:

```bash
# Option 1: Run locally with production DATABASE_URL
DATABASE_URL="your-neon-connection-string" npm run db:seed

# Option 2: Push schema first, then seed
DATABASE_URL="your-neon-connection-string" npm run db:push
DATABASE_URL="your-neon-connection-string" npm run db:seed
```

### Step 5: Verify Deployment

1. Visit your Vercel URL: `https://your-project.vercel.app`
2. Test the health endpoint: `https://your-project.vercel.app/api/health`
3. Verify APOD loads on the homepage
4. Test creating an observation

---

## Project Configuration

### vercel.json

The project includes a `vercel.json` configuration:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "framework": "vite",
  "buildCommand": "npm run build:vercel",
  "outputDirectory": "dist/public",
  "rewrites": [
    { "source": "/api/:path*", "destination": "/api" }
  ]
}
```

### API Architecture

The API uses a single Express-based serverless function (`api/index.ts`) that handles all routes:

```
api/
└── index.ts    # Single Express app handling all /api/* routes
```

**Key Implementation Details:**

1. **Express without serverless-http** - Vercel's native handler works directly with Express
2. **Inlined schema definitions** - Vercel compiles `/api` in isolation, so schemas are defined inline
3. **Neon HTTP driver** - Uses `@neondatabase/serverless` with `drizzle-orm/neon-http` for serverless compatibility
4. **Lazy database initialization** - Connection is established on first request

**Supported API Routes:**
- `GET /api/health` - Health check
- `GET /api/celestial-objects` - List all celestial objects
- `GET /api/observations` - List user observations with object details
- `GET /api/apod` - Get cached NASA Astronomy Picture of the Day

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | Neon PostgreSQL connection string |
| `NASA_API_KEY` | No | NASA API key (defaults to DEMO_KEY) |
| `NODE_ENV` | No | Set to `production` (Vercel sets this automatically) |

---

## Local Development

### Using Express Server (Traditional)

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your database URL

# Run database migrations
npm run db:push

# Seed database (first time only)
npm run db:seed

# Start development server
npm run dev
# Server runs at http://localhost:5000
```

### Using Vercel Dev (Serverless)

```bash
# Install Vercel CLI
npm i -g vercel

# Link to Vercel project
vercel link

# Pull environment variables
vercel env pull

# Start local serverless dev
vercel dev
# Server runs at http://localhost:3000
```

---

## Troubleshooting

### Common Issues

**Build Failures**
- Ensure TypeScript compilation passes: `npm run check`
- Check that all dependencies are installed

**Database Connection Issues**
- Verify `DATABASE_URL` is set correctly in Vercel
- Ensure the connection string includes `?sslmode=require`
- Check that Neon project is not paused

**API Routes Not Working**
- Verify `/api` directory exists at project root
- Check Vercel function logs in dashboard
- Ensure `vercel.json` is properly configured

**Cold Starts (Rare on Vercel)**
- Vercel functions are always-on at edge
- If experiencing delays, check database connection (Neon may pause after inactivity)

### Viewing Logs

1. Go to Vercel Dashboard → Your Project → **Deployments**
2. Click on a deployment → **Functions** tab
3. View real-time logs for each API route

---

## Updating Your Deployment

### Automatic Deployments

Vercel automatically deploys when you push to GitHub:

```bash
git add .
git commit -m "Your changes"
git push origin main
# Vercel automatically deploys
```

### Manual Deployment

```bash
vercel --prod
```

### Preview Deployments

Push to a non-main branch for a preview URL:

```bash
git checkout -b feature/new-feature
git push origin feature/new-feature
# Vercel creates a preview deployment
```

---

## Legacy: Render Deployment

> **Note:** The project has been migrated to Vercel for better performance.
> Render deployment is still possible but not recommended due to cold start delays.

If you need to deploy to Render:

1. The Express server (`server/index.ts`) is still functional
2. Use these settings:
   - **Build Command**: `npm ci && npm run build`
   - **Start Command**: `npm start`
3. Add environment variables in Render dashboard

---

## Security Considerations

- Never commit `.env` files to git
- Use strong, unique database passwords
- Rotate database credentials periodically
- Enable Neon's IP allowlist for production

---

## Support

- [Vercel Documentation](https://vercel.com/docs)
- [Neon Documentation](https://neon.tech/docs)
- [Drizzle ORM Documentation](https://orm.drizzle.team/)

# Astronomy Companion App

An advanced astronomy companion app empowering telescope enthusiasts with comprehensive sky observation and exploration tools.

## Features

### 🔭 Telescope & Observation Tools
- **Collimation Guide**: Step-by-step visual guide for telescope collimation with the Apertura AD8 Dobsonian
- **Telescope Tips**: Comprehensive maintenance and usage tips for optimal telescope performance
- **Observation Logging**: Track and manage your celestial observations with notes and dates
- **My Observations**: Personal observation history with detailed records

### 🌌 Celestial Object Database
- **Comprehensive Catalog**: Extensive database of planets, galaxies, nebulae, star clusters, and more
- **Multiple Image Sources**: High-quality images from various astronomical sources
- **Detailed Information**: In-depth descriptions and viewing tips for each object
- **Filtering & Search**: Find objects by type, visibility month, and hemisphere

### 🚀 NASA Integration
- **Astronomy Picture of the Day (APOD)**: Daily featured astronomical images and explanations
- **Real-time Data**: Fresh content updated daily from NASA's official API
- **Cached Performance**: Smart caching system for optimal loading times

### 📚 Learning Resources
- **Monthly Sky Guides**: Detailed guides for what to observe each month
- **Educational Content**: Learn about different types of celestial objects
- **YouTube Integration**: Embedded educational videos and tutorials

## Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for responsive styling
- **Shadcn/ui** component library
- **Wouter** for client-side routing
- **TanStack Query** for data fetching and caching
- **React Hook Form** with Zod validation

### Backend
- **Node.js** with Express
- **TypeScript** for type safety
- **PostgreSQL** database with Drizzle ORM
- **NASA API** integration
- **Python** scripts for advanced data processing

### Key Libraries
- **Drizzle ORM** for database operations
- **Zod** for schema validation
- **Lucide React** for icons
- **Date-fns** for date handling
- **Framer Motion** for animations

## Getting Started

### Prerequisites
- Node.js 20+
- PostgreSQL database
- Python 3.11+ (for NASA API scripts)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/astronomy-companion-app.git
cd astronomy-companion-app
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env .env
# Edit .env with your database connection string
```

4. Set up the database:
```bash
npm run db:push
```

5. Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:5000`

## Deployment

This project is ready for deployment on various platforms:

### Quick Deploy to Render
[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy)

### Manual Deployment
See detailed deployment guides:
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Complete deployment guide for Render, Railway, and other platforms
- [GITHUB_SETUP.md](./GITHUB_SETUP.md) - Setting up the project on GitHub and local development

### Environment Variables Required for Production
- `DATABASE_URL` - PostgreSQL connection string
- `NODE_ENV` - Set to "production"
- `PORT` - Automatically set by most platforms (defaults to 5000)

## Database Schema

The app uses PostgreSQL with the following main tables:
- `users` - User accounts and authentication
- `celestial_objects` - Comprehensive celestial object catalog
- `observations` - User observation logs
- `monthly_guides` - Monthly sky observation guides
- `telescope_tips` - Maintenance and usage tips
- `apod_cache` - Cached NASA APOD data

## API Endpoints

### Celestial Objects
- `GET /api/celestial-objects` - Get all celestial objects
- `GET /api/celestial-objects/:id` - Get specific object
- `POST /api/celestial-objects` - Create new object
- `GET /api/celestial-object-types` - Get available object types

### Observations
- `GET /api/observations` - Get user observations
- `POST /api/observations` - Create new observation
- `PATCH /api/observations/:id` - Update observation
- `DELETE /api/observations/:id` - Delete observation

### NASA Integration
- `GET /api/apod` - Get Astronomy Picture of the Day
- `GET /api/apod?date=YYYY-MM-DD` - Get APOD for specific date

### Guides & Tips
- `GET /api/monthly-guide` - Get current month's guide
- `GET /api/telescope-tips` - Get all telescope tips

## Project Structure

```
astronomy-app/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Application pages
│   │   ├── lib/            # Utility functions
│   │   ├── hooks/          # Custom React hooks
│   │   └── types/          # TypeScript declarations
├── server/                 # Backend Express application
│   ├── services/           # Business logic and external APIs
│   ├── scripts/            # Database utilities
│   └── routes.ts           # API route definitions
├── shared/                 # Shared types and schemas
│   └── schema.ts           # Database schema definitions
└── package.json
```

## Key Features Implementation

### Image Handling
The app includes TypeScript declarations for image imports:
```typescript
// client/src/types/images.d.ts
declare module "*.png" {
  const src: string;
  export default src;
}
```

### Database Operations
All database operations go through a storage interface for consistency:
```typescript
// server/storage.ts
export interface IStorage {
  getCelestialObject(id: number): Promise<CelestialObject | undefined>;
  createObservation(observation: InsertObservation): Promise<Observation>;
  // ... other methods
}
```

### Type Safety
The entire application is built with TypeScript, sharing types between frontend and backend:
```typescript
// shared/schema.ts
export type CelestialObject = typeof celestialObjects.$inferSelect;
export type InsertObservation = z.infer<typeof insertObservationSchema>;
```

## Development

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run db:push` - Push schema changes to database
- `npm run db:studio` - Open Drizzle Studio for database management

### Environment Setup
The app is configured to run on Replit with automatic workflows and port management. For local development, ensure PostgreSQL is running and properly configured.

## Contributing

This project follows modern React and Node.js best practices:
- TypeScript for type safety
- ESLint and Prettier for code quality
- Modular component architecture
- RESTful API design
- Responsive design principles

## License

This project is open source and available under the MIT License.
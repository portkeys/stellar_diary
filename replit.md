# replit.md

## Overview

This is a comprehensive astronomy companion application called "StellarDiary" built for telescope enthusiasts, specifically those using the Apertura AD8 Dobsonian telescope. The application combines educational content, observation tracking, NASA integration, and monthly sky guides to provide a complete astronomy experience.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety
- **Build Tool**: Vite for fast development and optimized production builds
- **Styling**: Tailwind CSS with custom space-themed color palette
- **UI Components**: Shadcn/ui component library built on Radix UI primitives
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Form Handling**: React Hook Form with Zod schema validation

### Backend Architecture
- **Runtime**: Node.js with Express framework
- **Language**: TypeScript throughout the entire stack
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Database Provider**: Neon serverless PostgreSQL
- **External APIs**: NASA APOD (Astronomy Picture of the Day) API integration
- **Content Processing**: Cheerio for web scraping and content extraction

## Key Components

### Database Schema
- **Users**: Basic user authentication system
- **Celestial Objects**: Comprehensive catalog of astronomical objects with detailed metadata
- **Observations**: User's personal observation tracking and notes
- **Monthly Guides**: Administrative content for monthly sky guides
- **Telescope Tips**: Educational content for telescope maintenance and usage
- **APOD Cache**: Cached NASA Astronomy Picture of the Day data

### Main Features
1. **Telescope Tools**: Collimation guides and maintenance tips specifically for Apertura AD8
2. **Celestial Object Database**: Searchable catalog with filtering by type, month, and hemisphere
3. **Observation Tracking**: Personal observation list with notes and completion status
4. **Monthly Sky Guides**: Admin-managed content for what to observe each month
5. **NASA APOD Integration**: Daily astronomy pictures with caching system
6. **Educational Resources**: Learning materials and telescope usage guides

### Administrative System
- Monthly guide automation with URL import capability
- Content extraction from High Point Scientific articles
- Manual content entry for monthly guides
- Celestial object management with duplicate cleanup
- **NASA Image Update System**: Automatic replacement of inaccurate images with authentic NASA images from their Image and Video Library API

## Data Flow

1. **Content Ingestion**: Admin interface allows importing astronomical content via URL or manual entry
2. **Data Processing**: Python scripts process NASA APOD data and cache it locally
3. **User Interaction**: Users browse celestial objects, add them to observation lists, and track their progress
4. **Real-time Updates**: TanStack Query manages data fetching, caching, and automatic background updates

## External Dependencies

### APIs and Services
- **NASA APOD API**: Daily astronomy pictures and descriptions
- **NASA Image and Video Library API**: Authentic celestial object images for database updates
- **High Point Scientific**: Content source for monthly guides (via web scraping)

### Key Libraries
- **Database**: Drizzle ORM, Neon serverless PostgreSQL
- **UI**: Radix UI primitives, Tailwind CSS, Lucide React icons
- **Data Fetching**: TanStack Query, Axios
- **Content Processing**: Cheerio for HTML parsing
- **Validation**: Zod for schema validation
- **Forms**: React Hook Form with resolver integration

## Deployment Strategy

### Development
- Vite dev server with HMR for frontend development
- tsx for running TypeScript server directly
- Database migrations managed through Drizzle Kit

### Production
- Frontend built with Vite and served as static files
- Backend bundled with esbuild for Node.js deployment
- Environment-based configuration for database connections
- Replit-specific optimizations and error handling

### Database Management
- Schema-first approach with Drizzle ORM
- Automatic migration generation and deployment
- Connection pooling for serverless environments

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

- **July 21, 2025**: Prepared codebase for GitHub and production deployment
  - Added health check endpoint at `/api/health` for deployment monitoring
  - Created comprehensive deployment configuration with render.yaml
  - Updated server configuration to use environment PORT variable
  - Added .env.example template for environment variables
  - Created detailed deployment guide (DEPLOYMENT.md) for Render and other platforms
  - Added GitHub setup guide (GITHUB_SETUP.md) for local development workflow
  - Updated README with deployment sections and quick deploy button
  - Configured production-ready build and start scripts

- **July 03, 2025**: Enhanced Add Entry functionality with comprehensive search and autocomplete
  - Implemented smart object search with autocomplete dropdown
  - Added duplicate prevention system - filters out objects already in observation list
  - Created seamless toggle between search mode and manual entry mode
  - Added type-specific fallback images for all celestial object categories
  - Fixed image display issues across all components (CelestialCard, ObservationList, MyObservations)
  - Integrated NASA Image and Video Library API for authentic astronomical imagery
  - Added delete functionality for observation records

## Changelog

Changelog:
- July 01, 2025. Initial setup
- July 03, 2025. Search functionality and image system improvements
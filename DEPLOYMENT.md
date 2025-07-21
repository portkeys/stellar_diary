# Deployment Guide

This document provides step-by-step instructions for deploying the Astronomy Companion App to various platforms.

## Prerequisites

- GitHub account
- Database provider (recommended: Neon, Railway, or Render PostgreSQL)
- Render account (for deployment)

## 1. GitHub Setup

### Initial Repository Setup
1. Create a new repository on GitHub
2. Clone this project to your local machine
3. Initialize git and push to GitHub:

```bash
git init
git add .
git commit -m "Initial commit: Astronomy Companion App"
git branch -M main
git remote add origin https://github.com/yourusername/your-repo-name.git
git push -u origin main
```

## 2. Database Setup

### Option A: Neon (Recommended)
1. Go to [Neon Console](https://console.neon.tech/)
2. Create a new project
3. Copy the connection string
4. The format will be: `postgresql://username:password@ep-xyz.region.aws.neon.tech/dbname?sslmode=require`

### Option B: Railway
1. Go to [Railway](https://railway.app/)
2. Create a new PostgreSQL database
3. Copy the connection string from the Variables tab

### Option C: Render PostgreSQL
1. In your Render dashboard, create a new PostgreSQL database
2. Note the connection details

## 3. Render Deployment

### Automatic Deployment (Recommended)
1. Fork/clone this repository to your GitHub account
2. Go to [Render Dashboard](https://dashboard.render.com/)
3. Click "New" → "Web Service"
4. Connect your GitHub repository
5. Use these settings:
   - **Name**: `astronomy-app` (or your preferred name)
   - **Environment**: `Node`
   - **Region**: Choose closest to your users
   - **Branch**: `main`
   - **Build Command**: `npm ci && npm run build`
   - **Start Command**: `npm start`

### Environment Variables
In Render, add these environment variables:
- `NODE_ENV`: `production`
- `DATABASE_URL`: Your PostgreSQL connection string
- `PORT`: `10000` (Render's default, will be set automatically)

### Manual Deployment with render.yaml
1. The project includes a `render.yaml` file for Infrastructure as Code
2. In Render, go to "New" → "Blueprint"
3. Connect your repository and Render will automatically detect the `render.yaml`

## 4. Database Migration

After deployment, run the database setup:

### Using Render Shell
1. Go to your deployed service in Render
2. Open the "Shell" tab
3. Run: `npm run db:push`

### Local Database Push (Alternative)
1. Set your production DATABASE_URL in a local `.env` file
2. Run: `npm run db:push`
3. Remove the production DATABASE_URL from your local `.env`

## 5. Post-Deployment Setup

### Health Check
Your app includes a health check endpoint at `/api/health`. Render will automatically use this to monitor your app.

### Domain Configuration
- Your app will be available at: `https://your-app-name.onrender.com`
- You can configure a custom domain in Render's settings

### Monitoring
- Use Render's built-in metrics and logs
- Monitor database performance through your database provider's dashboard

## 6. Environment-Specific Configurations

### Development
```bash
# Install dependencies
npm install

# Set up environment
cp .env .env
# Edit .env with your local database URL

# Run database migrations
npm run db:push

# Start development server
npm run dev
```

### Production
The production build process:
1. `npm ci` - Clean install of dependencies
2. `npm run build` - Builds both frontend and backend
3. `npm start` - Starts the production server

## 7. Troubleshooting

### Common Issues

**Build Failures**
- Ensure all dependencies are in `package.json`, not just `devDependencies`
- Check that TypeScript compilation passes: `npm run check`

**Database Connection Issues**
- Verify DATABASE_URL format and credentials
- Ensure database accepts connections from Render's IP ranges
- Check SSL requirements (most cloud databases require `?sslmode=require`)

**Port Issues**
- Don't hardcode ports; use `process.env.PORT || 5000`
- Render automatically sets PORT to 10000

**Static File Serving**
- Frontend build files are served from `/dist` by the Express server
- Ensure build process completes successfully

### Logs and Debugging
- Use Render's log viewer to debug deployment issues
- Add console.log statements for debugging (they'll appear in Render logs)
- Use `npm run check` locally to catch TypeScript errors before deployment

## 8. Security Considerations

### Environment Variables
- Never commit `.env` files to git
- Use strong, unique passwords for databases
- Consider setting a SESSION_SECRET for production

### Database Security
- Use connection string with SSL enabled
- Regularly rotate database passwords
- Monitor database access logs

## 9. Performance Optimization

### Frontend
- Static files are served with caching headers
- Vite optimizes bundle size automatically

### Backend
- Uses connection pooling for database
- Implements proper error handling
- Includes health checks for monitoring

### Database
- Indexes are defined in Drizzle schema
- Connection pooling configured for serverless deployment
- Consider read replicas for high-traffic applications

## 10. Backup and Maintenance

### Database Backups
- Configure automated backups through your database provider
- Test backup restoration process periodically

### Updates and Maintenance
- Monitor for security updates in dependencies
- Update regularly: `npm audit` and `npm update`
- Test updates in development before deploying to production

---

For additional support or questions, refer to:
- [Render Documentation](https://render.com/docs)
- [Neon Documentation](https://neon.tech/docs)
- [Drizzle ORM Documentation](https://orm.drizzle.team/)
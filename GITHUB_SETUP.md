# GitHub Repository Setup

This guide helps you prepare your project for GitHub and deployment from your local machine.

## 1. Download Project from Replit

### Option A: Direct Download
1. In Replit, click the three dots menu (⋯) in the Files panel
2. Click "Download as zip"
3. Extract the zip file to your local development folder

### Option B: Git Clone (if available)
```bash
# If you have git initialized in Replit
git clone https://github.com/yourusername/your-replit-repo.git
cd your-replit-repo
```

## 2. Local Setup

### Prerequisites
- Node.js 20+ installed
- Git installed
- Code editor (VS Code recommended)
- PostgreSQL database (see DEPLOYMENT.md for options)

### Initial Local Setup
```bash
# Navigate to your project directory
cd astronomy-app

# Install dependencies
npm install

# Copy environment template
cp .env .env

# Edit .env with your database URL
# DATABASE_URL=postgresql://username:password@host:port/database_name

# Push database schema
npm run db:push

# Test the application locally
npm run dev
```

## 3. Create GitHub Repository

### GitHub Web Interface
1. Go to [GitHub](https://github.com)
2. Click "New repository"
3. Repository settings:
   - **Name**: `astronomy-companion-app` (or your preferred name)
   - **Description**: "Advanced astronomy companion app for telescope enthusiasts"
   - **Visibility**: Public or Private (your choice)
   - **Initialize**: Don't initialize with README, .gitignore, or license (we have these)

### Connect Local Repository to GitHub
```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Make initial commit
git commit -m "Initial commit: Astronomy Companion App from Replit"

# Add GitHub remote
git remote add origin https://github.com/yourusername/your-repo-name.git

# Push to GitHub
git branch -M main
git push -u origin main
```

## 4. Verify Repository Structure

Your GitHub repository should contain:

```
astronomy-companion-app/
├── .env.example                 # Environment template
├── .gitignore                  # Git ignore rules
├── DEPLOYMENT.md               # Deployment instructions
├── README.md                   # Project documentation
├── render.yaml                 # Render deployment config
├── package.json                # Dependencies and scripts
├── tsconfig.json              # TypeScript configuration
├── tailwind.config.ts         # Tailwind CSS config
├── vite.config.ts             # Vite configuration
├── components.json            # Shadcn UI config
├── postcss.config.js          # PostCSS configuration
├── drizzle.config.ts          # Database ORM config
├── client/                    # Frontend React app
│   ├── src/
│   ├── public/
│   └── index.html
├── server/                    # Backend Express app
│   ├── services/
│   ├── scripts/
│   └── [other server files]
└── shared/                    # Shared types and schemas
    └── schema.ts
```

## 5. Repository Settings

### Branch Protection (Recommended)
1. Go to Settings → Branches
2. Add rule for `main` branch:
   - Require pull request reviews
   - Require status checks to pass
   - Restrict pushes to matching branches

### Secrets for CI/CD (Optional)
If you plan to set up automated deployments:
1. Go to Settings → Secrets and variables → Actions
2. Add repository secrets:
   - `DATABASE_URL`: Your database connection string
   - `RENDER_API_KEY`: If using Render auto-deploy

## 6. Development Workflow

### Making Changes
```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make your changes
# ... edit files ...

# Stage and commit changes
git add .
git commit -m "Add: your feature description"

# Push to GitHub
git push origin feature/your-feature-name

# Create pull request on GitHub
# Merge when ready
```

### Keeping Dependencies Updated
```bash
# Check for outdated packages
npm outdated

# Update packages
npm update

# Audit for vulnerabilities
npm audit
npm audit fix
```

## 7. Collaboration Setup

### For Team Development
1. Add collaborators in GitHub Settings → Manage access
2. Set up consistent development environment:
   - Document Node.js version in README
   - Use `.nvmrc` file for Node version management
   - Ensure consistent package-lock.json

### Code Quality Tools
Consider adding:
- ESLint configuration
- Prettier for code formatting
- Husky for git hooks
- GitHub Actions for CI/CD

## 8. Next Steps

1. ✅ **Local Development**: Ensure app runs locally with `npm run dev`
2. ✅ **Database Setup**: Configure your PostgreSQL database
3. ✅ **GitHub Repository**: Push code to GitHub
4. 📋 **Deploy to Render**: Follow DEPLOYMENT.md
5. 📋 **Custom Domain**: Configure domain if needed
6. 📋 **Monitoring**: Set up logging and monitoring

## 9. Common Issues and Solutions

### Git Issues
```bash
# If you get "remote origin already exists"
git remote remove origin
git remote add origin https://github.com/yourusername/your-repo-name.git

# If you need to force push (be careful!)
git push -u origin main --force
```

### Node.js Version Issues
```bash
# Check Node.js version
node --version

# Use Node Version Manager (nvm) to switch versions
nvm install 20
nvm use 20
```

### Database Connection Issues
- Ensure your DATABASE_URL is correctly formatted
- Check firewall rules for your database provider
- Verify SSL requirements (`?sslmode=require` for most cloud databases)

---

After completing this setup, you'll have a professional development workflow with version control, and you'll be ready to deploy your application to production platforms like Render.
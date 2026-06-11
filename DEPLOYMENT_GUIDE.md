# CRM PANEL - COMPLETE DEPLOYMENT & SETUP GUIDE

## 📋 TABLE OF CONTENTS
1. [Prerequisites](#prerequisites)
2. [Local Setup](#local-setup)
3. [Development](#development)
4. [Testing](#testing)
5. [Production Build](#production-build)
6. [Deployment](#deployment)
7. [Environment Variables](#environment-variables)
8. [Troubleshooting](#troubleshooting)
9. [Monitoring](#monitoring)
10. [Rollback](#rollback)

---

## Prerequisites

### Required Software
- Node.js v16+ (`npm --version`)
- npm v8+ (`npm --version`)
- Git (`git --version`)
- Code Editor (VS Code recommended)

### Optional
- Docker & Docker Compose
- PM2 for process management
- Nginx for reverse proxy
- SSL Certificate (Let's Encrypt)

### Verification
```bash
node --version     # Should be v16+
npm --version      # Should be v8+
git --version      # Should be latest
```

---

## LOCAL SETUP

### Step 1: Clone Repository
```bash
git clone https://github.com/company/crm-panel.git
cd Panel_WebFrontEnd
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Environment Setup
```bash
cp .env.example .env.local
```

### Step 4: Configure .env.local
```
VITE_API_BASE_URL=http://localhost:5000/api
VITE_APP_NAME=Sales CRM Panel
VITE_APP_VERSION=1.0.0
VITE_ENVIRONMENT=development
VITE_LOG_LEVEL=debug
```

### Step 5: Start Development Server
```bash
npm run dev
```

Access at: `http://localhost:5173`

### Step 6: Verify Installation
- [ ] App loads without errors
- [ ] Can navigate between pages
- [ ] Sidebar loads correctly
- [ ] Theme switcher works
- [ ] No console errors

---

## DEVELOPMENT

### Available Scripts

```bash
# Start development server with HMR
npm run dev

# Build for production
npm run build

# Preview production build locally
npm run preview

# Run ESLint
npm run lint

# Run tests
npm test

# Run tests with coverage
npm test -- --coverage

# Format code with Prettier
npm run format

# Watch mode for tests
npm test -- --watch
```

### Project Structure
```
src/
├── api/              # API endpoints
│   ├── auth.js
│   ├── axiosInstance.js
│   ├── dashboard.js
│   ├── lead.js
│   └── profile.js
├── components/       # Reusable components
│   ├── DashboardLayout.jsx
│   ├── Header.jsx
│   └── RichTextEditor.jsx
├── context/         # Context providers
│   ├── AuthContext.jsx
│   ├── FontContext.jsx
│   └── ThemeContext.jsx
├── pages/           # Page components
│   ├── AssignedLeads.jsx
│   ├── Dashboard.jsx
│   ├── LeadDetails.jsx
│   ├── SaleConfirm.jsx
│   ├── DeliveryManagement.jsx
│   └── ...
├── route/           # Route configuration
│   └── SidebarRaoute.jsx
├── App.jsx          # Main app component
├── main.jsx         # Entry point
├── index.css        # Global styles
└── App.css          # App styles
```

### Code Standards

**Naming Conventions:**
- Files: camelCase (e.g., `leadDetails.jsx`)
- Components: PascalCase (e.g., `LeadDetails`)
- Variables: camelCase (e.g., `leadData`)
- Constants: UPPER_SNAKE_CASE (e.g., `MAX_LEADS`)

**Code Style:**
```javascript
// ✅ DO
const handleSubmit = async (e) => {
  e.preventDefault();
  try {
    const result = await leadAPI.updateLead(id, data);
    toast.success("Success!");
  } catch (error) {
    toast.error(error.message);
  }
};

// ❌ DON'T
const handleSubmit = (e) => {
  e.preventDefault()
  leadAPI.updateLead(id, data).then(r => {
    alert("Done")
  }).catch(e => alert("Error"))
}
```

### Git Workflow

```bash
# Create feature branch
git checkout -b feature/new-feature

# Make changes and commit
git add .
git commit -m "feat: add new feature"

# Push to remote
git push origin feature/new-feature

# Create Pull Request on GitHub
# After review, merge to main

# Update local main
git checkout main
git pull origin main
```

### Commit Message Format
```
feat: add new feature
fix: fix bug in component
docs: update documentation
style: format code
refactor: refactor component
test: add tests
chore: update dependencies
```

---

## TESTING

### Unit Tests
```bash
npm test -- LeadDetails.test.js
npm test -- SaleConfirm.test.js
npm test -- api.test.js
```

### Integration Tests
```bash
npm test -- integration/
```

### E2E Tests (if using Cypress)
```bash
npm run cypress:open
npm run cypress:run
```

### Test Coverage
```bash
npm test -- --coverage
```

Expected Coverage:
- Statements: > 80%
- Branches: > 75%
- Functions: > 80%
- Lines: > 80%

---

## PRODUCTION BUILD

### Step 1: Build the App
```bash
npm run build
```

Output: `dist/` folder

### Step 2: Preview Build Locally
```bash
npm run preview
```

### Step 3: Verify Build
```bash
# Check dist folder size
du -sh dist/

# Check for broken imports
npm run lint

# Run tests one final time
npm test
```

### Step 4: Create Build Report
```bash
npm run build -- --report
```

---

## DEPLOYMENT

### Option 1: Vercel (Recommended for Frontend)

1. **Connect Repository**
   ```bash
   npm i -g vercel
   vercel login
   ```

2. **Deploy**
   ```bash
   vercel
   ```

3. **Configure Environment**
   - Go to Vercel Dashboard
   - Project Settings → Environment Variables
   - Add all `.env` variables

4. **Automatic Deployments**
   - Every push to main → auto deploy
   - Pull requests → preview deployments

### Option 2: Netlify

1. **Connect Repository**
   ```bash
   npm i -g netlify-cli
   netlify login
   ```

2. **Deploy**
   ```bash
   netlify deploy --prod --dir=dist
   ```

3. **Configure**
   - netlify.toml file (already included)
   - Environment variables in dashboard

### Option 3: Docker

1. **Create Dockerfile** (already in repo)
   ```dockerfile
   FROM node:16-alpine
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci --only=production
   COPY dist ./dist
   EXPOSE 3000
   CMD ["npm", "run", "preview"]
   ```

2. **Build Image**
   ```bash
   docker build -t crm-panel:latest .
   ```

3. **Run Container**
   ```bash
   docker run -p 3000:3000 crm-panel:latest
   ```

4. **Push to Registry**
   ```bash
   docker tag crm-panel:latest yourregistry/crm-panel:latest
   docker push yourregistry/crm-panel:latest
   ```

### Option 4: Manual Server Deployment

1. **SSH into Server**
   ```bash
   ssh user@server-ip
   ```

2. **Install Node.js**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

3. **Clone Repository**
   ```bash
   git clone https://github.com/company/crm-panel.git
   cd Panel_WebFrontEnd
   ```

4. **Install Dependencies**
   ```bash
   npm install --production
   npm run build
   ```

5. **Setup PM2**
   ```bash
   npm install -g pm2
   pm2 start "npm run preview" --name "crm-panel"
   pm2 startup
   pm2 save
   ```

6. **Setup Nginx**
   ```nginx
   server {
     listen 80;
     server_name crm.example.com;

     root /home/user/Panel_WebFrontEnd/dist;
     index index.html;

     location / {
       try_files $uri $uri/ /index.html;
     }

     location /api {
       proxy_pass http://localhost:5000;
       proxy_set_header Host $host;
       proxy_set_header X-Real-IP $remote_addr;
     }
   }
   ```

7. **Enable HTTPS (Let's Encrypt)**
   ```bash
   sudo apt-get install certbot python3-certbot-nginx
   sudo certbot --nginx -d crm.example.com
   ```

---

## ENVIRONMENT VARIABLES

### Development (.env.local)
```
VITE_API_BASE_URL=http://localhost:5000/api
VITE_APP_NAME=Sales CRM Panel
VITE_ENVIRONMENT=development
VITE_LOG_LEVEL=debug
VITE_DEBUG=true
```

### Production (.env.production)
```
VITE_API_BASE_URL=https://api.crm.example.com/api
VITE_APP_NAME=Sales CRM Panel
VITE_ENVIRONMENT=production
VITE_LOG_LEVEL=error
VITE_DEBUG=false
VITE_SENTRY_DSN=https://your-sentry-dsn
```

### Vercel Environment Variables
```
VITE_API_BASE_URL = https://api.crm.example.com/api
VITE_ENVIRONMENT = production
```

---

## TROUBLESHOOTING

### Issue: App Won't Start
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear npm cache
npm cache clean --force

# Try again
npm run dev
```

### Issue: API Connection Error
```
Error: Failed to fetch leads
```

**Solutions:**
1. Check backend is running: `http://localhost:5000/api/health`
2. Verify `VITE_API_BASE_URL` is correct
3. Check CORS headers from backend
4. Check network tab in DevTools

### Issue: Port Already in Use
```bash
# Port 5173 is in use
npm run dev -- --port 5174
```

### Issue: Build Fails
```bash
# Check for TypeScript errors
npx tsc --noEmit

# Check bundle size
npm run build -- --stats

# Try clean build
rm -rf dist
npm run build
```

### Issue: Blank Page After Deploy
1. Check browser console for errors
2. Verify build output: `dist/index.html` exists
3. Check network requests in DevTools
4. Verify API base URL
5. Check service worker (if used)

### Issue: Styles Not Loading
1. Check `dist/` folder has CSS files
2. Verify CSS imports in components
3. Clear browser cache: Ctrl+Shift+Delete
4. Check browser DevTools → Sources tab

### Issue: Images Not Showing
```bash
# Check public folder path
# Images should be in: public/
# Reference as: /logo.png

# Or import in code
import logo from '../assets/logo.png'
```

### Issue: Memory Leak Warning
```javascript
// ✅ Cleanup in useEffect
useEffect(() => {
  const controller = new AbortController();
  
  fetchData(controller.signal);
  
  return () => controller.abort();
}, []);
```

---

## MONITORING

### Health Checks
```bash
# Check if app is running
curl http://localhost:3000/

# Check API connection
curl http://localhost:5000/api/health

# Check specific lead
curl http://localhost:3000/lead-details/lead_001
```

### Performance Monitoring

**Lighthouse Audit:**
1. Open DevTools
2. Go to Lighthouse tab
3. Run audit
4. Target scores:
   - Performance: > 90
   - Accessibility: > 90
   - Best Practices: > 90
   - SEO: > 90

**Bundle Analysis:**
```bash
npm run build -- --report
```

### Error Tracking (Sentry)

1. **Setup Sentry Account**
   ```bash
   npm install @sentry/react @sentry/tracing
   ```

2. **Initialize in main.jsx**
   ```javascript
   import * as Sentry from "@sentry/react";
   
   Sentry.init({
     dsn: import.meta.env.VITE_SENTRY_DSN,
     environment: import.meta.env.VITE_ENVIRONMENT,
     tracesSampleRate: 1.0,
   });
   ```

3. **Capture Errors**
   ```javascript
   try {
     // code
   } catch (error) {
     Sentry.captureException(error);
   }
   ```

### Server Logs
```bash
# Real-time logs
pm2 logs crm-panel

# Show specific lines
pm2 logs crm-panel --lines 100

# Clear logs
pm2 flush crm-panel
```

---

## ROLLBACK

### Rollback to Previous Version

**Vercel:**
1. Go to Deployments tab
2. Click on previous deployment
3. Click "Redeploy"

**GitHub/Git:**
```bash
# Revert to previous commit
git revert HEAD
git push origin main

# Or reset to specific commit
git reset --hard commit-hash
git push origin main --force
```

**Docker:**
```bash
# Rollback to previous image
docker run -p 3000:3000 crm-panel:previous-version

# Or use docker-compose
docker-compose down
docker-compose up -d  # with previous version
```

**Server:**
```bash
# Stop current version
pm2 stop crm-panel

# Go back to previous commit
cd ~/Panel_WebFrontEnd
git checkout previous-commit
npm install
npm run build

# Restart
pm2 start crm-panel
```

---

## MONITORING CHECKLIST

Before Going Live:

- [ ] All tests passing
- [ ] No console errors
- [ ] Build size < 500KB (gzipped)
- [ ] Lighthouse score > 85
- [ ] API endpoints tested
- [ ] Database backups configured
- [ ] Error tracking setup (Sentry)
- [ ] Performance monitoring setup
- [ ] HTTPS enabled
- [ ] Security headers configured
- [ ] Rate limiting configured
- [ ] CORS properly configured
- [ ] Environment variables set
- [ ] Database migrations done
- [ ] Staging environment matches production

---

## SUPPORT & ESCALATION

**For Issues:**
1. Check [Troubleshooting](#troubleshooting) section
2. Check GitHub Issues
3. Check Slack #crm-support channel
4. Contact: `crm-support@company.com`

**Emergency Contact:**
- On-call: Check Slack pinned messages
- PagerDuty: `https://company.pagerduty.com`

---

## USEFUL LINKS

- [React Documentation](https://react.dev)
- [Vite Documentation](https://vitejs.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [Sonner Toast](https://sonner.emilkowal.ski)
- [Lucide Icons](https://lucide.dev)
- [Axios Documentation](https://axios-http.com)

---

## CHANGELOG

### v1.0.0 (2024-02-10)
- ✅ Initial release
- ✅ Lead management system
- ✅ Sale confirmation
- ✅ Delivery tracking
- ✅ Meeting scheduling
- ✅ Dashboard with analytics
- ✅ Dark/Light theme

### Future Features (v1.1.0)
- [ ] Real-time notifications
- [ ] Advanced analytics
- [ ] Custom reports
- [ ] Team collaboration features
- [ ] Mobile app

---

**Last Updated:** 2024-02-10
**Status:** Production Ready ✅

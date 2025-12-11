# Production Deployment Checklist

This document tracks what needs to change when moving from local development to production.

## 🔄 Services That Need Changes

### 1. **File Storage (Azurite → Azure Blob Storage)**

**Current (Local):**
- Using Azurite (local Azure emulator)
- Connection string: `DefaultEndpointsProtocol=http;AccountName=devstoreaccount1;...`
- Runs as Node.js process: `npm run azurite`

**Production:**
- Use real Azure Blob Storage
- Update `AZURE_STORAGE_CONNECTION_STRING` in `.env` with production connection string
- Remove `npm run azurite` from startup process
- Update `backend/src/config/index.js` - set `useAzurite: false` or based on `NODE_ENV`

**Files to Update:**
- `backend/.env` - `AZURE_STORAGE_CONNECTION_STRING`
- `backend/src/config/index.js` - `fileStorage.azure.useAzurite`

---

### 2. **Vector Database (ChromaDB Docker → Managed Service)**

**Current (Local):**
- ChromaDB running in Docker container
- Local connection: `localhost:8000`
- Data stored in `backend/chroma-data/`
- Started with: `npm run chromadb`

**Production Options:**
- **Option A**: Self-hosted ChromaDB server (Docker on server)
  - Update `CHROMA_SERVER_HOST` to production server IP/domain
  - Update `CHROMA_SERVER_PORT` if different
  - Ensure Docker is running on production server
  
- **Option B**: Managed vector database service
  - Consider: Pinecone, Weaviate, Qdrant, or Azure AI Search
  - Would require updating `vectorDatabaseService.js` to use different client
  - More scalable but adds cost

**Files to Update:**
- `backend/.env` - `CHROMA_SERVER_HOST`, `CHROMA_SERVER_PORT`
- `backend/src/services/ai/vectorDatabaseService.js` - If switching to different service

---

### 3. **Database (Already Using Azure SQL)**

**Current:**
- Azure SQL Database (already production-ready)
- Connection via `DB_SERVER`, `DB_DATABASE`, `DB_USER`, `DB_PASSWORD`

**Production:**
- ✅ Already using production database
- Ensure connection string uses production credentials
- Consider connection pooling settings for production load

**Files to Check:**
- `backend/.env` - Database credentials
- `backend/src/config/database.js` - Connection pool settings

---

### 4. **API Keys (Development → Production)**

**Current:**
- API keys in `backend/.env` (local development)

**Production:**
- Store API keys in secure environment variable service
- Azure: Use Azure Key Vault or App Service Configuration
- Never commit `.env` files to git
- Rotate keys periodically

**Keys to Secure:**
- `ANTHROPIC_API_KEY`
- `OPENAI_API_KEY`
- `JWT_SECRET`
- `DB_PASSWORD`
- `AZURE_STORAGE_CONNECTION_STRING`

---

### 5. **Environment Variables**

**Current:**
- All in `backend/.env` file

**Production:**
- Use environment variables from hosting platform
- Azure App Service: Configuration → Application Settings
- Docker: Pass via `-e` flags or `.env` file (not in image)
- Consider using `.env.production` for different configs

**Required Variables:**
```env
# Server
NODE_ENV=production
PORT=5001

# Database
DB_SERVER=your-server.database.windows.net
DB_DATABASE=your-database
DB_USER=your-user
DB_PASSWORD=your-password

# Storage
AZURE_STORAGE_CONNECTION_STRING=your-production-connection-string

# AI Services
ENABLE_AI=true
ANTHROPIC_API_KEY=your-key
ANTHROPIC_MODEL=claude-sonnet-4-5-20250929
OPENAI_API_KEY=your-key

# ChromaDB
CHROMA_USE_SERVER=true
CHROMA_SERVER_HOST=your-chromadb-host
CHROMA_SERVER_PORT=8000

# Auth
JWT_SECRET=your-production-secret
JWT_EXPIRES_IN=24h

# CORS
FRONTEND_URL=https://your-production-domain.com
```

---

### 6. **Frontend Build & Deployment**

**Current:**
- Development server: `npm run dev`
- Runs on `localhost:3000`

**Production:**
- Build static files: `npm run build` in `frontend/`
- Deploy `frontend/dist/` to:
  - Azure Static Web Apps
  - Azure Blob Storage + CDN
  - Netlify/Vercel
  - Any static hosting service
- Update `VITE_API_BASE_URL` to production API URL

**Files to Update:**
- `frontend/.env.production` - Production API URL
- Build process: `frontend/package.json` - `build` script

---

### 7. **Backend Deployment**

**Current:**
- Development server: `npm run dev` (nodemon)
- Runs on `localhost:5001`

**Production Options:**
- **Option A**: Azure App Service (Node.js)
  - Deploy via Git, GitHub Actions, or Azure DevOps
  - Configure environment variables in portal
  - Enable Application Insights for monitoring
  
- **Option B**: Docker Container
  - Create `Dockerfile` for backend
  - Push to Azure Container Registry
  - Deploy to Azure Container Instances or App Service (Linux)
  
- **Option C**: Azure Functions
  - Convert to serverless functions
  - More complex refactoring required

**Files to Create/Update:**
- `backend/Dockerfile` (if using containers)
- `backend/.dockerignore`
- `backend/package.json` - Ensure `start` script uses `node` not `nodemon`

---

### 8. **Startup Process**

**Current (Local - 4 Terminals):**
1. Frontend: `cd frontend && npm run dev`
2. Backend: `cd backend && npm run dev`
3. Azurite: `cd backend && npm run azurite`
4. ChromaDB: `cd backend && npm run chromadb`

**Production:**
- Frontend: Static files served by CDN/hosting service
- Backend: Runs as service (App Service, Container, etc.)
- Azurite: ❌ Not needed (using real Azure Blob Storage)
- ChromaDB: Runs as Docker container on server OR managed service

---

### 9. **Monitoring & Logging**

**Current:**
- Console logs
- File logs in `backend/logs/` (if configured)

**Production:**
- Set up Application Insights (Azure)
- Configure structured logging
- Set up alerts for errors
- Monitor API response times
- Track ChromaDB connection health
- Monitor embedding generation costs (OpenAI API)

**Files to Update:**
- `backend/src/utils/logger.js` - Add Application Insights integration
- Configure log levels for production

---

### 10. **Security**

**Current:**
- Development CORS: `localhost:3000`
- Development JWT secret

**Production:**
- Update CORS to production frontend URL
- Use strong, unique JWT secret
- Enable HTTPS only
- Set up rate limiting (already implemented)
- Review authentication middleware
- Enable SQL injection protection (parameterized queries - already done)

**Files to Update:**
- `backend/src/config/index.js` - CORS settings
- `backend/.env` - `JWT_SECRET`, `FRONTEND_URL`

---

## 📋 Quick Migration Steps

1. **Set up production Azure resources:**
   - Azure SQL Database (already exists)
   - Azure Blob Storage account
   - Azure App Service (for backend)
   - Azure Static Web Apps (for frontend)

2. **Update environment variables:**
   - Copy `.env` to production environment
   - Update all connection strings and URLs
   - Set `NODE_ENV=production`

3. **Deploy backend:**
   - Build and deploy to Azure App Service
   - Configure environment variables
   - Test API endpoints

4. **Deploy frontend:**
   - Run `npm run build`
   - Deploy `dist/` folder
   - Update API URL

5. **Set up ChromaDB:**
   - Option A: Deploy Docker container on server
   - Option B: Set up managed vector database service

6. **Test everything:**
   - File uploads
   - Document indexing
   - AI chat with RAG
   - Authentication

7. **Set up monitoring:**
   - Application Insights
   - Error alerts
   - Performance monitoring

---

## 🔍 Testing Checklist

Before going live, test:
- [ ] File uploads work with Azure Blob Storage
- [ ] Document indexing works with production ChromaDB
- [ ] AI chat retrieves documents correctly
- [ ] Authentication works
- [ ] CORS allows production frontend
- [ ] All API endpoints respond correctly
- [ ] Error handling works properly
- [ ] Logging captures errors

---

## 💰 Cost Considerations

**Current (Development):**
- Free/cheap: Azurite (local), ChromaDB (local Docker)
- Paid: Anthropic API, OpenAI API (pay-per-use)

**Production:**
- Azure Blob Storage: ~$0.0184/GB/month
- Azure SQL Database: Based on tier
- Azure App Service: Based on plan
- ChromaDB: Self-hosted (server costs) OR managed service ($)
- API costs: Same (Anthropic + OpenAI)

**Optimization:**
- Cache embeddings when possible
- Batch document indexing
- Monitor API usage
- Consider embedding caching layer


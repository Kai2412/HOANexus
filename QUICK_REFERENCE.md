# Quick Reference - Development Commands

## 🚀 Starting Everything (4 Terminals)

### Terminal 1: Frontend
```bash
cd frontend
npm run dev
```
**Runs on:** http://localhost:3000

### Terminal 2: Backend
```bash
cd backend
npm run dev
```
**Runs on:** http://localhost:5001

### Terminal 3: Azurite (File Storage)
```bash
cd backend
npm run azurite
```
**Runs on:** http://localhost:10000

### Terminal 4: ChromaDB (Vector Database)
```bash
cd backend
npm run chromadb
```
**Runs on:** http://localhost:8000  
**Note:** Run once, then close terminal - container keeps running

---

## 🛠️ Useful Commands

### ChromaDB Management
```bash
# Start ChromaDB container
cd backend && npm run chromadb

# Stop ChromaDB container
cd backend && npm run chromadb:stop

# View ChromaDB logs
docker logs chromadb

# Check if ChromaDB is running
docker ps | grep chromadb
```

### Docker Commands
```bash
# List all running containers
docker ps

# List all containers (including stopped)
docker ps -a

# View container logs
docker logs <container-name>

# Stop a container
docker stop <container-name>

# Remove a container
docker rm <container-name>

# Restart a container
docker restart <container-name>
```

### Document Indexing
```bash
# Index all PDF documents
cd backend && npm run index-documents

# Verify setup (check config, Docker, ports)
cd backend && npm run verify-setup
```

### Database/Backend
```bash
# Run backend in production mode
cd backend && npm start

# Run tests
cd backend && npm test
```

### Frontend
```bash
# Build for production
cd frontend && npm run build

# Preview production build
cd frontend && npm run preview
```

---

## 🔍 Troubleshooting Commands

### Check What's Running
```bash
# Check all ports in use (Windows)
netstat -an | findstr "3000 5001 8000 10000"

# Check Docker containers
docker ps

# Check if Docker is running
docker ps
```

### Restart Services
```bash
# Restart ChromaDB
cd backend && npm run chromadb:stop && npm run chromadb

# Restart everything (stop all, then start in order)
# 1. Stop ChromaDB: cd backend && npm run chromadb:stop
# 2. Close all terminals
# 3. Start Docker Desktop
# 4. Start terminals 1-4 in order
```

### View Logs
```bash
# ChromaDB logs
docker logs chromadb

# Backend logs (in terminal where backend is running)
# Frontend logs (in terminal where frontend is running)
# Azurite logs: backend/azurite-data/debug.log
```

---

## 📋 Development Workflow

**Daily Start:**
1. Open Docker Desktop (wait for "Engine running")
2. Terminal 1: Frontend (`cd frontend && npm run dev`)
3. Terminal 2: Backend (`cd backend && npm run dev`)
4. Terminal 3: Azurite (`cd backend && npm run azurite`)
5. Terminal 4: ChromaDB (`cd backend && npm run chromadb`) - then close

**Daily Stop:**
- Close all terminals (Ctrl+C)
- Optionally stop ChromaDB: `cd backend && npm run chromadb:stop`
- Close Docker Desktop (optional)

---

## 🔑 Environment Variables Needed

Make sure `backend/.env` has:
```env
CHROMA_USE_SERVER=true
CHROMA_SERVER_HOST=localhost
CHROMA_SERVER_PORT=8000
ENABLE_AI=true
ANTHROPIC_API_KEY=your-key
OPENAI_API_KEY=your-key
```

---

## 📍 Port Reference

| Service | Port | URL |
|---------|------|-----|
| Frontend | 3000 | http://localhost:3000 |
| Backend | 5001 | http://localhost:5001 |
| Azurite | 10000 | http://localhost:10000 |
| ChromaDB | 8000 | http://localhost:8000 |


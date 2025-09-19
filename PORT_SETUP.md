# HOA Nexus - Final Port Configuration

## ✅ Current Running Ports:
- **Frontend (Vite + React)**: http://localhost:3000
- **Backend (Node.js + Express)**: http://localhost:5001

## Quick Start Commands:

### 1. Start Backend First:
```bash
cd backend
npm start
```

### 2. Start Frontend Second:
```bash
cd frontend  
npm run dev
```

## Development URLs:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5001/api
- **Health Check**: http://localhost:5001

## ✅ Everything Working:
- Backend: Database connected ✅
- Frontend: Loading on port 3000 ✅  
- API Communication: Configured ✅
- CORS: Properly set for port 3000 ✅

## Final Configuration:
- `frontend/.env` - VITE_API_BASE_URL=http://localhost:5001/api
- `backend/.env` - PORT=5001
- `backend/src/server.js` - CORS includes localhost:3000

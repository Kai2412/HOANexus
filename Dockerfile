# Use Node.js 18 LTS
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/

# Install backend dependencies
WORKDIR /app/backend
RUN npm ci --only=production

# Install frontend dependencies and build
WORKDIR /app/frontend
RUN npm ci
COPY frontend/ .
# Set production API URL to use relative paths
ENV VITE_API_BASE_URL=/api
RUN npm run build

# Go back to app root and copy backend files
WORKDIR /app
COPY backend/ ./backend/
COPY shared/ ./shared/

# Copy built frontend to backend's public directory
RUN mkdir -p ./backend/public
RUN cp -r ./frontend/dist/* ./backend/public/

# Expose port
EXPOSE 8080

# Set working directory to backend for running
WORKDIR /app/backend

# Start the application
CMD ["node", "src/server.js"]

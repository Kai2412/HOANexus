const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

// Import centralized configuration
const config = require('./config');

// Import database connection
const { getConnection } = require('./config/database');

// Import route files
const communityRoutes = require('./routes/communityRoutes');
const propertyRoutes = require('./routes/propertyRoutes');
const stakeholderRoutes = require('./routes/stakeholderRoutes');
const amenityRoutes = require('./routes/amenityRoutes');
const assignmentRoutes = require('./routes/assignmentRoutes');
const authRoutes = require('./routes/authRoutes');
const ticketRoutes = require('./routes/ticketRoutes');
const managementTeamRoutes = require('./routes/managementTeamRoutes');

// Import error handling utilities
const { globalErrorHandler } = require('./utils/errorHandler');

// Import logging service
const { logger } = require('./utils/logger');

const app = express();
const PORT = config.server.port;

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit(config.server.rateLimit);
app.use(limiter);

// CORS configuration
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (config.server.cors.allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: config.server.cors.credentials
}));

// Body parsing middleware
app.use(express.json({ limit: config.api.maxBodySize }));
app.use(express.urlencoded({ extended: true }));

// Serve static files from the frontend build
app.use(express.static(path.join(__dirname, '../public')));

// Health check route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'HOA Nexus API is running!',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/management-team', managementTeamRoutes);
app.use('/api/communities', communityRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/stakeholders', stakeholderRoutes);
app.use('/api/amenities', amenityRoutes);
app.use('/api/assignments', assignmentRoutes);

// Test database connection endpoint
app.get('/api/test-db', async (req, res) => {
  try {
    const pool = await getConnection();
    const result = await pool.request().query('SELECT 1 as test');
    res.json({
      success: true,
      message: 'Database connection successful',
      data: result.recordset
    });
  } catch (error) {
    logger.databaseError('connection test', 'test', error, 'API');
    res.status(500).json({
      success: false,
      message: 'Database connection failed',
      error: error.message
    });
  }
});

// Handle client-side routing - serve index.html for non-API routes
app.get('*', (req, res) => {
  // If it's an API route that wasn't handled, return 404 JSON
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({
      success: false,
      message: 'API route not found',
      requestedUrl: req.originalUrl,
      availableRoutes: [
        'POST /api/auth/login',
        'GET /api/tickets',
        'GET /api/communities',
        'GET /api/properties', 
        'GET /api/stakeholders',
        'GET /api/amenities',
        'POST /api/assignments/requests'
      ]
    });
  }
  
  // For all other routes, serve the frontend app
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Global error handler
app.use(globalErrorHandler);

// Start server
app.listen(PORT, async () => {
  try {
    // Test database connection on startup
    logger.startup('Testing database connection...');
    await getConnection();
    logger.startup('Database connection successful!');
    
    logger.startup(`HOA Nexus API Server running on port ${PORT}`);
    logger.info(`📍 Health check: http://localhost:${PORT}/`, 'Server');
    logger.info(`🏘️  Communities: http://localhost:${PORT}${config.api.basePath}/communities`, 'Server');
    logger.info(`🏠 Properties: http://localhost:${PORT}${config.api.basePath}/properties`, 'Server');
    logger.info(`👥 Stakeholders: http://localhost:${PORT}${config.api.basePath}/stakeholders`, 'Server');
    logger.info(`🏊 Amenities: http://localhost:${PORT}${config.api.basePath}/amenities`, 'Server');
    logger.info('═══════════════════════════════════════════════', 'Server');
  } catch (error) {
    logger.error('Failed to connect to database', 'Server', null, error);
    logger.error('Make sure your database is running and connection settings are correct', 'Server');
  }
});
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
// const propertyRoutes = require('./routes/propertyRoutes'); // Temporarily disabled - will be rebuilt with new table
const stakeholderRoutes = require('./routes/stakeholderRoutes');
const managementFeeRoutes = require('./routes/managementFeeRoutes');
const billingInformationRoutes = require('./routes/billingInformationRoutes');
const boardInformationRoutes = require('./routes/boardInformationRoutes');
const feeMasterRoutes = require('./routes/feeMasterRoutes');
const communityFeeVarianceRoutes = require('./routes/communityFeeVarianceRoutes');
const commitmentFeesRoutes = require('./routes/commitmentFeesRoutes');
// const amenityRoutes = require('./routes/amenityRoutes'); // Temporarily disabled - will be rebuilt with new table
const assignmentRoutes = require('./routes/assignmentRoutes');
const authRoutes = require('./routes/authRoutes');
const ticketRoutes = require('./routes/ticketRoutes');
const managementTeamRoutes = require('./routes/managementTeamRoutes');
const dynamicDropChoicesRoutes = require('./routes/dynamicDropChoicesRoutes');
const bulkUploadRoutes = require('./routes/bulkUploadRoutes');
const folderRoutes = require('./routes/folderRoutes');
const fileRoutes = require('./routes/fileRoutes');
const invoiceRoutes = require('./routes/invoiceRoutes');

// Import error handling utilities
const { globalErrorHandler } = require('./utils/errorHandler');

// Import logging service
const { logger } = require('./utils/logger');

const app = express();
const PORT = config.server.port;

// Security middleware
app.use(helmet());

// CORS configuration (must be before rate limiting for OPTIONS requests)
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // In development, allow all localhost origins
    if (config.server.environment === 'development' && origin.includes('localhost')) {
      return callback(null, true);
    }
    
    if (config.server.cors.allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: config.server.cors.credentials,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

// Rate limiting (after CORS to allow preflight requests)
// Skip rate limiting for OPTIONS requests (CORS preflight)
const limiter = rateLimit({
  ...config.server.rateLimit,
  skip: (req) => req.method === 'OPTIONS'
});
app.use(limiter);

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
app.use('/api/management-fees', managementFeeRoutes);
app.use('/api/billing-information', billingInformationRoutes);
app.use('/api/board-information', boardInformationRoutes);
app.use('/api/fee-master', feeMasterRoutes);
app.use('/api/community-fee-variances', communityFeeVarianceRoutes);
app.use('/api/commitment-fees', commitmentFeesRoutes);
// app.use('/api/properties', propertyRoutes); // Temporarily disabled - will be rebuilt with new table
app.use('/api/stakeholders', stakeholderRoutes);
// app.use('/api/amenities', amenityRoutes); // Temporarily disabled - will be rebuilt with new table
app.use('/api/assignments', assignmentRoutes);
app.use('/api/dynamic-drop-choices', dynamicDropChoicesRoutes);
app.use('/api/admin/bulk-upload', bulkUploadRoutes);
app.use('/api/folders', folderRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/invoices', invoiceRoutes);

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
        // 'GET /api/properties', // Temporarily disabled 
        'GET /api/stakeholders',
        // 'GET /api/amenities', // Temporarily disabled
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
    // Test master database connection on startup (we need this for authentication)
    // Client database connections will be established per-user after login
    logger.startup('Testing master database connection...');
    const { getMasterConnection } = require('./config/database');
    await getMasterConnection();
    logger.startup('Master database connection successful!');
    
    // Optionally test default client database (for development/testing)
    // In production, each user will connect to their organization's database
    try {
      await getConnection();
      logger.startup('Default client database connection successful!');
    } catch (clientError) {
      logger.warn('Default client database connection failed (this is OK - users will connect to their org database)', 'Server');
    }
    
    logger.startup(`HOA Nexus API Server running on port ${PORT}`);
    logger.info(`📍 Health check: http://localhost:${PORT}/`, 'Server');
    logger.info(`🏘️  Communities: http://localhost:${PORT}${config.api.basePath}/communities`, 'Server');
    // logger.info(`🏠 Properties: http://localhost:${PORT}${config.api.basePath}/properties`, 'Server'); // Temporarily disabled
    logger.info(`👥 Stakeholders: http://localhost:${PORT}${config.api.basePath}/stakeholders`, 'Server');
    // logger.info(`🏊 Amenities: http://localhost:${PORT}${config.api.basePath}/amenities`, 'Server'); // Temporarily disabled
    logger.info('═══════════════════════════════════════════════', 'Server');
  } catch (error) {
    logger.error('Failed to connect to database', 'Server', null, error);
    logger.error('Make sure your database is running and connection settings are correct', 'Server');
    logger.error('For SQL Server Express, make sure:', 'Server');
    logger.error('  1. SQL Server service is running', 'Server');
    logger.error('  2. TCP/IP protocol is enabled in SQL Server Configuration Manager', 'Server');
    logger.error('  3. SQL Server Browser service is running (if using named instance)', 'Server');
    logger.error('  4. Port 1433 is not blocked by firewall', 'Server');
  }
});
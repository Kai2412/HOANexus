// Centralized configuration for HOA Nexus Backend
require('dotenv').config();

const config = {
  // Server Configuration
  server: {
    port: parseInt(process.env.PORT) || 5001,
    environment: process.env.NODE_ENV || 'development',
    cors: {
      allowedOrigins: [
        'http://localhost:3000',   // Standard React/Vite port
        'http://localhost:3007',   // Alternative port if 3000 is busy
        'http://localhost:5173',   // Vite default port
        'http://localhost:5174',   // Vite alternative ports
        'http://localhost:5175',
        'http://localhost:5176',
        'http://localhost:5177',
        'http://localhost:5178',
        process.env.FRONTEND_URL
      ].filter(Boolean),
      credentials: true,
    },
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
    },
  },

  // Database Configuration
  database: {
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT) || 1433,
    options: {
      encrypt: process.env.DB_ENCRYPT === 'true',
      trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === 'true',
    },
    pool: {
      max: 10,
      min: 0,
      idleTimeoutMillis: 30000,
    },
  },

  // Authentication Configuration
  auth: {
    jwtSecret: process.env.JWT_SECRET || 'hoa-nexus-default-secret-change-in-production',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
    bcryptRounds: 12,
  },

  // Security Configuration
  security: {
    helmet: {
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
    },
  },

  // Logging Configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    enableConsole: process.env.NODE_ENV !== 'production',
    enableFile: process.env.NODE_ENV === 'production',
    logFile: process.env.LOG_FILE || 'logs/app.log',
  },

  // API Configuration
  api: {
    basePath: '/api',
    version: '1.0.0',
    timeout: 30000, // 30 seconds
    maxBodySize: '10mb',
  },

  // Feature Flags
  features: {
    enableSwagger: process.env.NODE_ENV === 'development',
    enableMetrics: process.env.ENABLE_METRICS === 'true',
    enableCaching: process.env.ENABLE_CACHING === 'true',
  },
};

// Validation
const requiredEnvVars = [
  'DB_SERVER',
  'DB_DATABASE', 
  'DB_USER',
  'DB_PASSWORD'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingVars);
  console.error('💡 Please check your .env file and ensure all required variables are set.');
  process.exit(1);
}

// Environment-specific overrides
if (config.server.environment === 'development') {
  // Note: Logger not available here yet, so we'll use console for config logging
  console.log('🔧 HOA Nexus Backend Configuration:', {
    server: config.server,
    database: {
      ...config.database,
      password: config.database.password ? '***LOADED***' : 'MISSING'
    },
    auth: {
      ...config.auth,
      jwtSecret: config.auth.jwtSecret ? '***LOADED***' : 'MISSING'
    }
  });
}

module.exports = config;

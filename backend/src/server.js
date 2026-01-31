const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const logger = require('./utils/logger');
const spotifyService = require('./services/spotifyService');
const databaseService = require('./services/databaseService');

// Import routes
const authRoutes = require('./routes/auth');
const spotifyRoutes = require('./routes/spotify');
const analyticsRoutes = require('./routes/analytics');

const app = express();
const PORT = process.env.PORT || 3001;

activeQueue = null;

// Security middleware
app.use(helmet());

// CORS configuration
console.log('CORS_ALLOWED_ORIGINS:', process.env.CORS_ALLOWED_ORIGINS);
const allowedOrigins = process.env.CORS_ALLOWED_ORIGINS
  ? process.env.CORS_ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
  : ['http://localhost:3000', 'http://localhost:3001'];

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path} - ${req.ip}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/spotify', spotifyRoutes);
app.use('/api/analytics', analyticsRoutes);
app.get('/api/queue', async (req, res) => {
  try {
    res.json(this.activeQueue);
  } catch (error) {
    logger.error('Failed to get active queue:', error);
    res.status(500).json({ error: 'Failed to get active queue', details: error.message });
  }
});


// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Initialize services and start server
async function startServer() {
  try {
    // Initialize Spotify service
    //await spotifyService.initialize();

    // Initialize database connection
    await databaseService.initialize();

    // Start the server
    app.listen(PORT, () => {
      logger.info(`🚀 Spotify DJ Bot backend running on port ${PORT}`);
      logger.info(`📊 Environment: ${process.env.NODE_ENV}`);

      setInterval(async () => {
        if (spotifyService.isTokenValid()) {
          try {
            const data = await spotifyService.getCurrentPlaybackQueue();
            this.activeQueue = data;
            console.log(this.activeQueue);

          } catch (error) {
            logger.error('Failed to get current playback:', error);
          }
        }
      }, 10000);
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await databaseService.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  await databaseService.close();
  process.exit(0);
});

startServer();

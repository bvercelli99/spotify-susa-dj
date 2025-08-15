const { Pool } = require('pg');
const logger = require('../utils/logger');

class DatabaseService {
  constructor() {
    this.pool = null;
    this.isInitialized = false;
  }

  async initialize() {
    try {
      // Create connection pool
      this.pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        max: 20, // Maximum number of clients in the pool
        idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
        connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
      });

      // Test the connection
      const client = await this.pool.connect();
      await client.query('SELECT NOW()');
      client.release();

      this.isInitialized = true;
      logger.info('Database connection pool initialized successfully');

      // Create tables if they don't exist
      await this.createTables();
    } catch (error) {
      logger.error('Failed to initialize database:', error);
      throw error;
    }
  }

  async createTables() {
    try {
      const client = await this.pool.connect();

      // Create usage_analytics table
      await client.query(`
        CREATE TABLE IF NOT EXISTS usage_analytics (
          id SERIAL PRIMARY KEY,
          user_id VARCHAR(255),
          action_type VARCHAR(100) NOT NULL,
          action_details JSONB,
          spotify_track_id VARCHAR(255),
          spotify_artist_id VARCHAR(255),
          search_query TEXT,
          device_id VARCHAR(255),
          timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          session_id VARCHAR(255),
          ip_address INET,
          user_agent TEXT
        )
      `);

      // Create user_sessions table
      await client.query(`
        CREATE TABLE IF NOT EXISTS user_sessions (
          id SERIAL PRIMARY KEY,
          session_id VARCHAR(255) UNIQUE NOT NULL,
          user_id VARCHAR(255),
          spotify_user_id VARCHAR(255),
          started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          ended_at TIMESTAMP,
          device_info JSONB,
          ip_address INET
        )
      `);

      // Create playback_history table
      await client.query(`
        CREATE TABLE IF NOT EXISTS playback_history (
          id SERIAL PRIMARY KEY,
          session_id VARCHAR(255),
          track_id VARCHAR(255) NOT NULL,
          track_name VARCHAR(500),
          artist_name VARCHAR(500),
          album_name VARCHAR(500),
          played_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          duration_ms INTEGER,
          position_ms INTEGER,
          device_id VARCHAR(255)
        )
      `);

      // Create indexes for better performance
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_usage_analytics_timestamp ON usage_analytics(timestamp);
        CREATE INDEX IF NOT EXISTS idx_usage_analytics_action_type ON usage_analytics(action_type);
        CREATE INDEX IF NOT EXISTS idx_usage_analytics_user_id ON usage_analytics(user_id);
        CREATE INDEX IF NOT EXISTS idx_playback_history_session_id ON playback_history(session_id);
        CREATE INDEX IF NOT EXISTS idx_playback_history_played_at ON playback_history(played_at);
      `);

      client.release();
      logger.info('Database tables created successfully');
    } catch (error) {
      logger.error('Failed to create database tables:', error);
      throw error;
    }
  }

  // Log user action for analytics
  async logUserAction(actionData) {
    try {
      const {
        userId,
        actionType,
        actionDetails = {},
        spotifyTrackId = null,
        spotifyArtistId = null,
        searchQuery = null,
        deviceId = null,
        sessionId = null,
        ipAddress = null,
        userAgent = null
      } = actionData;

      const query = `
        INSERT INTO usage_analytics 
        (user_id, action_type, action_details, spotify_track_id, spotify_artist_id, 
         search_query, device_id, session_id, ip_address, user_agent)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING id
      `;

      const values = [
        userId,
        actionType,
        JSON.stringify(actionDetails),
        spotifyTrackId,
        spotifyArtistId,
        searchQuery,
        deviceId,
        sessionId,
        ipAddress,
        userAgent
      ];

      const result = await this.pool.query(query, values);
      logger.info(`User action logged: ${actionType} for user ${userId}`);
      return result.rows[0];
    } catch (error) {
      logger.error('Failed to log user action:', error);
      throw error;
    }
  }

  // Start a new user session
  async startUserSession(sessionData) {
    try {
      const {
        sessionId,
        userId = null,
        spotifyUserId = null,
        deviceInfo = {},
        ipAddress = null
      } = sessionData;

      const query = `
        INSERT INTO user_sessions 
        (session_id, user_id, spotify_user_id, device_info, ip_address)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id
      `;

      const values = [
        sessionId,
        userId,
        spotifyUserId,
        JSON.stringify(deviceInfo),
        ipAddress
      ];

      const result = await this.pool.query(query, values);
      logger.info(`User session started: ${sessionId}`);
      return result.rows[0];
    } catch (error) {
      logger.error('Failed to start user session:', error);
      throw error;
    }
  }

  // End a user session
  async endUserSession(sessionId) {
    try {
      const query = `
        UPDATE user_sessions 
        SET ended_at = CURRENT_TIMESTAMP 
        WHERE session_id = $1
        RETURNING id
      `;

      const result = await this.pool.query(query, [sessionId]);
      logger.info(`User session ended: ${sessionId}`);
      return result.rows[0];
    } catch (error) {
      logger.error('Failed to end user session:', error);
      throw error;
    }
  }

  // Log playback event
  async logPlaybackEvent(playbackData) {
    try {
      const {
        sessionId,
        trackId,
        trackName,
        artistName,
        albumName,
        durationMs = null,
        positionMs = null,
        deviceId = null
      } = playbackData;

      const query = `
        INSERT INTO playback_history 
        (session_id, track_id, track_name, artist_name, album_name, 
         duration_ms, position_ms, device_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id
      `;

      const values = [
        sessionId,
        trackId,
        trackName,
        artistName,
        albumName,
        durationMs,
        positionMs,
        deviceId
      ];

      const result = await this.pool.query(query, values);
      logger.info(`Playback event logged: ${trackName} by ${artistName}`);
      return result.rows[0];
    } catch (error) {
      logger.error('Failed to log playback event:', error);
      throw error;
    }
  }

  // Get analytics data
  async getAnalytics(filters = {}) {
    try {
      const {
        startDate = null,
        endDate = null,
        actionType = null,
        userId = null,
        limit = 100,
        offset = 0
      } = filters;

      let query = `
        SELECT 
          ua.*,
          ph.track_name,
          ph.artist_name,
          ph.album_name
        FROM usage_analytics ua
        LEFT JOIN playback_history ph ON ua.spotify_track_id = ph.track_id
        WHERE 1=1
      `;

      const values = [];
      let paramCount = 0;

      if (startDate) {
        paramCount++;
        query += ` AND ua.timestamp >= $${paramCount}`;
        values.push(startDate);
      }

      if (endDate) {
        paramCount++;
        query += ` AND ua.timestamp <= $${paramCount}`;
        values.push(endDate);
      }

      if (actionType) {
        paramCount++;
        query += ` AND ua.action_type = $${paramCount}`;
        values.push(actionType);
      }

      if (userId) {
        paramCount++;
        query += ` AND ua.user_id = $${paramCount}`;
        values.push(userId);
      }

      query += ` ORDER BY ua.timestamp DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
      values.push(limit, offset);

      const result = await this.pool.query(query, values);
      return result.rows;
    } catch (error) {
      logger.error('Failed to get analytics:', error);
      throw error;
    }
  }

  // Get popular tracks
  async getPopularTracks(limit = 10, days = 30) {
    try {
      const query = `
        SELECT 
          ph.track_id,
          ph.track_name,
          ph.artist_name,
          ph.album_name,
          COUNT(*) as play_count
        FROM playback_history ph
        WHERE ph.played_at >= CURRENT_TIMESTAMP - INTERVAL '${days} days'
        GROUP BY ph.track_id, ph.track_name, ph.artist_name, ph.album_name
        ORDER BY play_count DESC
        LIMIT $1
      `;

      const result = await this.pool.query(query, [limit]);
      return result.rows;
    } catch (error) {
      logger.error('Failed to get popular tracks:', error);
      throw error;
    }
  }

  // Get popular artists
  async getPopularArtists(limit = 10, days = 30) {
    try {
      const query = `
        SELECT 
          ph.artist_name,
          COUNT(*) as play_count,
          COUNT(DISTINCT ph.track_id) as unique_tracks
        FROM playback_history ph
        WHERE ph.played_at >= CURRENT_TIMESTAMP - INTERVAL '${days} days'
        GROUP BY ph.artist_name
        ORDER BY play_count DESC
        LIMIT $1
      `;

      const result = await this.pool.query(query, [limit]);
      return result.rows;
    } catch (error) {
      logger.error('Failed to get popular artists:', error);
      throw error;
    }
  }

  // Get search analytics
  async getSearchAnalytics(days = 30) {
    try {
      const query = `
        SELECT 
          search_query,
          COUNT(*) as search_count,
          COUNT(DISTINCT user_id) as unique_users
        FROM usage_analytics
        WHERE action_type = 'search' 
          AND search_query IS NOT NULL
          AND timestamp >= CURRENT_TIMESTAMP - INTERVAL '${days} days'
        GROUP BY search_query
        ORDER BY search_count DESC
        LIMIT 20
      `;

      const result = await this.pool.query(query);
      return result.rows;
    } catch (error) {
      logger.error('Failed to get search analytics:', error);
      throw error;
    }
  }

  // Get user session statistics
  async getUserSessionStats(days = 30) {
    try {
      const query = `
        SELECT 
          COUNT(*) as total_sessions,
          COUNT(DISTINCT user_id) as unique_users,
          AVG(EXTRACT(EPOCH FROM (ended_at - started_at))) as avg_session_duration_seconds
        FROM user_sessions
        WHERE started_at >= CURRENT_TIMESTAMP - INTERVAL '${days} days'
          AND ended_at IS NOT NULL
      `;

      const result = await this.pool.query(query);
      return result.rows[0];
    } catch (error) {
      logger.error('Failed to get user session stats:', error);
      throw error;
    }
  }

  // Close database connection
  async close() {
    if (this.pool) {
      await this.pool.end();
      logger.info('Database connection pool closed');
    }
  }

  // Health check
  async healthCheck() {
    try {
      const client = await this.pool.connect();
      await client.query('SELECT 1');
      client.release();
      return { status: 'healthy', timestamp: new Date().toISOString() };
    } catch (error) {
      logger.error('Database health check failed:', error);
      return { status: 'unhealthy', error: error.message, timestamp: new Date().toISOString() };
    }
  }
}

module.exports = new DatabaseService();

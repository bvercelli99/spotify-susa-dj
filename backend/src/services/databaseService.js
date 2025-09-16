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
        //connectionString: process.env.DATABASE_URL,
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD || '',
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

      // Create playback_history table
      await client.query(`
        CREATE TABLE IF NOT EXISTS playback_history (
          id SERIAL PRIMARY KEY,
          track_id VARCHAR(50) NOT NULL,
          track_name VARCHAR(100),
          artist_name VARCHAR(100),
          album_name VARCHAR(100),
          user_id text NOT NULL,
          added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          times_played INTEGER NOT NULL DEFAULT 1
        )
      `);

      // Create indexes for better performance
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_playback_history_user_id ON playback_history(user_id);
        CREATE INDEX IF NOT EXISTS idx_playback_history_track_id ON playback_history(track_id);
      `);

      client.release();
      logger.info('Database tables created successfully');
    } catch (error) {
      logger.error('Failed to create database tables:', error);
      throw error;
    }
  }


  // Log playback event
  async logPlaybackEvent(playbackData) {
    try {
      const {
        trackId,
        trackName,
        artistName,
        albumName,
        userId
      } = playbackData;

      const checkQuery = `
        SELECT id FROM playback_history 
        WHERE track_id = $1
      `;

      const existingCheck = await this.pool.query(checkQuery, [trackId]);

      if (existingCheck.rows.length > 0) {
        // If entry exists, update the times_played count
        const updateQuery = `
          UPDATE playback_history
          SET times_played = times_played + 1
          WHERE id = $1
        `;
        const result = await this.pool.query(updateQuery, [existingCheck.rows[0].id]);
        logger.info(`Playback event updated: ${trackName} by ${artistName}`);
        return result.rows[0];
      }
      else {
        const query = `
          INSERT INTO playback_history 
          (track_id, track_name, artist_name, album_name, user_id) 
          VALUES ($1, $2, $3, $4, $5)
          RETURNING id
        `;

        const values = [
          trackId,
          trackName,
          artistName,
          albumName,
          userId
        ];

        const result = await this.pool.query(query, values);

        logger.info(`Playback event logged: ${trackName} by ${artistName}`);
        return result.rows[0];
      }

    } catch (error) {
      logger.error('Failed to log playback event:', error);
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

const axios = require('axios');
const cron = require('node-cron');
const logger = require('../utils/logger');

class SpotifyService {
  constructor() {
    this.clientId = process.env.SPOTIFY_CLIENT_ID;
    this.clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
    this.redirectUri = process.env.SPOTIFY_REDIRECT_URI;
    this.refreshToken = process.env.SPOTIFY_REFRESH_TOKEN;

    this.accessToken = null;
    this.tokenExpiry = null;
    this.baseURL = 'https://api.spotify.com/v1';

    // Device ID for playback control (will be set when user connects)
    this.activeDeviceId = null;
  }

  async initialize() {
    try {
      // Try to get client credentials token first (for bot functionality)
      await this.getClientCredentialsToken();
      this.scheduleTokenRefresh();
      logger.info('Spotify service initialized with client credentials token');
    } catch (error) {
      logger.error('Failed to initialize Spotify service with client credentials:', error);
      throw error;
    }
  }

  // Get access token using Client Credentials Flow (no user interaction required)
  async getClientCredentialsToken() {
    try {
      const response = await axios.post('https://accounts.spotify.com/api/token', {
        grant_type: 'client_credentials'
      }, {
        headers: {
          'Authorization': `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      this.accessToken = response.data.access_token;
      this.tokenExpiry = Date.now() + (response.data.expires_in * 1000);

      logger.info('Client credentials token obtained successfully');
      return this.accessToken;
    } catch (error) {
      logger.error('Failed to get client credentials token:', error.response?.data || error.message);
      throw error;
    }
  }

  // Get authorization URL for OAuth flow
  getAuthUrl() {
    const scopes = [
      'user-read-playback-state',
      'user-modify-playback-state',
      'user-read-currently-playing',
      'streaming',
      'playlist-read-private',
      'playlist-read-collaborative',
      'user-read-email',
      'user-read-private'
    ];

    const params = new URLSearchParams({
      client_id: this.clientId,
      response_type: 'code',
      redirect_uri: this.redirectUri,
      scope: scopes.join(' '),
      show_dialog: 'true'
    });

    return `https://accounts.spotify.com/authorize?${params.toString()}`;
  }

  // Exchange authorization code for tokens
  async exchangeCodeForTokens(code) {
    try {
      const response = await axios.post('https://accounts.spotify.com/api/token', {
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: this.redirectUri
      }, {
        headers: {
          'Authorization': `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      this.accessToken = response.data.access_token;
      this.refreshToken = response.data.refresh_token;
      this.tokenExpiry = Date.now() + (response.data.expires_in * 1000);

      logger.info('Successfully exchanged code for tokens');
      return {
        access_token: this.accessToken,
        refresh_token: this.refreshToken,
        expires_in: response.data.expires_in
      };
    } catch (error) {
      logger.error('Failed to exchange code for tokens:', error.response?.data || error.message);
      throw error;
    }
  }

  // Refresh access token
  async refreshAccessToken() {
    try {
      const response = await axios.post('https://accounts.spotify.com/api/token', {
        grant_type: 'refresh_token',
        refresh_token: this.refreshToken
      }, {
        headers: {
          'Authorization': `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      this.accessToken = response.data.access_token;
      this.tokenExpiry = Date.now() + (response.data.expires_in * 1000);

      logger.info('Access token refreshed successfully');
      return this.accessToken;
    } catch (error) {
      logger.error('Failed to refresh access token:', error.response?.data || error.message);
      throw error;
    }
  }

  // Schedule automatic token refresh
  scheduleTokenRefresh() {
    // Refresh client credentials token every 50 minutes (tokens expire in 1 hour)
    cron.schedule('*/50 * * * *', async () => {
      try {
        await this.getClientCredentialsToken();
        logger.info('Scheduled client credentials token refresh completed');
      } catch (error) {
        logger.error('Scheduled client credentials token refresh failed:', error);
      }
    });
  }

  // Get authenticated request headers
  getAuthHeaders() {
    if (!this.accessToken) {
      throw new Error('No access token available');
    }
    return {
      'Authorization': `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json'
    };
  }

  // Search for tracks, artists, or albums
  async search(query, type = 'track', limit = 20, offset = 0) {
    try {
      const response = await axios.get(`${this.baseURL}/search`, {
        headers: this.getAuthHeaders(),
        params: {
          q: query,
          type: type,
          limit: limit,
          offset: offset
        }
      });

      logger.info(`Search completed for query: "${query}"`);
      return response.data;
    } catch (error) {
      logger.error('Search failed:', error.response?.data || error.message);
      throw error;
    }
  }

  // Get available devices
  async getDevices() {
    try {
      const response = await this.makeRequest('GET', '/me/player/devices');
      return response.data.devices || [];
    } catch (error) {
      logger.error('Failed to get devices:', error.response?.data || error.message);
      throw error;
    }
  }

  // Set active device for playback
  async setActiveDevice(deviceId) {
    try {
      await this.makeRequest('PUT', '/me/player', {
        device_id: deviceId
      });
      this.activeDeviceId = deviceId;
      logger.info(`Active device set to: ${deviceId}`);
      return { success: true, deviceId };
    } catch (error) {
      logger.error('Failed to set active device:', error.response?.data || error.message);
      throw error;
    }
  }

  // Start playback
  async play(uris = null, deviceId = null) {
    try {
      const payload = {};
      if (uris) {
        payload.uris = uris;
      }

      const params = deviceId ? { device_id: deviceId } : {};

      await this.makeRequest('PUT', '/me/player/play', payload, params);
      logger.info('Playback started successfully');
      return { success: true, message: 'Playback started' };
    } catch (error) {
      logger.error('Failed to start playback:', error.response?.data || error.message);
      throw error;
    }
  }

  // Pause playback
  async pause(deviceId = null) {
    try {
      const params = deviceId ? { device_id: deviceId } : {};
      await this.makeRequest('PUT', '/me/player/pause', {}, params);
      logger.info('Playback paused successfully');
      return { success: true, message: 'Playback paused' };
    } catch (error) {
      logger.error('Failed to pause playback:', error.response?.data || error.message);
      throw error;
    }
  }

  // Skip to next track
  async next(deviceId = null) {
    try {
      const params = deviceId ? { device_id: deviceId } : {};
      await this.makeRequest('POST', '/me/player/next', {}, params);
      logger.info('Skipped to next track');
      return { success: true, message: 'Skipped to next track' };
    } catch (error) {
      logger.error('Failed to skip to next track:', error.response?.data || error.message);
      throw error;
    }
  }

  // Skip to previous track
  async previous(deviceId = null) {
    try {
      const params = deviceId ? { device_id: deviceId } : {};
      await this.makeRequest('POST', '/me/player/previous', {}, params);
      logger.info('Skipped to previous track');
      return { success: true, message: 'Skipped to previous track' };
    } catch (error) {
      logger.error('Failed to skip to previous track:', error.response?.data || error.message);
      throw error;
    }
  }

  // Get current playback state
  async getCurrentPlayback() {
    try {
      const response = await this.makeRequest('GET', '/me/player');
      return response.data;
    } catch (error) {
      logger.error('Failed to get current playback:', error.response?.data || error.message);
      throw error;
    }
  }

  // Set volume
  async setVolume(volumePercent, deviceId = null) {
    try {
      const params = { volume_percent: volumePercent };
      if (deviceId) {
        params.device_id = deviceId;
      }

      await this.makeRequest('PUT', '/me/player/volume', {}, params);
      logger.info(`Volume set to ${volumePercent}%`);
      return { success: true, volume: volumePercent };
    } catch (error) {
      logger.error('Failed to set volume:', error.response?.data || error.message);
      throw error;
    }
  }

  // Get track details
  async getTrack(trackId) {
    try {
      const response = await this.makeRequest('GET', `/tracks/${trackId}`);
      return response.data;
    } catch (error) {
      logger.error('Failed to get track details:', error.response?.data || error.message);
      throw error;
    }
  }

  // Get artist details
  async getArtist(artistId) {
    try {
      const response = await this.makeRequest('GET', `/artists/${artistId}`);
      return response.data;
    } catch (error) {
      logger.error('Failed to get artist details:', error.response?.data || error.message);
      throw error;
    }
  }

  // Get user profile
  async getUserProfile() {
    try {
      const response = await this.makeRequest('GET', '/me');
      return response.data;
    } catch (error) {
      logger.error('Failed to get user profile:', error.response?.data || error.message);
      throw error;
    }
  }

  // Check if token is valid
  isTokenValid() {
    return this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry;
  }

  // Get token information
  getTokenInfo() {
    return {
      hasToken: !!this.accessToken,
      isValid: this.isTokenValid(),
      expiresAt: this.tokenExpiry ? new Date(this.tokenExpiry).toISOString() : null,
      tokenType: this.refreshToken ? 'oauth' : 'client_credentials'
    };
  }

  // Make authenticated request to Spotify API
  async makeRequest(method, endpoint, data = null, params = {}) {
    if (!this.accessToken) {
      throw new Error('No access token available');
    }

    const config = {
      method,
      url: `${this.baseURL}${endpoint}`,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json'
      }
    };

    if (data) {
      config.data = data;
    }

    if (Object.keys(params).length > 0) {
      config.params = params;
    }
    console.log(config);
    return axios(config);
  }
}

module.exports = new SpotifyService();

const express = require('express');
const router = express.Router();
const spotifyService = require('../services/spotifyService');
const databaseService = require('../services/databaseService');
const logger = require('../utils/logger');

// Get bot token (Client Credentials Flow - no user interaction required)
router.get('/bot/token', async (req, res) => {
  try {
    const token = await spotifyService.getClientCredentialsToken();
    res.json({
      success: true,
      access_token: token,
      token_type: 'client_credentials',
      expires_in: 3600 // Client credentials tokens expire in 1 hour
    });
  } catch (error) {
    logger.error('Failed to get bot token:', error);
    res.status(500).json({ error: 'Failed to get bot token', details: error.message });
  }
});

// Get Spotify authorization URL (for user-specific features)
router.get('/spotify/url', (req, res) => {
  try {
    const authUrl = spotifyService.getAuthUrl();
    res.json({ authUrl });
  } catch (error) {
    logger.error('Failed to generate auth URL:', error);
    res.status(500).json({ error: 'Failed to generate authorization URL' });
  }
});

// Handle Spotify OAuth callback
router.get('/spotify/callback', async (req, res) => {
  try {
    const { code, error } = req.query;

    if (error) {
      logger.error('Spotify OAuth error:', error);
      return res.status(400).json({ error: 'Authorization failed', details: error });
    }

    if (!code) {
      return res.status(400).json({ error: 'Authorization code is required' });
    }

    // Exchange code for tokens
    const tokens = await spotifyService.exchangeCodeForTokens(code);

    // Get user profile
    const userProfile = await spotifyService.getUserProfile();

    // Log the authentication event
    await databaseService.logUserAction({
      userId: userProfile.id,
      actionType: 'spotify_auth',
      actionDetails: {
        email: userProfile.email,
        displayName: userProfile.display_name,
        country: userProfile.country
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      success: true,
      user: {
        id: userProfile.id,
        email: userProfile.email,
        displayName: userProfile.display_name,
        country: userProfile.country,
        image: userProfile.images?.[0]?.url
      },
      tokens: {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_in: tokens.expires_in
      }
    });

  } catch (error) {
    logger.error('Spotify callback error:', error);
    res.status(500).json({ error: 'Authentication failed', details: error.message });
  }
});

// Refresh access token
router.post('/spotify/refresh', async (req, res) => {
  try {
    const newToken = await spotifyService.refreshAccessToken();
    res.json({
      success: true,
      access_token: newToken
    });
  } catch (error) {
    logger.error('Token refresh failed:', error);
    res.status(500).json({ error: 'Token refresh failed', details: error.message });
  }
});

// Get bot status
router.get('/bot/status', (req, res) => {
  try {
    const tokenInfo = spotifyService.getTokenInfo();
    res.json({
      bot_active: tokenInfo.hasToken,
      token_valid: tokenInfo.isValid,
      expires_at: tokenInfo.expiresAt,
      token_type: 'client_credentials',
      capabilities: [
        'search_tracks',
        'search_artists',
        'search_albums',
        'get_track_details',
        'get_artist_details'
      ]
    });
  } catch (error) {
    logger.error('Failed to get bot status:', error);
    res.status(500).json({ error: 'Failed to get bot status' });
  }
});

// Get current authentication status
router.get('/spotify/status', (req, res) => {
  try {
    const tokenInfo = spotifyService.getTokenInfo();
    res.json({
      authenticated: tokenInfo.hasToken,
      tokenValid: tokenInfo.isValid,
      expiresAt: tokenInfo.expiresAt
    });
  } catch (error) {
    logger.error('Failed to get auth status:', error);
    res.status(500).json({ error: 'Failed to get authentication status' });
  }
});

// Get user profile
router.get('/spotify/profile', async (req, res) => {
  try {
    if (!spotifyService.isTokenValid()) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    const userProfile = await spotifyService.getUserProfile();
    res.json({
      id: userProfile.id,
      email: userProfile.email,
      displayName: userProfile.display_name,
      country: userProfile.country,
      image: userProfile.images?.[0]?.url,
      followers: userProfile.followers?.total,
      product: userProfile.product
    });
  } catch (error) {
    logger.error('Failed to get user profile:', error);
    res.status(500).json({ error: 'Failed to get user profile', details: error.message });
  }
});

// Logout (clear tokens)
router.post('/spotify/logout', async (req, res) => {
  try {
    // Log the logout event if we have user info
    if (spotifyService.isTokenValid()) {
      try {
        const userProfile = await spotifyService.getUserProfile();
        await databaseService.logUserAction({
          userId: userProfile.id,
          actionType: 'spotify_logout',
          actionDetails: { logoutMethod: 'manual' },
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        });
      } catch (profileError) {
        logger.warn('Could not log logout event:', profileError);
      }
    }

    // Clear tokens
    spotifyService.accessToken = null;
    spotifyService.tokenExpiry = null;
    spotifyService.activeDeviceId = null;

    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    logger.error('Logout failed:', error);
    res.status(500).json({ error: 'Logout failed', details: error.message });
  }
});

module.exports = router;

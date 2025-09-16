const express = require('express');
const router = express.Router();
const Joi = require('joi');
const spotifyService = require('../services/spotifyService');
const databaseService = require('../services/databaseService');
const logger = require('../utils/logger');

// Middleware to check if user is authenticated
const requireAuth = (req, res, next) => {
  if (!spotifyService.isTokenValid()) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
};

// Middleware to check if user has OAuth token (for user-specific features)
const requireOAuth = (req, res, next) => {
  if (!spotifyService.isTokenValid()) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  // For now, we'll allow both client credentials and OAuth tokens
  // In a more sophisticated setup, you'd check the token type
  next();
};

// Validation schemas
const searchSchema = Joi.object({
  query: Joi.string().min(1).max(100).required(),
  type: Joi.string().valid('track', 'artist', 'album', 'playlist').default('track'),
  limit: Joi.number().integer().min(1).max(50).default(20),
  offset: Joi.number().integer().min(0).default(0)
});

const playbackSchema = Joi.object({
  deviceId: Joi.string().optional(),
  uris: Joi.array().items(Joi.string()).optional()
});

// Search for tracks, artists, albums, or playlists
router.get('/search', requireAuth, async (req, res) => {
  try {
    const { error, value } = searchSchema.validate(req.query);
    if (error) {
      return res.status(400).json({ error: 'Invalid search parameters', details: error.details });
    }

    const { query, type, limit, offset } = value;
    const searchResults = await spotifyService.search(query, type, limit, offset);

    res.json(searchResults);
  } catch (error) {
    logger.error('Search failed:', error);
    res.status(500).json({ error: 'Search failed', details: error.message });
  }
});

// Get available devices
router.get('/devices', requireAuth, async (req, res) => {
  try {
    const devices = await spotifyService.getDevices();
    res.json({ devices });
  } catch (error) {
    logger.error('Failed to get devices:', error);
    res.status(500).json({ error: 'Failed to get devices', details: error.message });
  }
});

// Set active device
router.post('/devices/active', requireAuth, async (req, res) => {
  try {
    const { deviceId } = req.body;
    if (!deviceId) {
      return res.status(400).json({ error: 'Device ID is required' });
    }

    await spotifyService.setActiveDevice(deviceId);

    res.json({ success: true, message: 'Active device set successfully' });
  } catch (error) {
    logger.error('Failed to set active device:', error);
    res.status(500).json({ error: 'Failed to set active device', details: error.message });
  }
});

// Start playback
router.post('/play', requireAuth, async (req, res) => {
  try {
    const { error, value } = playbackSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: 'Invalid playback parameters', details: error.details });
    }

    const { deviceId, uris } = value;
    const result = await spotifyService.play(uris, deviceId);

    res.json(result);
  } catch (error) {
    logger.error('Failed to start playback:', error);
    res.status(500).json({ error: 'Failed to start playback', details: error.message });
  }
});

// Pause playback
router.post('/pause', requireAuth, async (req, res) => {
  try {
    const { deviceId } = req.body;
    const result = await spotifyService.pause(deviceId);

    res.json(result);
  } catch (error) {
    logger.error('Failed to pause playback:', error);
    res.status(500).json({ error: 'Failed to pause playback', details: error.message });
  }
});

// Skip to next track
router.post('/next', requireAuth, async (req, res) => {
  try {
    const { deviceId } = req.body;
    const result = await spotifyService.next(deviceId);

    res.json(result);
  } catch (error) {
    logger.error('Failed to skip to next track:', error);
    res.status(500).json({ error: 'Failed to skip to next track', details: error.message });
  }
});

// Skip to previous track
router.post('/previous', requireAuth, async (req, res) => {
  try {
    const { deviceId } = req.body;
    const result = await spotifyService.previous(deviceId);

    res.json(result);
  } catch (error) {
    logger.error('Failed to skip to previous track:', error);
    res.status(500).json({ error: 'Failed to skip to previous track', details: error.message });
  }
});

// Get current playback state
router.get('/playback', requireAuth, async (req, res) => {
  try {
    const playbackState = await spotifyService.getCurrentPlayback();
    res.json(playbackState);
  } catch (error) {
    logger.error('Failed to get current playback:', error);
    res.status(500).json({ error: 'Failed to get current playback', details: error.message });
  }
});

// Set volume
router.put('/volume', requireAuth, async (req, res) => {
  try {
    const { volumePercent, deviceId } = req.body;

    if (typeof volumePercent !== 'number' || volumePercent < 0 || volumePercent > 100) {
      return res.status(400).json({ error: 'Volume must be a number between 0 and 100' });
    }

    const result = await spotifyService.setVolume(volumePercent, deviceId);


    res.json(result);
  } catch (error) {
    logger.error('Failed to set volume:', error);
    res.status(500).json({ error: 'Failed to set volume', details: error.message });
  }
});

// Get track details
router.get('/tracks/:trackId', requireAuth, async (req, res) => {
  try {
    const { trackId } = req.params;
    const track = await spotifyService.getTrack(trackId);
    res.json(track);
  } catch (error) {
    logger.error('Failed to get track details:', error);
    res.status(500).json({ error: 'Failed to get track details', details: error.message });
  }
});

// Get artist details
router.get('/artists/:artistId', requireAuth, async (req, res) => {
  try {
    const { artistId } = req.params;
    const artist = await spotifyService.getArtist(artistId);
    res.json(artist);
  } catch (error) {
    logger.error('Failed to get artist details:', error);
    res.status(500).json({ error: 'Failed to get artist details', details: error.message });
  }
});

// Get track preview URL (30-second clip)
router.get('/tracks/:trackId/preview', requireAuth, async (req, res) => {
  try {
    const { trackId } = req.params;
    const track = await spotifyService.getTrack(trackId);

    if (!track.preview_url) {
      return res.status(404).json({
        error: 'No preview available for this track',
        message: 'Not all tracks have preview URLs available'
      });
    }

    res.json({
      track_id: trackId,
      track_name: track.name,
      artist: track.artists?.[0]?.name,
      preview_url: track.preview_url,
      duration_ms: track.duration_ms,
      message: 'This is a 30-second preview clip. Full playback requires user authentication.'
    });
  } catch (error) {
    logger.error('Failed to get track preview:', error);
    res.status(500).json({ error: 'Failed to get track preview', details: error.message });
  }
});

// Get track external URLs (Spotify app links)
router.get('/tracks/:trackId/links', requireAuth, async (req, res) => {
  try {
    const { trackId } = req.params;
    const track = await spotifyService.getTrack(trackId);

    const externalUrls = {
      spotify: track.external_urls?.spotify,
      track_id: trackId,
      track_name: track.name,
      artist: track.artists?.[0]?.name,
      album: track.album?.name,
      message: 'Use these links to open the track in Spotify app'
    };

    res.json(externalUrls);
  } catch (error) {
    logger.error('Failed to get track links:', error);
    res.status(500).json({ error: 'Failed to get track links', details: error.message });
  }
});

// Play specific track (requires OAuth - user authentication)
router.post('/tracks/:trackId/play', requireAuth, async (req, res) => {
  try {
    const { trackId } = req.params;
    const { deviceId } = req.body;

    const trackUri = `spotify:track:${trackId}`;
    const result = await spotifyService.play([trackUri], deviceId);

    res.json(result);
  } catch (error) {
    logger.error('Failed to play track:', error);
    res.status(500).json({ error: 'Failed to play track', details: error.message });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const Joi = require('joi');
const databaseService = require('../services/databaseService');
const logger = require('../utils/logger');

// Validation schemas
const analyticsFilterSchema = Joi.object({
  startDate: Joi.date().iso().optional(),
  endDate: Joi.date().iso().optional(),
  actionType: Joi.string().optional(),
  userId: Joi.string().optional(),
  limit: Joi.number().integer().min(1).max(1000).default(100),
  offset: Joi.number().integer().min(0).default(0)
});

const timeRangeSchema = Joi.object({
  days: Joi.number().integer().min(1).max(365).default(30),
  limit: Joi.number().integer().min(1).max(100).default(10)
});


router.post('/logplayback', async (req, res) => {
  try {
    const { track, userId } = req.body;
    // Log track play
    if (!track || !track.id) {
      return res.status(400).json({ error: 'Invalid track data' });
    }
    // Log playback event
    await databaseService.logPlaybackEvent({
      trackId: track.id,
      trackName: track.trackName,
      artistName: track.artistName,
      albumName: track.albumName,
      userId: userId
    });

    res.status(200).json({ message: 'Playback event logged' });

  } catch (logError) {
    logger.warn('Failed to log track play:', logError);
  }

});

/*

*/

// Get usage analytics with filters
router.get('/usage', async (req, res) => {
  try {
    const { error, value } = analyticsFilterSchema.validate(req.query);
    if (error) {
      return res.status(400).json({ error: 'Invalid filter parameters', details: error.details });
    }

    const analytics = await databaseService.getAnalytics(value);
    res.json({
      data: analytics,
      count: analytics.length,
      filters: value
    });
  } catch (error) {
    logger.error('Failed to get usage analytics:', error);
    res.status(500).json({ error: 'Failed to get usage analytics', details: error.message });
  }
});

// Get popular tracks
router.get('/popular/tracks', async (req, res) => {
  try {
    const { error, value } = timeRangeSchema.validate(req.query);
    if (error) {
      return res.status(400).json({ error: 'Invalid parameters', details: error.details });
    }

    const { days, limit } = value;
    const popularTracks = await databaseService.getPopularTracks(limit, days);

    res.json({
      data: popularTracks,
      count: popularTracks.length,
      timeRange: `${days} days`,
      limit
    });
  } catch (error) {
    logger.error('Failed to get popular tracks:', error);
    res.status(500).json({ error: 'Failed to get popular tracks', details: error.message });
  }
});

// Get popular artists
router.get('/popular/artists', async (req, res) => {
  try {
    const { error, value } = timeRangeSchema.validate(req.query);
    if (error) {
      return res.status(400).json({ error: 'Invalid parameters', details: error.details });
    }

    const { days, limit } = value;
    const popularArtists = await databaseService.getPopularArtists(limit, days);

    res.json({
      data: popularArtists,
      count: popularArtists.length,
      timeRange: `${days} days`,
      limit
    });
  } catch (error) {
    logger.error('Failed to get popular artists:', error);
    res.status(500).json({ error: 'Failed to get popular artists', details: error.message });
  }
});

// Get search analytics
router.get('/search', async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const searchAnalytics = await databaseService.getSearchAnalytics(parseInt(days));

    res.json({
      data: searchAnalytics,
      count: searchAnalytics.length,
      timeRange: `${days} days`
    });
  } catch (error) {
    logger.error('Failed to get search analytics:', error);
    res.status(500).json({ error: 'Failed to get search analytics', details: error.message });
  }
});

// Get user session statistics
router.get('/sessions', async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const sessionStats = await databaseService.getUserSessionStats(parseInt(days));

    res.json({
      data: sessionStats,
      timeRange: `${days} days`
    });
  } catch (error) {
    logger.error('Failed to get session statistics:', error);
    res.status(500).json({ error: 'Failed to get session statistics', details: error.message });
  }
});

// Get action type breakdown
router.get('/actions/breakdown', async (req, res) => {
  try {
    const { days = 30 } = req.query;

    // This would need to be implemented in the database service
    // For now, we'll get all analytics and group them
    const analytics = await databaseService.getAnalytics({
      startDate: new Date(Date.now() - parseInt(days) * 24 * 60 * 60 * 1000).toISOString(),
      limit: 10000 // Get a large number to ensure we have all data
    });

    // Group by action type
    const actionBreakdown = analytics.reduce((acc, item) => {
      const actionType = item.action_type;
      if (!acc[actionType]) {
        acc[actionType] = 0;
      }
      acc[actionType]++;
      return acc;
    }, {});

    // Convert to array format
    const breakdownArray = Object.entries(actionBreakdown).map(([action, count]) => ({
      action_type: action,
      count: count
    })).sort((a, b) => b.count - a.count);

    res.json({
      data: breakdownArray,
      total: analytics.length,
      timeRange: `${days} days`
    });
  } catch (error) {
    logger.error('Failed to get action breakdown:', error);
    res.status(500).json({ error: 'Failed to get action breakdown', details: error.message });
  }
});

// Get hourly activity distribution
router.get('/activity/hourly', async (req, res) => {
  try {
    const { days = 7 } = req.query;

    // This would need a more sophisticated query in the database service
    // For now, we'll get recent analytics and group by hour
    const analytics = await databaseService.getAnalytics({
      startDate: new Date(Date.now() - parseInt(days) * 24 * 60 * 60 * 1000).toISOString(),
      limit: 10000
    });

    // Group by hour
    const hourlyActivity = new Array(24).fill(0);
    analytics.forEach(item => {
      const hour = new Date(item.timestamp).getHours();
      hourlyActivity[hour]++;
    });

    const hourlyData = hourlyActivity.map((count, hour) => ({
      hour: hour,
      count: count,
      percentage: analytics.length > 0 ? ((count / analytics.length) * 100).toFixed(2) : 0
    }));

    res.json({
      data: hourlyData,
      total: analytics.length,
      timeRange: `${days} days`
    });
  } catch (error) {
    logger.error('Failed to get hourly activity:', error);
    res.status(500).json({ error: 'Failed to get hourly activity', details: error.message });
  }
});

// Get user activity summary
router.get('/users/summary', async (req, res) => {
  try {
    const { days = 30 } = req.query;

    const analytics = await databaseService.getAnalytics({
      startDate: new Date(Date.now() - parseInt(days) * 24 * 60 * 60 * 1000).toISOString(),
      limit: 10000
    });

    // Get unique users
    const uniqueUsers = new Set(analytics.filter(item => item.user_id).map(item => item.user_id));

    // Get most active users
    const userActivity = analytics.reduce((acc, item) => {
      if (item.user_id) {
        if (!acc[item.user_id]) {
          acc[item.user_id] = 0;
        }
        acc[item.user_id]++;
      }
      return acc;
    }, {});

    const mostActiveUsers = Object.entries(userActivity)
      .map(([userId, count]) => ({ user_id: userId, action_count: count }))
      .sort((a, b) => b.action_count - a.action_count)
      .slice(0, 10);

    res.json({
      data: {
        total_actions: analytics.length,
        unique_users: uniqueUsers.size,
        most_active_users: mostActiveUsers,
        average_actions_per_user: uniqueUsers.size > 0 ? (analytics.length / uniqueUsers.size).toFixed(2) : 0
      },
      timeRange: `${days} days`
    });
  } catch (error) {
    logger.error('Failed to get user summary:', error);
    res.status(500).json({ error: 'Failed to get user summary', details: error.message });
  }
});

// Get database health status
router.get('/health', async (req, res) => {
  try {
    const healthStatus = await databaseService.healthCheck();
    res.json(healthStatus);
  } catch (error) {
    logger.error('Failed to get database health:', error);
    res.status(500).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Export analytics data (for admin purposes)
router.get('/export', async (req, res) => {
  try {
    const { format = 'json', days = 30 } = req.query;

    if (!['json', 'csv'].includes(format)) {
      return res.status(400).json({ error: 'Invalid format. Use "json" or "csv"' });
    }

    const analytics = await databaseService.getAnalytics({
      startDate: new Date(Date.now() - parseInt(days) * 24 * 60 * 60 * 1000).toISOString(),
      limit: 10000
    });

    if (format === 'csv') {
      // Convert to CSV format
      const csvHeaders = ['id', 'user_id', 'action_type', 'timestamp', 'search_query', 'device_id'];
      const csvData = analytics.map(item => [
        item.id,
        item.user_id || '',
        item.action_type,
        item.timestamp,
        item.search_query || '',
        item.device_id || ''
      ]);

      const csvContent = [csvHeaders, ...csvData]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="analytics-${days}days.csv"`);
      res.send(csvContent);
    } else {
      res.json({
        data: analytics,
        count: analytics.length,
        timeRange: `${days} days`,
        exportedAt: new Date().toISOString()
      });
    }
  } catch (error) {
    logger.error('Failed to export analytics:', error);
    res.status(500).json({ error: 'Failed to export analytics', details: error.message });
  }
});

module.exports = router;

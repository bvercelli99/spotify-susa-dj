# Spotify DJ Bot Backend

A comprehensive Node.js backend for the Spotify DJ Bot application that provides Spotify API integration, playback controls, and analytics tracking.

## Features

- 🤖 **Bot Mode (Client Credentials)** - Automatic token generation without user interaction
- 🔐 **Spotify OAuth Authentication** - Optional user authentication for advanced features
- 🎵 **Music Search & Playback** - Search tracks, artists, albums and control playback
- 📊 **Analytics & Usage Tracking** - Comprehensive user behavior analytics (optional)
- 🗄️ **PostgreSQL Database** - Robust data storage for analytics and user sessions (optional)
- 🔄 **Automatic Token Refresh** - Scheduled token refresh every 50 minutes
- 🛡️ **Security Features** - Rate limiting, CORS, input validation
- 📝 **Structured Logging** - Winston-based logging with file rotation

## Prerequisites

- Node.js 18+ 
- PostgreSQL 12+
- Spotify Developer Account
- npm or yarn

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
cd backend
npm install
```

### 2. Environment Configuration

Copy the environment example file and configure your settings:

```bash
cp env.example .env
```

Edit `.env` with your configuration:

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Spotify API Configuration
SPOTIFY_CLIENT_ID=your_spotify_client_id_here
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret_here
SPOTIFY_REDIRECT_URI=http://127.0.0.1:3001/api/auth/spotify/callback
SPOTIFY_REFRESH_TOKEN=your_spotify_refresh_token_here

# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/spotify_dj_db
DB_HOST=localhost
DB_PORT=5432
DB_NAME=spotify_dj_db
DB_USER=username
DB_PASSWORD=password

# JWT Configuration
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=24h

# Logging
LOG_LEVEL=info

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 3. Spotify API Setup

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Create a new application
3. Copy Client ID and Client Secret to your `.env` file
4. **For Bot Mode**: No additional setup required - the app will auto-generate tokens
5. **For User Features**: Add `http://127.0.0.1:3001/api/auth/spotify/callback` to Redirect URIs

### 4. Database Setup

1. Create a PostgreSQL database:
```sql
CREATE DATABASE spotify_dj_db;
```

2. The application will automatically create tables on startup, or run manually:
```bash
npm run migrate
```

### 5. Start the Application

```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:3001`

## API Endpoints

### Bot Authentication (No User Interaction Required)

#### GET `/api/auth/bot/token`
Get a bot access token using Client Credentials Flow.

**Response:**
```json
{
  "success": true,
  "access_token": "bot_access_token_here",
  "token_type": "client_credentials",
  "expires_in": 3600
}
```

#### GET `/api/auth/bot/status`
Get bot status and capabilities.

**Response:**
```json
{
  "bot_active": true,
  "token_valid": true,
  "expires_at": "2024-01-01T12:00:00.000Z",
  "token_type": "client_credentials",
  "capabilities": [
    "search_tracks",
    "search_artists",
    "search_albums",
    "get_track_details",
    "get_artist_details"
  ]
}
```

### User Authentication (Optional - for advanced features)

#### GET `/api/auth/spotify/url`
Get Spotify authorization URL for OAuth flow.

**Response:**
```json
{
  "authUrl": "https://accounts.spotify.com/authorize?..."
}
```

#### GET `/api/auth/spotify/callback`
Handle Spotify OAuth callback.

**Query Parameters:**
- `code` - Authorization code from Spotify
- `error` - Error message (if any)

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "spotify_user_id",
    "email": "user@example.com",
    "displayName": "User Name",
    "country": "US",
    "image": "https://..."
  },
  "tokens": {
    "access_token": "...",
    "refresh_token": "...",
    "expires_in": 3600
  }
}
```

#### POST `/api/auth/spotify/refresh`
Refresh access token.

**Response:**
```json
{
  "success": true,
  "access_token": "new_access_token"
}
```

#### GET `/api/auth/spotify/status`
Get current authentication status.

**Response:**
```json
{
  "authenticated": true,
  "tokenValid": true,
  "expiresAt": "2024-01-01T12:00:00.000Z"
}
```

#### GET `/api/auth/spotify/profile`
Get user profile information.

**Response:**
```json
{
  "id": "spotify_user_id",
  "email": "user@example.com",
  "displayName": "User Name",
  "country": "US",
  "image": "https://...",
  "followers": 100,
  "product": "premium"
}
```

### Spotify API

#### GET `/api/spotify/search`
Search for tracks, artists, albums, or playlists.

**Query Parameters:**
- `query` (required) - Search query string
- `type` - Search type: `track`, `artist`, `album`, `playlist` (default: `track`)
- `limit` - Number of results (1-50, default: 20)
- `offset` - Offset for pagination (default: 0)

**Response:**
```json
{
  "tracks": {
    "items": [
      {
        "id": "track_id",
        "name": "Track Name",
        "artists": [{"name": "Artist Name"}],
        "album": {"name": "Album Name"}
      }
    ]
  }
}
```

#### GET `/api/spotify/devices`
Get available playback devices.

**Response:**
```json
{
  "devices": [
    {
      "id": "device_id",
      "name": "Device Name",
      "type": "Computer",
      "is_active": true
    }
  ]
}
```

#### POST `/api/spotify/devices/active`
Set active playback device.

**Body:**
```json
{
  "deviceId": "device_id"
}
```

#### POST `/api/spotify/play`
Start playback.

**Body:**
```json
{
  "deviceId": "device_id",
  "uris": ["spotify:track:track_id"]
}
```

#### POST `/api/spotify/pause`
Pause playback.

**Body:**
```json
{
  "deviceId": "device_id"
}
```

#### POST `/api/spotify/next`
Skip to next track.

**Body:**
```json
{
  "deviceId": "device_id"
}
```

#### POST `/api/spotify/previous`
Skip to previous track.

**Body:**
```json
{
  "deviceId": "device_id"
}
```

#### GET `/api/spotify/playback`
Get current playback state.

**Response:**
```json
{
  "is_playing": true,
  "item": {
    "id": "track_id",
    "name": "Track Name",
    "artists": [{"name": "Artist Name"}]
  },
  "progress_ms": 30000,
  "device": {
    "id": "device_id",
    "name": "Device Name"
  }
}
```

#### PUT `/api/spotify/volume`
Set playback volume.

**Body:**
```json
{
  "volumePercent": 50,
  "deviceId": "device_id"
}
```

#### POST `/api/spotify/tracks/:trackId/play`
Play a specific track.

**Body:**
```json
{
  "deviceId": "device_id"
}
```

### Analytics

#### GET `/api/analytics/usage`
Get usage analytics with filters.

**Query Parameters:**
- `startDate` - Start date (ISO format)
- `endDate` - End date (ISO format)
- `actionType` - Filter by action type
- `userId` - Filter by user ID
- `limit` - Number of results (1-1000, default: 100)
- `offset` - Offset for pagination (default: 0)

#### GET `/api/analytics/popular/tracks`
Get popular tracks.

**Query Parameters:**
- `days` - Time range in days (1-365, default: 30)
- `limit` - Number of results (1-100, default: 10)

#### GET `/api/analytics/popular/artists`
Get popular artists.

**Query Parameters:**
- `days` - Time range in days (1-365, default: 30)
- `limit` - Number of results (1-100, default: 10)

#### GET `/api/analytics/search`
Get search analytics.

**Query Parameters:**
- `days` - Time range in days (default: 30)

#### GET `/api/analytics/sessions`
Get user session statistics.

**Query Parameters:**
- `days` - Time range in days (default: 30)

#### GET `/api/analytics/actions/breakdown`
Get action type breakdown.

**Query Parameters:**
- `days` - Time range in days (default: 30)

#### GET `/api/analytics/activity/hourly`
Get hourly activity distribution.

**Query Parameters:**
- `days` - Time range in days (default: 7)

#### GET `/api/analytics/users/summary`
Get user activity summary.

**Query Parameters:**
- `days` - Time range in days (default: 30)

#### GET `/api/analytics/export`
Export analytics data.

**Query Parameters:**
- `format` - Export format: `json` or `csv` (default: `json`)
- `days` - Time range in days (default: 30)

## Database Schema

### usage_analytics
Tracks user actions and interactions.

```sql
CREATE TABLE usage_analytics (
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
);
```

### user_sessions
Tracks user session information.

```sql
CREATE TABLE user_sessions (
  id SERIAL PRIMARY KEY,
  session_id VARCHAR(255) UNIQUE NOT NULL,
  user_id VARCHAR(255),
  spotify_user_id VARCHAR(255),
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ended_at TIMESTAMP,
  device_info JSONB,
  ip_address INET
);
```

### playback_history
Tracks playback events.

```sql
CREATE TABLE playback_history (
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
);
```

## Development

### Scripts

```bash
# Start development server
npm run dev

# Start production server
npm start

# Run tests
npm test

# Lint code
npm run lint

# Run database migrations
npm run migrate
```

### Project Structure

```
backend/
├── src/
│   ├── routes/
│   │   ├── auth.js          # Authentication routes
│   │   ├── spotify.js       # Spotify API routes
│   │   └── analytics.js     # Analytics routes
│   ├── services/
│   │   ├── spotifyService.js    # Spotify API integration
│   │   └── databaseService.js   # Database operations
│   ├── utils/
│   │   └── logger.js        # Winston logger configuration
│   └── server.js            # Main server file
├── logs/                    # Log files (auto-created)
├── package.json
├── env.example
└── README.md
```

### Logging

The application uses Winston for structured logging. Logs are written to:
- `logs/combined.log` - All logs
- `logs/error.log` - Error logs only
- Console (development mode)

### Error Handling

All endpoints include comprehensive error handling with:
- Input validation using Joi
- Proper HTTP status codes
- Detailed error messages
- Structured logging

### Security Features

- Rate limiting (100 requests per 15 minutes per IP)
- CORS protection
- Input validation and sanitization
- Helmet security headers
- Secure token management

## Production Deployment

### Environment Variables

For production, ensure all environment variables are properly set:

```env
NODE_ENV=production
PORT=3001
SPOTIFY_CLIENT_ID=your_production_client_id
SPOTIFY_CLIENT_SECRET=your_production_client_secret
SPOTIFY_REDIRECT_URI=https://yourdomain.com/auth/spotify/callback
DATABASE_URL=postgresql://user:pass@host:port/db
JWT_SECRET=your_secure_jwt_secret
```

### Database

Ensure your PostgreSQL database is properly configured for production:
- Enable SSL connections
- Set appropriate connection limits
- Configure backup strategies
- Monitor performance

### Process Management

Use a process manager like PM2:

```bash
npm install -g pm2
pm2 start src/server.js --name "spotify-dj-backend"
pm2 save
pm2 startup
```

## Troubleshooting

### Common Issues

1. **Spotify API Errors**
   - Check client ID and secret
   - Verify redirect URI matches exactly
   - Ensure refresh token is valid

2. **Database Connection Issues**
   - Verify database credentials
   - Check PostgreSQL is running
   - Ensure database exists

3. **Token Refresh Failures**
   - Check refresh token validity
   - Verify client credentials
   - Monitor logs for specific errors

### Health Checks

- Server health: `GET /health`
- Database health: `GET /api/analytics/health`
- Spotify auth status: `GET /api/auth/spotify/status`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

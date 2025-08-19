# 🎵 Server-Side Spotify Playback Setup Guide

## Overview

This guide will help you set up your server/device to play Spotify tracks directly through the backend. This requires OAuth authentication and a Spotify Premium account.

## Prerequisites

### 1. Spotify Premium Account
- **Required**: Spotify Premium subscription
- **Why**: Free accounts cannot control playback via API

### 2. Server Audio Setup
- **Audio Output**: Server must have audio capabilities
- **Speakers/Headphones**: Connected to the server
- **Volume Control**: Accessible from the server

### 3. Spotify App Installation
- **Desktop App**: Install Spotify on the server
- **Login**: Use the same account for OAuth
- **Active Session**: Keep Spotify app running

## Setup Steps

### Step 1: Configure Environment Variables

Update your `.env` file:

```env
# Spotify API Configuration
SPOTIFY_CLIENT_ID=your_spotify_client_id_here
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret_here
SPOTIFY_REDIRECT_URI=http://127.0.0.1:3001/api/auth/spotify/callback
SPOTIFY_REFRESH_TOKEN=  # Leave empty initially

# Enable OAuth mode
SPOTIFY_OAUTH_MODE=true
```

### Step 2: Spotify Developer Dashboard Setup

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Select your app
3. Add redirect URI: `http://127.0.0.1:3001/api/auth/spotify/callback`
4. Note your Client ID and Client Secret

### Step 3: Authenticate Your Server

1. **Start the server**:
   ```bash
   npm run dev
   ```

2. **Get authorization URL**:
   ```bash
   curl http://127.0.0.1:3001/api/auth/spotify/url
   ```

3. **Open the URL** in a browser on your server (or any device)
4. **Login with your Spotify Premium account**
5. **Authorize the application**
6. **Copy the authorization code** from the callback URL

### Step 4: Complete Authentication

1. **Exchange code for tokens**:
   ```bash
   curl -X GET "http://127.0.0.1:3001/api/auth/spotify/callback?code=YOUR_AUTH_CODE"
   ```

2. **Save the refresh token** to your `.env` file:
   ```env
   SPOTIFY_REFRESH_TOKEN=your_refresh_token_here
   ```

### Step 5: Verify Server Setup

1. **Check authentication status**:
   ```bash
   curl http://127.0.0.1:3001/api/auth/spotify/status
   ```

2. **Get available devices**:
   ```bash
   curl http://127.0.0.1:3001/api/spotify/devices
   ```

3. **Test playback**:
   ```bash
   # Search for a track
   curl "http://127.0.0.1:3001/api/spotify/search?query=Bohemian%20Rhapsody&type=track&limit=1"
   
   # Play the track (replace TRACK_ID with actual ID)
   curl -X POST "http://127.0.0.1:3001/api/spotify/tracks/TRACK_ID/play" \
     -H "Content-Type: application/json" \
     -d '{"deviceId": "YOUR_DEVICE_ID"}'
   ```

## Device Management

### Finding Your Server Device

1. **List all devices**:
   ```bash
   curl http://127.0.0.1:3001/api/spotify/devices
   ```

2. **Look for your server** in the device list:
   ```json
   {
     "devices": [
       {
         "id": "your_server_device_id",
         "name": "Your Server Name",
         "type": "Computer",
         "is_active": true
       }
     ]
   }
   ```

### Setting Active Device

```bash
curl -X POST "http://localhost:3001/api/spotify/devices/active" \
  -H "Content-Type: application/json" \
  -d '{"deviceId": "your_server_device_id"}'
```

## Playback Controls

### Basic Playback Commands

```bash
# Play a specific track
curl -X POST "http://localhost:3001/api/spotify/tracks/TRACK_ID/play" \
  -H "Content-Type: application/json" \
  -d '{"deviceId": "your_device_id"}'

# Pause playback
curl -X POST "http://localhost:3001/api/spotify/pause" \
  -H "Content-Type: application/json" \
  -d '{"deviceId": "your_device_id"}'

# Resume playback
curl -X POST "http://localhost:3001/api/spotify/play" \
  -H "Content-Type: application/json" \
  -d '{"deviceId": "your_device_id"}'

# Next track
curl -X POST "http://localhost:3001/api/spotify/next" \
  -H "Content-Type: application/json" \
  -d '{"deviceId": "your_device_id"}'

# Previous track
curl -X POST "http://localhost:3001/api/spotify/previous" \
  -H "Content-Type: application/json" \
  -d '{"deviceId": "your_device_id"}'

# Set volume (0-100)
curl -X PUT "http://localhost:3001/api/spotify/volume" \
  -H "Content-Type: application/json" \
  -d '{"volumePercent": 50, "deviceId": "your_device_id"}'
```

### Get Current Playback State

```bash
curl http://localhost:3001/api/spotify/playback
```

## Troubleshooting

### Common Issues

1. **"No active device" error**
   - Make sure Spotify app is running on the server
   - Check that your server appears in the devices list
   - Set the server as the active device

2. **"Premium required" error**
   - Ensure you're using a Spotify Premium account
   - Free accounts cannot control playback

3. **"Token expired" error**
   - The refresh token should automatically renew
   - If not, re-authenticate using the OAuth flow

4. **No audio output**
   - Check server audio settings
   - Ensure speakers/headphones are connected
   - Verify volume is not muted

### Debug Commands

```bash
# Check token status
curl http://localhost:3001/api/auth/spotify/status

# Check available devices
curl http://localhost:3001/api/spotify/devices

# Check current playback
curl http://localhost:3001/api/spotify/playback

# Test with a simple search
curl "http://localhost:3001/api/spotify/search?query=test&type=track&limit=1"
```

## Security Considerations

1. **Keep refresh tokens secure** - Don't commit them to version control
2. **Use HTTPS in production** - Always use HTTPS for OAuth callbacks
3. **Monitor usage** - Track API usage to avoid rate limits
4. **Regular token refresh** - The system automatically refreshes tokens

## Production Deployment

For production deployment:

1. **Update redirect URI** to your production domain
2. **Use environment variables** for all sensitive data
3. **Enable HTTPS** for secure OAuth flow
4. **Set up monitoring** for token refresh and playback status
5. **Configure logging** for debugging playback issues

## Example Integration

Here's how to integrate server playback into your application:

```javascript
// Search and play a track
async function searchAndPlay(query) {
  try {
    // 1. Search for the track
    const searchResponse = await fetch(`/api/spotify/search?query=${encodeURIComponent(query)}&type=track&limit=1`);
    const searchData = await searchResponse.json();
    
    if (searchData.tracks?.items?.length > 0) {
      const track = searchData.tracks.items[0];
      
      // 2. Play the track
      const playResponse = await fetch(`/api/spotify/tracks/${track.id}/play`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId: 'your_server_device_id' })
      });
      
      const playData = await playResponse.json();
      console.log('Now playing:', track.name);
      return playData;
    }
  } catch (error) {
    console.error('Playback failed:', error);
  }
}

// Usage
searchAndPlay('Bohemian Rhapsody');
```

This setup allows your server to act as a Spotify DJ, playing music directly through the server's audio output!

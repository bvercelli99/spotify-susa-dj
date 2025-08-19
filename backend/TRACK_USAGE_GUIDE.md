# 🎵 Spotify Track ID Usage Guide

## What You CAN Do with Track IDs

### 1. 📊 Get Track Information
```bash
GET /api/spotify/tracks/{trackId}
```
Returns detailed track metadata:
- Track name, artist, album
- Duration, release date
- Popularity score
- Album artwork
- Genre information

### 2. 🎧 Get Preview URL (30-second clip)
```bash
GET /api/spotify/tracks/{trackId}/preview
```
Returns a 30-second preview URL (if available):
```json
{
  "track_id": "4iV5W9uYEdYUVa79Axb7Rh",
  "track_name": "Bohemian Rhapsody",
  "artist": "Queen",
  "preview_url": "https://p.scdn.co/mp3-preview/...",
  "duration_ms": 354000,
  "message": "This is a 30-second preview clip. Full playback requires user authentication."
}
```

### 3. 🔗 Get Spotify App Links
```bash
GET /api/spotify/tracks/{trackId}/links
```
Returns links to open the track in Spotify app:
```json
{
  "spotify": "https://open.spotify.com/track/4iV5W9uYEdYUVa79Axb7Rh",
  "track_id": "4iV5W9uYEdYUVa79Axb7Rh",
  "track_name": "Bohemian Rhapsody",
  "artist": "Queen",
  "album": "A Night At The Opera",
  "message": "Use these links to open the track in Spotify app"
}
```

## What You CANNOT Do with Track IDs

### ❌ Download Tracks
**Spotify does not allow downloading** of tracks through their API. This is a copyright protection measure.

### ❌ Play Tracks (with Client Credentials)
**Cannot play tracks** using the bot's Client Credentials token. Playback requires:
- User authentication (OAuth)
- Active Spotify device
- User's Spotify account

## 🔐 How to Enable Playback (Requires OAuth)

To enable track playback, you need to implement user authentication:

### 1. Set up OAuth Flow
```bash
# Get authorization URL
GET /api/auth/spotify/url

# Handle callback
GET /api/auth/spotify/callback?code={authorization_code}
```

### 2. Play Track (with OAuth token)
```bash
POST /api/spotify/tracks/{trackId}/play
Content-Type: application/json

{
  "deviceId": "your_device_id"
}
```

## 🎯 Practical Examples

### Example 1: Search and Get Track Info
```javascript
// 1. Search for a track
const searchResponse = await axios.get('/api/spotify/search', {
  params: { query: 'Bohemian Rhapsody', type: 'track', limit: 1 }
});

const trackId = searchResponse.data[0].id;

// 2. Get detailed info
const trackInfo = await axios.get(`/api/spotify/tracks/${trackId}`);

// 3. Get preview URL
const preview = await axios.get(`/api/spotify/tracks/${trackId}/preview`);

// 4. Get Spotify app link
const links = await axios.get(`/api/spotify/tracks/${trackId}/links`);
```

### Example 2: Create a Track Card
```javascript
const trackCard = {
  id: trackInfo.data.id,
  name: trackInfo.data.name,
  artist: trackInfo.data.artists[0].name,
  album: trackInfo.data.album.name,
  duration: Math.round(trackInfo.data.duration_ms / 1000),
  albumArt: trackInfo.data.album.images[0].url,
  previewUrl: preview.data.preview_url,
  spotifyLink: links.data.spotify,
  popularity: trackInfo.data.popularity
};
```

## 🚀 Alternative Solutions

### For Preview Playback
- Use the `preview_url` to play 30-second clips
- Embed in HTML5 audio elements
- Works without user authentication

### For Full Playback
- Redirect users to Spotify app using the external URL
- Implement OAuth for full playback control
- Use Spotify Web Playback SDK for web apps

### For Offline Access
- Spotify Premium allows offline downloads (app-only)
- No API access to downloaded content
- Users must use Spotify app for offline playback

## 📋 API Endpoints Summary

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/spotify/tracks/{id}` | GET | Track details | Bot Token |
| `/api/spotify/tracks/{id}/preview` | GET | Preview URL | Bot Token |
| `/api/spotify/tracks/{id}/links` | GET | External links | Bot Token |
| `/api/spotify/tracks/{id}/play` | POST | Play track | OAuth Token |

## 🔍 Testing Your Implementation

Run the test script to see all capabilities:
```bash
npm run test-bot
```

This will demonstrate:
- ✅ Track search and metadata retrieval
- ✅ Preview URL access
- ✅ External link generation
- ❌ Full playback (requires OAuth)
- ❌ Download functionality (not available)


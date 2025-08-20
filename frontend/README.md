# DJ Bot Frontend

A React-based frontend for the DJ Bot application with Spotify OAuth integration.

## Features

- **OAuth Authentication**: Secure Spotify authentication flow
- **User Profile Display**: Shows authenticated user information
- **Music Search**: Search for songs, artists, and albums
- **Playlist Management**: Add songs to upcoming playlist
- **Responsive Design**: Works on desktop and mobile devices

## Authentication Flow

The application implements a complete OAuth 2.0 flow with Spotify:

1. **App Load**: On initial load, the app checks authentication status via `/auth/spotify/status`
2. **Login Prompt**: If not authenticated, shows a login screen with Spotify connect button
3. **OAuth Flow**: Clicking "Connect with Spotify" opens a popup window with Spotify's authorization URL
4. **Callback Handling**: After user authorizes, the popup window closes and the main app updates
5. **User Display**: Shows user profile information and logout option when authenticated

## Components

- **AuthProvider**: Context provider for authentication state management
- **AuthGuard**: Component that protects routes and shows login screen when not authenticated
- **UserHeader**: Displays user information and logout button
- **App**: Main application component with music search and playback controls

## API Endpoints Used

- `GET /auth/spotify/status` - Check authentication status
- `GET /auth/spotify/url` - Get Spotify authorization URL
- `GET /auth/spotify/profile` - Get user profile information
- `POST /auth/spotify/logout` - Logout user
- `GET /api/spotify/search` - Search for music

## Development

```bash
# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build
```

## Environment

Make sure your backend server is running on `http://localhost:3001` for the API calls to work properly.

## OAuth Configuration

The OAuth flow requires proper configuration in your Spotify Developer Dashboard:

1. Set the redirect URI to `http://localhost:3000/callback.html`
2. Ensure the required scopes are configured in your backend
3. Make sure your backend is properly handling the OAuth callback

## File Structure

```
src/
├── components/
│   ├── AuthGuard.tsx      # Authentication guard component
│   └── UserHeader.tsx     # User profile display
├── contexts/
│   └── AuthContext.tsx    # Authentication context provider
├── models/
│   └── Song.ts           # Song data model
├── utils/
│   └── utilities.tsx     # Utility functions
└── App.tsx               # Main application component
```

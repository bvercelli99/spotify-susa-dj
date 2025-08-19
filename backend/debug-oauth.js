#!/usr/bin/env node

require('dotenv').config();

console.log('🔍 Spotify OAuth Configuration Debug\n');

// Check environment variables
console.log('📋 Environment Variables:');
console.log(`SPOTIFY_CLIENT_ID: ${process.env.SPOTIFY_CLIENT_ID ? '✅ Set' : '❌ Missing'}`);
console.log(`SPOTIFY_CLIENT_SECRET: ${process.env.SPOTIFY_CLIENT_SECRET ? '✅ Set' : '❌ Missing'}`);
console.log(`SPOTIFY_REDIRECT_URI: ${process.env.SPOTIFY_REDIRECT_URI || '❌ Missing'}`);
console.log('');

// Show the exact redirect URI being used
const redirectUri = process.env.SPOTIFY_REDIRECT_URI || 'http://127.0.0.1:3001/api/auth/spotify/callback';
console.log('🎯 Redirect URI being used:');
console.log(`   ${redirectUri}`);
console.log('');

// Generate the auth URL to show what's being sent to Spotify
if (process.env.SPOTIFY_CLIENT_ID) {
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
    client_id: process.env.SPOTIFY_CLIENT_ID,
    response_type: 'code',
    redirect_uri: redirectUri,
    scope: scopes.join(' '),
    show_dialog: 'true'
  });

  const authUrl = `https://accounts.spotify.com/authorize?${params.toString()}`;

  console.log('🔗 Generated Authorization URL:');
  console.log(`   ${authUrl}`);
  console.log('');

  console.log('📝 URL Parameters:');
  console.log(`   client_id: ${process.env.SPOTIFY_CLIENT_ID}`);
  console.log(`   redirect_uri: ${redirectUri}`);
  console.log(`   scope: ${scopes.join(' ')}`);
  console.log('');
}

console.log('🔧 Troubleshooting Steps:');
console.log('');
console.log('1. ✅ Check Spotify Developer Dashboard:');
console.log('   - Go to https://developer.spotify.com/dashboard');
console.log('   - Select your app');
console.log('   - Go to "Settings"');
console.log('   - Under "Redirect URIs", add exactly:');
console.log(`     ${redirectUri}`);
console.log('   - Click "Save"');
console.log('');
console.log('2. ✅ Verify the redirect URI matches exactly:');
console.log('   - No extra spaces');
console.log('   - Correct protocol (http vs https)');
console.log('   - Correct port number');
console.log('   - Correct path (/api/auth/spotify/callback)');
console.log('');
console.log('3. ✅ Common issues:');
console.log('   - Trailing slashes (should not have one)');
console.log('   - Wrong port number');
console.log('   - Missing /api prefix');
console.log('   - Using https instead of http for localhost');
console.log('');
console.log('4. ✅ After fixing in Dashboard:');
console.log('   - Wait 1-2 minutes for changes to propagate');
console.log('   - Try the setup again: npm run setup-oauth');
console.log('');

// Check if server is running
const axios = require('axios');
const BASE_URL = 'http://127.0.0.1:3001';

async function checkServer() {
  try {
    console.log('🌐 Checking if server is running...');
    const response = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Server is running');

    // Test the auth URL endpoint
    try {
      const authResponse = await axios.get(`${BASE_URL}/api/auth/spotify/url`);
      console.log('✅ Auth URL endpoint is working');
    } catch (error) {
      console.log('❌ Auth URL endpoint failed:', error.response?.data?.error || error.message);
    }
  } catch (error) {
    console.log('❌ Server is not running. Start it with: npm run dev');
  }
}

checkServer();

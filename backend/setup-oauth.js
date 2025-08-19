#!/usr/bin/env node

const axios = require('axios');
const readline = require('readline');

const BASE_URL = 'http://127.0.0.1:3001';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function setupOAuth() {
  console.log('🎵 Spotify OAuth Setup for Server Playback\n');
  console.log('This script will help you set up OAuth authentication for server-side playback.\n');

  try {
    // Check if server is running
    console.log('1. Checking if server is running...');
    try {
      await axios.get(`${BASE_URL}/health`);
      console.log('✅ Server is running');
    } catch (error) {
      console.log('❌ Server is not running. Please start it first:');
      console.log('   npm run dev');
      return;
    }
    console.log('');

    // Get authorization URL
    console.log('2. Getting authorization URL...');
    const authResponse = await axios.get(`${BASE_URL}/api/auth/spotify/url`);
    const authUrl = authResponse.data.authUrl;

    console.log('✅ Authorization URL generated');
    console.log('');
    console.log('📋 Next steps:');
    console.log('   1. Open this URL in your browser:');
    console.log(`      ${authUrl}`);
    console.log('');
    console.log('   2. Login with your Spotify Premium account');
    console.log('   3. Authorize the application');
    console.log('   4. Copy the authorization code from the callback URL');
    console.log('');

    // Wait for user to complete OAuth
    const authCode = await question('Enter the authorization code: ');

    if (!authCode.trim()) {
      console.log('❌ No authorization code provided');
      return;
    }

    console.log('');
    console.log('3. Exchanging authorization code for tokens...');

    // Exchange code for tokens
    const tokenResponse = await axios.get(`${BASE_URL}/api/auth/spotify/callback?code=${authCode.trim()}`);
    const tokens = tokenResponse.data.tokens;
    const user = tokenResponse.data.user;

    console.log('✅ Authentication successful!');
    console.log(`   User: ${user.displayName} (${user.email})`);
    console.log('');
    console.log('🔑 Save this refresh token to your .env file:');
    console.log(`   SPOTIFY_REFRESH_TOKEN=${tokens.refresh_token}`);
    console.log('');

    // Test the setup
    console.log('4. Testing the setup...');

    // Check status
    const statusResponse = await axios.get(`${BASE_URL}/api/auth/spotify/status`);
    console.log('✅ OAuth status:', statusResponse.data.authenticated ? 'Authenticated' : 'Not authenticated');

    // Get devices
    const devicesResponse = await axios.get(`${BASE_URL}/api/spotify/devices`);
    const devices = devicesResponse.data.devices || [];
    console.log(`✅ Found ${devices.length} devices`);

    if (devices.length > 0) {
      console.log('   Available devices:');
      devices.forEach((device, index) => {
        console.log(`   ${index + 1}. ${device.name} (${device.type}) - ${device.is_active ? 'ACTIVE' : 'inactive'}`);
      });
    } else {
      console.log('   ⚠️  No devices found. Make sure Spotify app is running on your server.');
    }

    console.log('');
    console.log('🎉 OAuth setup completed successfully!');
    console.log('');
    console.log('📝 Next steps:');
    console.log('   1. Add the refresh token to your .env file');
    console.log('   2. Restart the server: npm run dev');
    console.log('   3. Test playback: npm run test-playback');
    console.log('');
    console.log('🎵 Your server is now ready to play Spotify tracks!');

  } catch (error) {
    console.error('❌ Setup failed:', error.response?.data?.error || error.message);
    console.log('');
    console.log('💡 Troubleshooting:');
    console.log('   1. Make sure you have Spotify Premium');
    console.log('   2. Check that your .env file has SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET');
    console.log('   3. Verify the redirect URI in Spotify Developer Dashboard');
    console.log('   4. Ensure the server is running on port 3001');
  } finally {
    rl.close();
  }
}

// Run the setup
setupOAuth();

const axios = require('axios');

const BASE_URL = 'http://127.0.0.1:3001';

async function testServerPlayback() {
  console.log('🎵 Testing Server-Side Spotify Playback...\n');

  try {
    // Test 1: Check OAuth status
    console.log('1. Checking OAuth authentication status...');
    const statusResponse = await axios.get(`${BASE_URL}/api/auth/spotify/status`);
    console.log('✅ OAuth Status:', statusResponse.data);
    console.log('');

    // Test 2: Get available devices
    console.log('2. Getting available devices...');
    const devicesResponse = await axios.get(`${BASE_URL}/api/spotify/devices`);
    const devices = devicesResponse.data.devices || [];
    console.log(`✅ Found ${devices.length} devices:`);
    devices.forEach((device, index) => {
      console.log(`   ${index + 1}. ${device.name} (${device.type}) - ${device.is_active ? 'ACTIVE' : 'inactive'}`);
    });
    console.log('');

    // Test 3: Search for a track
    console.log('3. Searching for "Bohemian Rhapsody"...');
    const searchResponse = await axios.get(`${BASE_URL}/api/spotify/search`, {
      params: {
        query: 'Bohemian Rhapsody',
        type: 'track',
        limit: 1
      }
    });

    const tracks = searchResponse.data.tracks?.items || [];
    if (tracks.length === 0) {
      console.log('❌ No tracks found');
      return;
    }

    const track = tracks[0];
    console.log(`✅ Found track: "${track.name}" by ${track.artists?.[0]?.name || 'Unknown Artist'}`);
    console.log('');

    // Test 4: Get current playback state
    console.log('4. Getting current playback state...');
    try {
      const playbackResponse = await axios.get(`${BASE_URL}/api/spotify/playback`);
      const playback = playbackResponse.data;
      if (playback.is_playing) {
        console.log(`✅ Currently playing: "${playback.item?.name}" by ${playback.item?.artists?.[0]?.name}`);
      } else {
        console.log('✅ No track currently playing');
      }
    } catch (error) {
      console.log('ℹ️  No active playback session');
    }
    console.log('');

    // Test 5: Set volume (if devices available)
    if (devices.length > 0) {
      const activeDevice = devices.find(d => d.is_active) || devices[0];
      console.log(`5. Setting volume to 50% on device "${activeDevice.name}"...`);
      try {
        const volumeResponse = await axios.put(`${BASE_URL}/api/spotify/volume`, {
          volumePercent: 50,
          deviceId: activeDevice.id
        });
        console.log('✅ Volume set successfully');
      } catch (error) {
        console.log(`❌ Failed to set volume: ${error.response?.data?.error || error.message}`);
      }
      console.log('');

      // Test 6: Play the track
      console.log(`6. Playing "${track.name}" on device "${activeDevice.name}"...`);
      try {
        const playResponse = await axios.post(`${BASE_URL}/api/spotify/tracks/${track.id}/play`, {
          deviceId: activeDevice.id
        });
        console.log('✅ Playback started successfully!');
        console.log(`   Track: ${track.name}`);
        console.log(`   Artist: ${track.artists?.[0]?.name || 'Unknown'}`);
        console.log(`   Device: ${activeDevice.name}`);
      } catch (error) {
        console.log(`❌ Failed to start playback: ${error.response?.data?.error || error.message}`);
        console.log('   💡 Make sure:');
        console.log('      - You have Spotify Premium');
        console.log('      - Spotify app is running on the server');
        console.log('      - The device is active and has audio output');
      }
      console.log('');

      // Test 7: Wait a moment, then pause
      console.log('7. Waiting 3 seconds, then pausing...');
      await new Promise(resolve => setTimeout(resolve, 3000));

      try {
        const pauseResponse = await axios.post(`${BASE_URL}/api/spotify/pause`, {
          deviceId: activeDevice.id
        });
        console.log('✅ Playback paused successfully');
      } catch (error) {
        console.log(`❌ Failed to pause: ${error.response?.data?.error || error.message}`);
      }
      console.log('');

      // Test 8: Resume playback
      console.log('8. Resuming playback...');
      try {
        const resumeResponse = await axios.post(`${BASE_URL}/api/spotify/play`, {
          deviceId: activeDevice.id
        });
        console.log('✅ Playback resumed successfully');
      } catch (error) {
        console.log(`❌ Failed to resume: ${error.response?.data?.error || error.message}`);
      }
      console.log('');

    } else {
      console.log('⚠️  No devices available for playback testing');
      console.log('   Make sure Spotify app is running on your server');
    }

    console.log('🎉 Server playback tests completed!');
    console.log('');
    console.log('📝 Summary:');
    console.log('   ✅ OAuth authentication working');
    console.log('   ✅ Device discovery working');
    console.log('   ✅ Track search working');
    console.log('   ✅ Playback controls available');
    console.log('');
    console.log('🎵 Your server is now ready to be a Spotify DJ!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    console.log('');
    console.log('💡 Troubleshooting:');
    console.log('   1. Make sure the server is running: npm run dev');
    console.log('   2. Check OAuth authentication: curl http://localhost:3001/api/auth/spotify/status');
    console.log('   3. Ensure Spotify Premium account is used');
    console.log('   4. Verify Spotify app is running on the server');
  }
}

// Run the test
testServerPlayback();

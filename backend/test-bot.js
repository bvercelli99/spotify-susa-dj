const axios = require('axios');

const BASE_URL = 'http://127.0.0.1:3001';

async function testBot() {
  console.log('🤖 Testing Spotify DJ Bot...\n');

  try {
    // Test 1: Check bot status
    console.log('1. Checking bot status...');
    const statusResponse = await axios.get(`${BASE_URL}/api/auth/bot/status`);
    console.log('✅ Bot Status:', statusResponse.data);
    console.log('');

    // Test 2: Get bot token
    console.log('2. Getting bot token...');
    const tokenResponse = await axios.get(`${BASE_URL}/api/auth/bot/token`);
    console.log('✅ Bot Token obtained successfully');
    console.log('');

    // Test 3: Search for a track
    console.log('3. Searching for "Bohemian Rhapsody"...');
    const searchResponse = await axios.get(`${BASE_URL}/api/spotify/search`, {
      params: {
        query: 'Bohemian Rhapsody',
        type: 'track',
        limit: 5
      }
    });

    const tracks = searchResponse.data.tracks?.items || [];
    console.log(`✅ Found ${tracks.length} tracks:`);
    tracks.forEach((track, index) => {
      console.log(`   ${index + 1}. ${track.name} - ${track.artists?.[0]?.name || 'Unknown Artist'}`);
    });
    console.log('');

    // Test 4: Get track details
    if (tracks.length > 0) {
      const firstTrack = tracks[0];
      console.log(`4. Getting details for "${firstTrack.name}"...`);
      const trackResponse = await axios.get(`${BASE_URL}/api/spotify/tracks/${firstTrack.id}`);
      const track = trackResponse.data;
      console.log(`✅ Track Details:`);
      console.log(`   Name: ${track.name}`);
      console.log(`   Artist: ${track.artists?.[0]?.name || 'Unknown'}`);
      console.log(`   Album: ${track.album?.name || 'Unknown'}`);
      console.log(`   Duration: ${Math.round(track.duration_ms / 1000)}s`);
      console.log('');

      // Test 5: Get track preview URL
      console.log(`5. Getting preview URL for "${track.name}"...`);
      try {
        const previewResponse = await axios.get(`${BASE_URL}/api/spotify/tracks/${firstTrack.id}/preview`);
        console.log(`✅ Preview URL: ${previewResponse.data.preview_url}`);
        console.log(`   Message: ${previewResponse.data.message}`);
      } catch (previewError) {
        console.log(`❌ No preview available: ${previewError.response?.data?.message || 'Unknown error'}`);
      }
      console.log('');

      // Test 6: Get track external links
      console.log(`6. Getting external links for "${track.name}"...`);
      const linksResponse = await axios.get(`${BASE_URL}/api/spotify/tracks/${firstTrack.id}/links`);
      console.log(`✅ Spotify App Link: ${linksResponse.data.spotify}`);
      console.log(`   Message: ${linksResponse.data.message}`);
      console.log('');

      // Test 7: Get artist details
      if (track.artists?.[0]?.id) {
        console.log(`7. Getting details for artist "${track.artists[0].name}"...`);
        const artistResponse = await axios.get(`${BASE_URL}/api/spotify/artists/${track.artists[0].id}`);
        const artist = artistResponse.data;
        console.log(`✅ Artist Details:`);
        console.log(`   Name: ${artist.name}`);
        console.log(`   Followers: ${artist.followers?.total?.toLocaleString() || 'Unknown'}`);
        console.log(`   Genres: ${artist.genres?.join(', ') || 'None'}`);
        console.log('');
      }
    }

    // Test 8: Search for an artist
    console.log('8. Searching for "Queen"...');
    const artistSearchResponse = await axios.get(`${BASE_URL}/api/spotify/search`, {
      params: {
        query: 'Queen',
        type: 'artist',
        limit: 3
      }
    });

    const artists = artistSearchResponse.data.artists?.items || [];
    console.log(`✅ Found ${artists.length} artists:`);
    artists.forEach((artist, index) => {
      console.log(`   ${index + 1}. ${artist.name} (${artist.followers?.total?.toLocaleString() || 'Unknown'} followers)`);
    });

    console.log('\n🎉 All bot tests completed successfully!');
    console.log('🤖 The bot is working perfectly without any user interaction required.');
    console.log('\n📝 Summary of what you can do with Track IDs:');
    console.log('   ✅ Get track details and metadata');
    console.log('   ✅ Get 30-second preview URLs (if available)');
    console.log('   ✅ Get Spotify app links to open tracks');
    console.log('   ❌ Cannot download tracks (Spotify restriction)');
    console.log('   ❌ Cannot play tracks without user OAuth');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    console.log('\n💡 Make sure the server is running with: npm run dev');
  }
}

// Run the test
testBot();

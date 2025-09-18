import React, { useCallback, useEffect, useRef, useState } from 'react';
import './App.css';
import logoImage from './assets/westly-strong.svg';
import { AuthGuard } from './components/AuthGuard';
import { UserHeader } from './components/UserHeader';
import { AuthProvider } from './contexts/AuthContext';
import { Song } from './models/Song';
import * as utils from './utils/utilities';

function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [searchResults, setSearchResults] = useState<Song[]>([]);

  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [upcomingSongs, setUpcomingSongs] = useState<Song[]>([]);
  const [playbackProgress, setPlaybackProgress] = useState<number>(0);

  const handleSearch = async (e: any) => {
    e.preventDefault();
    console.log('Searching for:', searchQuery);

    if (searchQuery.trim()) {
      try {
        // Make API call to backend search route
        const response = await fetch(`http://localhost:3001/api/spotify/search?query=${encodeURIComponent(searchQuery)}&type=track&limit=10`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // Transform the Spotify API response to match our Song model
        if (data && data.length > 0) {
          const transformedResults: Song[] = data.map((track: any) => ({
            songId: track.id, // Generate unique ID for frontend
            albumName: track.album || 'Unknown Album',
            songName: track.name || 'Unknown Song',
            artist: track.artist || 'Unknown Artist',
            duration: track.duration,
            albumArt: track.album_image || '',
            releaseDate: track.release_date.split("-")[0] || '',
            popularity: track.popularity || 0,
            userId: ""
          }));
          setSearchResults(transformedResults);
          setSearchQuery('');
        } else {
          setSearchResults([]);
          setSearchQuery('');
        }
      } catch (error) {
        console.error('Search failed:', error);
        setSearchResults([]);
        setSearchQuery('');
      }
    } else {
      setSearchResults([]);
      setSearchQuery('');
    }
  };

  const handleAutoplay = async () => {
    if (upcomingSongs.length > 0 && !isAutoPlaying) {
      try {
        await callPlayAPI(upcomingSongs[0]);
        setCurrentSong(upcomingSongs[0]); // Set first song as current
        setPlaybackProgress(0); // Reset progress for new song
        setIsPlaying(true);
        handleRemoveSong(upcomingSongs[0].songId);
        console.log('Autoplay started');
      } catch (error) {
        console.error('Failed to start autoplay:', error);
        // Still update UI even if API call fails for better UX
        setCurrentSong(upcomingSongs[0]);
        setPlaybackProgress(0);
        setIsPlaying(true);
      }
    } else if (!isAutoPlaying) {
      setIsAutoPlaying(true);

      console.log('No songs in queue for autoplay, pull 10 from db and go');
    }
  };

  const handleStop = async () => {
    try {
      await callPauseAPI();
      setIsPlaying(false);
      setCurrentSong(null);
      console.log('Playback stopped');
    } catch (error) {
      console.error('Failed to stop playback:', error);
      // Still update UI even if API call fails for better UX
      setIsPlaying(false);
      setCurrentSong(null);
    }
  };

  const handleSkip = async () => {
    // Logic to move to next song
    if (currentSong && upcomingSongs.length > 0) {

      const nextSong = upcomingSongs[0];

      try {
        await callPlayAPI(nextSong);
        setCurrentSong(nextSong);
        setPlaybackProgress(0); // Reset progress for new song
        handleRemoveSong(nextSong.songId);
        console.log('Skipped to next song:', nextSong.songName);
      } catch (error) {
        console.error('Failed to skip song:', error);
        // Still update UI even if API call fails for better UX
        setCurrentSong(nextSong);
        setPlaybackProgress(0);
      }
    }
  };

  const handleBlame = () => {
    console.log('Blame action triggered');
    // Add blame logic here
  };

  // Polling interval references
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Function to fetch current playback state
  const fetchPlaybackState = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:3001/api/spotify/playback');
      if (response.ok) {
        const data = await response.json();

        // Update progress if song is playing
        if (data && data.is_playing && data.progress_ms !== null) {
          setPlaybackProgress(data.progress_ms);
        }

        // Check if current song has finished
        if (data && !data.is_playing && currentSong && upcomingSongs.length > 0) {
          // Song finished, start next

          // Remove current song from queue


          // Start next song if available
          const nextSong = upcomingSongs[0];
          if (nextSong) {
            try {
              await callPlayAPI(nextSong);
              setCurrentSong(nextSong);
              setUpcomingSongs(prevSongs => prevSongs.filter((s, index) => s.songId !== nextSong.songId));
              console.log('Auto-started next song:', nextSong.songName);
            } catch (error) {
              console.error('Failed to auto-start next song:', error);
              setCurrentSong(null);
              setIsPlaying(false);
            }
          } else {
            // No more songs in queue
            setCurrentSong(null);
            setIsPlaying(false);
          }

        }
      }
    } catch (error) {
      console.error('Failed to fetch playback state:', error);
    }
  }, [currentSong, upcomingSongs]);

  const durationRef = useRef(0);
  useEffect(() => {
    durationRef.current = currentSong?.duration ?? 0; // ms
  }, [currentSong]);

  // Start/stop polling based on isPlaying state
  useEffect(() => {
    if (!isPlaying) {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      setPlaybackProgress(0);
      return; // nothing else to do
    }

    // Poll Spotify less frequently
    pollingIntervalRef.current = setInterval(fetchPlaybackState, 10000);

    // Local smooth progress; only use functional update
    progressIntervalRef.current = setInterval(() => {
      setPlaybackProgress(prev => {
        const next = Math.min(prev + 1000, durationRef.current); // +1s, clamp to duration
        return next;
      });
    }, 1000);

    // Kick off immediately
    fetchPlaybackState();

    // Cleanup
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    };
    // Keep deps minimal to avoid re-creating intervals unnecessarily
  }, [isPlaying, fetchPlaybackState]);

  const handleAddSong = (song: Song) => {
    // Check if song is already in the list
    const isDuplicate = upcomingSongs.some(existingSong => existingSong.songId === song.songId);
    if (!isDuplicate) {
      // Add the song to the upcoming songs list
      song.userId = "local-user"; // Placeholder user ID
      setUpcomingSongs(prevSongs => [...prevSongs, song]);
      console.log('Added song:', song.songName);
    } else {
      console.log('Song already in list');
    }
  };

  const handleRemoveSong = (songId: string) => {
    setUpcomingSongs(prevSongs => prevSongs.filter(song => song.songId !== songId));
    console.log('Removed song from list');
  };

  const callPlayAPI = async (song: Song) => {
    try {
      const trackUri = `spotify:track:${song.songId}`;
      const response = await fetch('http://localhost:3001/api/spotify/play', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uris: [trackUri]
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      else {
        //log playback
        await fetch('http://localhost:3001/api/analytics/logplayback', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            track: {
              id: song.songId,
              trackName: song.songName,
              artistName: song.artist,
              albumName: song.albumName,
            },
            userId: "local-user"
          }),
        });
      }

      const data = await response.json();
      console.log('Playback started via API:', data);
      return data;
    } catch (error) {
      console.error('Failed to start playback:', error);
      throw error;
    }
  };

  const callPauseAPI = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/spotify/pause', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Playback paused via API:', data);
      return data;
    } catch (error) {
      console.error('Failed to pause playback:', error);
      throw error;
    }
  };

  const handlePlayNow = async (song: Song) => {
    try {
      await callPlayAPI(song);
      const currentIndex = upcomingSongs.findIndex(s => s.songId === song.songId);
      if (currentIndex !== -1) {
        // Remove current song from queue
        setUpcomingSongs(prevSongs => prevSongs.filter((_, index) => index !== currentIndex));
      }

      setCurrentSong(song);
      setPlaybackProgress(0); // Reset progress for new song
      setIsPlaying(true);
      console.log('Playing song now:', song.songName);
    } catch (error) {
      console.error('Failed to play song:', error);
      // Still update UI even if API call fails for better UX
      setCurrentSong(null);
      setPlaybackProgress(0);
      setIsPlaying(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-800 to-gray-700 text-white">
      <div className="flex flex-col lg:flex-row h-screen">
        {/* Left Sidebar - Upcoming Songs */}
        <div className="w-full lg:w-[370px] bg-gray-800 border-b lg:border-b-0 lg:border-r border-gray-700 p-3 lg:p-6 overflow-y-auto">
          <UserHeader />
          <h2 className="text-2xl font-bold mb-6 text-blue-300">Upcoming Songs</h2>
          <div className="space-y-4">
            {upcomingSongs.map((song) => (
              <div key={song.songId} className="bg-gray-600 rounded-lg p-4 hover:bg-gray-500 transition-colors duration-200">
                <div className="flex items-start space-x-4">
                  {/* Album Cover */}
                  <div className="flex-shrink-0">
                    {song.albumArt ? (
                      <img
                        src={song.albumArt}
                        alt={`${song.songName} album cover`}
                        className="w-20 h-20 rounded-lg object-cover"
                      />
                    ) : (
                      <img
                        src={logoImage}
                        alt="Default album cover"
                        className="w-20 h-20 rounded-lg object-cover"
                      />
                    )}
                  </div>

                  {/* Song Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-white truncate">{song.songName}</h3>
                      <span className="text-sm text-gray-400 bg-gray-600 px-2 py-1 rounded ml-2">{utils.formatDuration(song.duration)}</span>
                    </div>
                    <p className="text-gray-300 text-sm mb-3">{song.artist}</p>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handlePlayNow(song)}
                        className="text-xs bg-blue-500 hover:bg-blue-600 px-3 py-1 rounded transition-colors duration-200"
                      >
                        Play Now
                      </button>
                      <button
                        onClick={() => handleRemoveSong(song.songId)}
                        className="text-xs bg-gray-600 hover:bg-gray-500 px-3 py-1 rounded transition-colors duration-200"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Content - Search and Controls at Top Left */}
        <div className="flex-1 flex flex-col">
          {/* Top Section with Search and Controls */}
          <div className="bg-gray-800 border-b border-gray-700 p-3 lg:p-6">
            <div className="max-w-4xl">
              <h1 className="text-xl lg:text-3xl font-bold mb-4 lg:mb-6 text-blue-300 flex flex-col lg:flex-row items-center space-y-2 lg:space-y-0 lg:space-x-3">
                <img src={logoImage} alt="DJ Bot Logo" className="w-16 h-16 lg:w-[100px] lg:h-[100px]" />
                <span>DJ Bot</span>
              </h1>

              {/* Current Song Display */}
              <div className="mb-4 lg:mb-6 p-3 lg:p-4 bg-gray-600 rounded-lg border border-gray-700">
                {isPlaying && currentSong ? (
                  // Show current song info
                  <div>
                    <div className="flex flex-col sm:flex-row items-start space-y-3 sm:space-y-0 sm:space-x-4">
                      {/* Album Cover */}
                      <div className="flex-shrink-0 mx-auto sm:mx-0">
                        {currentSong.albumArt ? (
                          <img
                            src={currentSong.albumArt}
                            alt={`${currentSong.albumName} album cover`}
                            className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg object-cover"
                          />
                        ) : (
                          <img
                            src={logoImage}
                            alt="Default album cover"
                            className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg object-cover"
                          />
                        )}
                      </div>

                      {/* Song Info */}
                      <div className="flex-1 min-w-0">
                        <div className="space-y-1">
                          <h3 className="text-xl font-semibold text-white truncate">{currentSong.songName}</h3>
                          <p className="text-gray-300">{currentSong.artist}</p>
                          <p className="text-gray-400 text-sm">{currentSong.albumName}</p>
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-4">
                      <div className="flex justify-between text-sm text-gray-400 mb-2">
                        <span>{utils.formatDuration(playbackProgress)}</span>
                        <span>{utils.formatDuration(currentSong.duration)}</span>
                      </div>
                      <div className="w-full bg-gray-600 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full transition-all duration-1000"
                          style={{
                            width: `${currentSong.duration > 0 ? (playbackProgress / currentSong.duration) * 100 : 0}%`
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Show "no song playing" message
                  <div>
                    <div className="flex flex-col sm:flex-row items-start space-y-3 sm:space-y-0 sm:space-x-4">
                      <div className="w-20 h-20 bg-gray-600 rounded-lg flex items-center justify-center mx-auto sm:mx-0">
                        <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="space-y-1">
                          <h3 className="text-xl font-semibold text-white truncate">No Song Playing</h3>
                          <p className="text-gray-300">Search for a song or click Autoplay to start your music</p>
                          <p className="text-gray-400 text-sm">Ready to play</p>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4">
                      <div className="flex justify-between text-sm text-gray-400 mb-2">
                        <span>--:--</span>
                        <span>--:--</span>
                      </div>
                      <div className="w-full bg-gray-600 rounded-full h-2">
                        <div className="bg-gray-500 h-2 rounded-full" style={{ width: '0%' }}></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Search Input */}
              <form onSubmit={handleSearch} className="mb-4 lg:mb-6">
                <div className="relative max-w-md">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search for songs, artists, or albums..."
                    className="w-full px-4 lg:px-6 py-2 lg:py-3 text-base lg:text-lg bg-gray-600 border border-gray-500 rounded-full text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    type="submit"
                    className="absolute right-2 top-2 bg-blue-500 hover:bg-blue-600 text-white px-3 lg:px-4 py-1 rounded-full transition-colors duration-200 text-sm lg:text-base"
                  >
                    Search
                  </button>
                </div>
              </form>

              {/* Control Buttons */}
              <div className="flex flex-wrap gap-2 lg:gap-4">
                <button
                  onClick={handleAutoplay}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors duration-200 flex items-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Autoplay</span>
                </button>

                <button
                  onClick={handleStop}
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors duration-200 flex items-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                  </svg>
                  <span>Stop</span>
                </button>

                <button
                  onClick={handleSkip}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold transition-colors duration-200 flex items-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                  </svg>
                  <span>Skip</span>
                </button>

                <button
                  onClick={handleBlame}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg font-semibold transition-colors duration-200 flex items-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <span>Blame</span>
                </button>
              </div>
            </div>
          </div>

          {/* Main Content Area - Search Results */}
          <div className="flex-1 p-3 lg:p-6">
            {searchResults.length > 0 ? (
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 mb-4 lg:mb-6">
                  <h2 className="text-xl lg:text-2xl font-semibold text-blue-300">Search Results</h2>
                  <button
                    onClick={() => setSearchResults([])}
                    className="bg-gray-600 hover:bg-gray-500 text-white px-3 lg:px-4 py-2 rounded-lg transition-colors duration-200 text-sm w-full sm:w-auto"
                  >
                    Clear Results
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
                  {searchResults.map((song) => (
                    <div key={song.songId} className="bg-gray-600 rounded-lg p-3 hover:bg-gray-600 transition-colors duration-200">
                      <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-3">
                        {/* Album Cover */}
                        <div className="flex-shrink-0 flex flex-col items-center">
                          {song.albumArt ? (
                            <img
                              src={song.albumArt}
                              alt={`${song.albumName} album cover`}
                              className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg object-cover"
                            />
                          ) : (
                            <img
                              src={logoImage}
                              alt="Default album cover"
                              className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg object-cover"
                            />
                          )}
                          <button
                            onClick={() => handleAddSong(song)}
                            className="w-full bg-green-600 hover:bg-green-700 text-white px-2 py-1.5 rounded text-xs transition-colors duration-200 mt-2"
                          >
                            Add Song
                          </button>
                        </div>

                        {/* Song Info and Controls */}
                        <div className="flex-1 min-w-0 text-center sm:text-left">
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-1 space-y-1 sm:space-y-0">
                            <h3 className="font-semibold text-white truncate text-sm">{song.songName}</h3>
                            <span className="text-xs text-gray-400 bg-gray-600 px-1 py-0.5 rounded">{utils.formatDuration(song.duration)}</span>
                          </div>
                          <p className="text-gray-300 text-xs mb-1">{song.artist}</p>
                          <p className="text-gray-400 text-xs mb-2">{song.albumName}</p>

                          <div className="flex justify-center sm:justify-start">
                            <span className="text-xs text-gray-400 bg-gray-700 px-2 py-1 rounded-full">
                              Popularity: {song.popularity}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-400">
                <h2 className="text-xl lg:text-2xl font-semibold mb-4">Welcome to DJ Bot</h2>
                <p className="text-base lg:text-lg">Use the search bar above to find your favorite songs or select Autoplay to start your music.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const AppWithAuth: React.FC = () => {
  return (
    <AuthProvider>
      <AuthGuard>
        <App />
      </AuthGuard>
    </AuthProvider>
  );
};

export default AppWithAuth;

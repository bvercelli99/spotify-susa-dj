import React, { useState } from 'react';
import './App.css';
import logoImage from './assets/westly-strong.svg';

function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSong, setCurrentSong] = useState<typeof upcomingSongs[0] | null>(null);
  const [upcomingSongs] = useState([
    { id: 1, album: "Album 1", title: 'Bohemian Rhapsody', artist: 'Queen', duration: '5:55', image: "https://encrypted-tbn1.gstatic.com/images?q=tbn:ANd9GcTXXzrf9nWsu8CGnl_sndW1q1TsTSgQqc4yOC3VzntYyeuvWYN3" },
    { id: 2, album: "Album 2", title: 'Hotel California', artist: 'Eagles', duration: '6:30', image: "" },
    { id: 3, album: "Album 3", title: 'Stairway to Heaven', artist: 'Led Zeppelin', duration: '8:02', image: "" },
    { id: 4, album: "Album 4", title: 'Imagine', artist: 'John Lennon', duration: '3:03', image: "" },
    { id: 5, album: "Album 5", title: 'Hey Jude', artist: 'The Beatles', duration: '7:11', image: "" },
  ]);

  const handleSearch = (e: any) => {
    e.preventDefault();
    console.log('Searching for:', searchQuery);
    // Add search logic here
  };

  const handleAutoplay = () => {
    setIsPlaying(true);
    setCurrentSong(upcomingSongs[0]); // Set first song as current
    console.log('Autoplay started');
  };

  const handleStop = () => {
    setIsPlaying(false);
    setCurrentSong(null);
    console.log('Playback stopped');
  };

  const handleSkip = () => {
    // Logic to move to next song
    if (currentSong) {
      const currentIndex = upcomingSongs.findIndex(song => song.id === currentSong.id);
      const nextIndex = (currentIndex + 1) % upcomingSongs.length;
      setCurrentSong(upcomingSongs[nextIndex]);
    }
    console.log('Skipped to next song');
  };

  const handleBlame = () => {
    console.log('Blame action triggered');
    // Add blame logic here
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-800 to-gray-700 text-white">
      <div className="flex h-screen">
        {/* Left Sidebar - Upcoming Songs */}
        <div className="w-[370px] bg-gray-800 border-r border-gray-700 p-6 overflow-y-auto">
          <h2 className="text-2xl font-bold mb-6 text-blue-300">Upcoming Songs</h2>
          <div className="space-y-4">
            {upcomingSongs.map((song) => (
              <div key={song.id} className="bg-gray-600 rounded-lg p-4 hover:bg-gray-500 transition-colors duration-200">
                <div className="flex items-start space-x-4">
                  {/* Album Cover */}
                  <div className="flex-shrink-0">
                    {song.image ? (
                      <img
                        src={song.image}
                        alt={`${song.title} album cover`}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                    ) : (
                      <img
                        src={logoImage}
                        alt="Default album cover"
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                    )}
                  </div>

                  {/* Song Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-white truncate">{song.title}</h3>
                      <span className="text-sm text-gray-400 bg-gray-600 px-2 py-1 rounded ml-2">{song.duration}</span>
                    </div>
                    <p className="text-gray-300 text-sm mb-3">{song.artist}</p>
                    <div className="flex space-x-2">
                      <button className="text-xs bg-blue-500 hover:bg-blue-600 px-3 py-1 rounded transition-colors duration-200">
                        Play Now
                      </button>
                      <button className="text-xs bg-gray-600 hover:bg-gray-500 px-3 py-1 rounded transition-colors duration-200">
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
          <div className="bg-gray-800 border-b border-gray-700 p-6">
            <div className="max-w-4xl">
              <h1 className="text-3xl font-bold mb-6 text-blue-300 flex items-center space-x-3">
                <img src={logoImage} alt="DJ Bot Logo" className="w-[100px] h-[100px]" />
                <span>DJ Bot</span>
              </h1>

              {/* Current Song Display */}
              <div className="mb-6 p-4 bg-gray-700 rounded-lg border border-gray-600">
                {isPlaying && currentSong ? (
                  // Show current song info
                  <div>
                    <div className="flex items-start space-x-4">
                      {/* Album Cover */}
                      <div className="flex-shrink-0">
                        {currentSong.image ? (
                          <img
                            src={currentSong.image}
                            alt={`${currentSong.title} album cover`}
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
                        <div className="space-y-1">
                          <h3 className="text-xl font-semibold text-white truncate">{currentSong.title}</h3>
                          <p className="text-gray-300">{currentSong.artist}</p>
                          <p className="text-gray-400 text-sm">{currentSong.album}</p>
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-4">
                      <div className="flex justify-between text-sm text-gray-400 mb-2">
                        <span>0:00</span>
                        <span>{currentSong.duration}</span>
                      </div>
                      <div className="w-full bg-gray-600 rounded-full h-2">
                        <div className="bg-blue-500 h-2 rounded-full" style={{ width: '0%' }}></div>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Show "no song playing" message
                  <div>
                    <div className="flex items-start space-x-4">
                      <div className="w-20 h-20 bg-gray-600 rounded-lg flex items-center justify-center">
                        <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
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
              <form onSubmit={handleSearch} className="mb-6">
                <div className="relative max-w-md">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search for songs, artists, or albums..."
                    className="w-full px-6 py-3 text-lg bg-gray-600 border border-gray-500 rounded-full text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    type="submit"
                    className="absolute right-2 top-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-1 rounded-full transition-colors duration-200"
                  >
                    Search
                  </button>
                </div>
              </form>

              {/* Control Buttons */}
              <div className="flex space-x-4">
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

          {/* Main Content Area - Can be used for additional features */}
          <div className="flex-1 p-6">
            <div className="text-center text-gray-400">
              <h2 className="text-2xl font-semibold mb-4">Welcome to DJ Bot</h2>
              <p className="text-lg">Use the search bar above to find your favorite songs and manage your playlist from the sidebar.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;

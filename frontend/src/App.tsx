import React, { useState } from 'react';
import './App.css';

function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [upcomingSongs] = useState([
    { id: 1, title: 'Bohemian Rhapsody', artist: 'Queen', duration: '5:55' },
    { id: 2, title: 'Hotel California', artist: 'Eagles', duration: '6:30' },
    { id: 3, title: 'Stairway to Heaven', artist: 'Led Zeppelin', duration: '8:02' },
    { id: 4, title: 'Imagine', artist: 'John Lennon', duration: '3:03' },
    { id: 5, title: 'Hey Jude', artist: 'The Beatles', duration: '7:11' },
  ]);

  const handleSearch = (e: any) => {
    e.preventDefault();
    console.log('Searching for:', searchQuery);
    // Add search logic here
  };

  const handleAutoplay = () => {
    console.log('Autoplay started');
    // Add autoplay logic here
  };

  const handleStop = () => {
    console.log('Playback stopped');
    // Add stop logic here
  };

  const handleSkip = () => {
    console.log('Skipped to next song');
    // Add skip logic here
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      <div className="flex h-screen">
        {/* Left Sidebar - Upcoming Songs */}
        <div className="w-80 bg-gray-800 border-r border-gray-700 p-6 overflow-y-auto">
          <h2 className="text-2xl font-bold mb-6 text-blue-400">Upcoming Songs</h2>
          <div className="space-y-4">
            {upcomingSongs.map((song) => (
              <div key={song.id} className="bg-gray-700 rounded-lg p-4 hover:bg-gray-600 transition-colors duration-200">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-white">{song.title}</h3>
                  <span className="text-sm text-gray-400 bg-gray-600 px-2 py-1 rounded">{song.duration}</span>
                </div>
                <p className="text-gray-300 text-sm">{song.artist}</p>
                <div className="mt-3 flex space-x-2">
                  <button className="text-xs bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded transition-colors duration-200">
                    Play Now
                  </button>
                  <button className="text-xs bg-gray-600 hover:bg-gray-500 px-3 py-1 rounded transition-colors duration-200">
                    Remove
                  </button>
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
              <h1 className="text-3xl font-bold mb-6 text-blue-400 flex items-center space-x-3">
                <img src="/logo.png" alt="DJ Bot Logo" className="w-10 h-10" />
                <span>DJ Bot</span>
              </h1>

              {/* Search Input */}
              <form onSubmit={handleSearch} className="mb-6">
                <div className="relative max-w-md">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search for songs, artists, or albums..."
                    className="w-full px-6 py-3 text-lg bg-gray-700 border border-gray-600 rounded-full text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    type="submit"
                    className="absolute right-2 top-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-1 rounded-full transition-colors duration-200"
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
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors duration-200 flex items-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                  </svg>
                  <span>Skip</span>
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

import React from 'react';
import { useDjUserAuth } from '../contexts/DjUserAuthContext';
import { useAuth } from '../contexts/SpotifyAuthContext';

export const UserHeader: React.FC = () => {
  const { activeDevice } = useAuth();
  const { djUser, logout } = useDjUserAuth();

  return (
    <div className="flex items-center justify-between bg-gray-700 rounded-lg p-3 mb-4">
      <div className="flex items-center space-x-3">

        <div>
          <p className="text-white font-medium">{djUser?.username || 'User'}</p>
          {activeDevice && (
            <p className="text-gray-500 text-xs mt-1">
              📱 {activeDevice.name} ({activeDevice.type})
            </p>
          )}
        </div>
      </div>

      <button
        onClick={logout}
        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center space-x-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
        <span>Logout</span>
      </button>
    </div>
  );
};

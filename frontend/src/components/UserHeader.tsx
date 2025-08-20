import React from 'react';
import { useAuth } from '../contexts/AuthContext';

export const UserHeader: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <div className="flex items-center justify-between bg-gray-700 rounded-lg p-3 mb-4">
      <div className="flex items-center space-x-3">
        {user?.image && (
          <img
            src={user.image}
            alt={user.displayName || 'User'}
            className="w-10 h-10 rounded-full object-cover"
          />
        )}
        <div>
          <p className="text-white font-medium">{user?.displayName || 'User'}</p>
          <p className="text-gray-400 text-sm">{user?.email}</p>
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

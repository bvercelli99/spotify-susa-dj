import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';

interface DjUser {
  username: string;
  id: string;
}

interface DjUserAuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  djUser: DjUser | null;
  verifyCode: (code: string) => Promise<void>;
  logout: () => void;
}

const DjUserAuthContext = createContext<DjUserAuthContextType | undefined>(undefined);

export const useDjUserAuth = () => {
  const context = useContext(DjUserAuthContext);
  if (context === undefined) {
    throw new Error('useDjUserAuth must be used within a DjUserAuthProvider');
  }
  return context;
};

interface DjUserAuthProviderProps {
  children: ReactNode;
}

const STORAGE_KEY = 'DJ_USER';

// Simple dialog component for verification code input
const VerificationDialog: React.FC<{
  isOpen: boolean;
  onVerify: (code: string) => Promise<void>;
  error: string | null;
  isLoading: boolean;
}> = ({ isOpen, onVerify, error, isLoading }) => {
  const [code, setCode] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim()) {
      await onVerify(code.trim());
      setCode(''); // Clear input after submission
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg shadow-xl p-6 max-w-md w-full mx-4 border border-gray-700">
        <h2 className="text-2xl font-bold text-white mb-4">Enter Verification Code</h2>
        <p className="text-gray-400 mb-6">
          Please enter your unique verification code to continue.
        </p>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Verification Code"
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
              autoFocus
            />
            {error && (
              <p className="text-red-500 text-sm mt-2">{error}</p>
            )}
          </div>
          <div className="flex space-x-3">
            <button
              type="submit"
              disabled={isLoading || !code.trim()}
              className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
            >
              {isLoading ? 'Verifying...' : 'Verify'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const DjUserAuthProvider: React.FC<DjUserAuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [djUser, setDjUser] = useState<DjUser | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [dialogError, setDialogError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001';

  // Load user from localStorage on mount
  // This context should only be used after Spotify auth is successful
  useEffect(() => {
    const loadUserFromStorage = () => {
      try {
        const storedUser = localStorage.getItem(STORAGE_KEY);
        if (storedUser) {
          const user = JSON.parse(storedUser);
          setDjUser(user);
          setIsAuthenticated(true);
          setShowDialog(false);
        } else {
          // No user in storage, show dialog
          setShowDialog(true);
        }
      } catch (error) {
        console.error('Failed to load user from storage:', error);
        setShowDialog(true);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserFromStorage();
  }, []);

  const verifyCode = async (code: string) => {
    setIsVerifying(true);
    setDialogError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/dj/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      });

      if (response.ok) {
        const data = await response.json();

        // Store user information
        const user: DjUser = {
          username: data.username || 'User',
          id: data.id || '',
        };

        // Save to localStorage
        localStorage.setItem(STORAGE_KEY, JSON.stringify(user));

        setDjUser(user);
        setIsAuthenticated(true);
        setShowDialog(false);
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Verification failed' }));
        setDialogError(errorData.error || 'Invalid verification code. Please try again.');
      }
    } catch (error) {
      console.error('Failed to verify code:', error);
      setDialogError('Failed to verify code. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setDjUser(null);
    setIsAuthenticated(false);
    setShowDialog(true); // Show dialog again after logout
  };

  const value: DjUserAuthContextType = {
    isAuthenticated,
    isLoading,
    djUser,
    verifyCode,
    logout,
  };

  return (
    <DjUserAuthContext.Provider value={value}>
      {children}
      <VerificationDialog
        isOpen={showDialog && !isLoading}
        onVerify={verifyCode}
        error={dialogError}
        isLoading={isVerifying}
      />
    </DjUserAuthContext.Provider>
  );
};


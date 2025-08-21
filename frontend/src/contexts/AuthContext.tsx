import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: any | null;
  activeDevice: any | null;
  login: () => void;
  logout: () => void;
  checkAuthStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any | null>(null);
  const [activeDevice, setActiveDevice] = useState<any | null>(null);

  const API_BASE_URL = 'http://localhost:3001/api';

  const checkAuthStatus = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/spotify/status`);
      if (response.ok) {
        const data = await response.json();
        setIsAuthenticated(data.authenticated);

        // If authenticated, get user profile and set device
        if (data.authenticated) {
          try {
            const profileResponse = await fetch(`${API_BASE_URL}/auth/spotify/profile`);
            if (profileResponse.ok) {
              const profileData = await profileResponse.json();
              setUser(profileData);
            }
          } catch (profileError) {
            console.error('Failed to get user profile:', profileError);
          }

          // Set first available device as active
          try {
            const deviceResponse = await fetch(`${API_BASE_URL}/auth/spotify/set-device`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
            });
            if (deviceResponse.ok) {
              const deviceData = await deviceResponse.json();
              console.log('Device set successfully:', deviceData);

              setActiveDevice(deviceData);

            }
          } catch (deviceError) {
            console.error('Failed to set device:', deviceError);
          }
        }
      } else {
        setIsAuthenticated(false);
        setUser(null);
      }
    } catch (error) {
      console.error('Failed to check auth status:', error);
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async () => {
    try {
      // Get the Spotify authorization URL
      const response = await fetch(`${API_BASE_URL}/auth/spotify/url`);
      if (response.ok) {
        const data = await response.json();

        // Open the OAuth URL in a new window/tab
        const authWindow = window.open(
          data.authUrl,
          'spotify-auth',
          'width=500,height=600,scrollbars=yes,resizable=yes'
        );

        // Poll for the window to close and check auth status
        const checkWindowClosed = setInterval(async () => {
          if (authWindow?.closed) {
            clearInterval(checkWindowClosed);
            await checkAuthStatus();
          }
        }, 1000);

        // Also check auth status periodically in case the window doesn't close properly
        setTimeout(async () => {
          clearInterval(checkWindowClosed);
          await checkAuthStatus();
        }, 30000); // 30 second timeout
      }
    } catch (error) {
      console.error('Failed to initiate login:', error);
    }
  };

  const logout = async () => {
    try {
      await fetch(`${API_BASE_URL}/auth/spotify/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      setIsAuthenticated(false);
      setUser(null);
      setActiveDevice(null);
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const value: AuthContextType = {
    isAuthenticated,
    isLoading,
    user,
    activeDevice,
    login,
    logout,
    checkAuthStatus,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

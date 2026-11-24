import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/auth.service';
import type { AuthUser, LoginRequest } from '../types';

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = () => {
      const storedToken = authService.getToken();
      const storedUser = authService.getUser();
      const role = (storedUser?.role || '').toLowerCase();
      
      if (storedToken && storedUser && (role === 'admin' || role === 'super_admin')) {
        setToken(storedToken);
        setUser(storedUser);
      } else if (storedToken || storedUser) {
        authService.logout();
        setToken(null);
        setUser(null);
      }
      setIsLoading(false);
    };
    
    initAuth();
  }, []);

  const login = async (credentials: LoginRequest) => {
    const response = await authService.login(credentials);
    const role = (response.user?.role || '').toLowerCase();
    if (role !== 'admin' && role !== 'super_admin') {
      authService.logout();
      throw new Error('Access denied. This application is restricted to authorized administrators.');
    }
    setToken(response.accessToken);
    setUser(response.user);
  };

  const logout = () => {
    authService.logout();
    setToken(null);
    setUser(null);
    window.location.href = '/login';
  };

  const isAuthed =
    !!token &&
    !!user &&
    ((user.role || '').toLowerCase() === 'admin' ||
      (user.role || '').toLowerCase() === 'super_admin');

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: isAuthed,
        login,
        logout,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    console.warn('useAuth must be used within an AuthProvider');
    return {
      user: null,
      token: null,
      isAuthenticated: false,
      login: async () => {},
      logout: () => {},
      isLoading: false,
    };
  }
  return context;
};

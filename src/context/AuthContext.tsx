import React, { useEffect, useState, createContext, useContext } from 'react';
import { api } from '../lib/api';
import { User, UserRole, LoginResponse } from '../types';

interface AuthContextType {
  user: User | null;
  username: string | null;
  role: UserRole | null;
  isAdmin: boolean;
  isCashier: boolean;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (
    tokenOrResponse: string | LoginResponse | { access: string; refresh?: string; user?: User },
    usernameFallback?: string
  ) => void;
  logout: () => void;
  refreshUserProfile: () => Promise<User | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const applyUserData = (userData: User) => {
    setUser(userData);
    setIsAuthenticated(true);
    api.setStoredUser(userData);
    if (userData.username) {
      localStorage.setItem('username', userData.username);
    }
  };

  const refreshUserProfile = async (): Promise<User | null> => {
    try {
      const freshUser = await api.getMe();
      applyUserData(freshUser);
      return freshUser;
    } catch (err: any) {
      // If token expired or unauthorized
      if (err?.status === 401) {
        logout();
      }
      return null;
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      const token = api.getToken();
      const storedUser = api.getStoredUser();
      const savedUsername = localStorage.getItem('username');

      if (token) {
        if (storedUser) {
          setUser(storedUser);
          setIsAuthenticated(true);
        } else if (savedUsername) {
          setUser({ username: savedUsername, role: 'ADMIN' });
          setIsAuthenticated(true);
        }

        // Fetch fresh profile from backend
        try {
          const freshUser = await api.getMe();
          applyUserData(freshUser);
        } catch (err: any) {
          if (err?.status === 401) {
            logout();
          }
        }
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const login = (
    tokenOrResponse: string | LoginResponse | { access: string; refresh?: string; user?: User },
    usernameFallback?: string
  ) => {
    if (typeof tokenOrResponse === 'string') {
      const token = tokenOrResponse;
      const uname = usernameFallback || 'admin';
      api.setToken(token);
      localStorage.setItem('username', uname);
      const fallbackUser: User = { username: uname, role: 'ADMIN' };
      setUser(fallbackUser);
      setIsAuthenticated(true);
      api.setStoredUser(fallbackUser);

      // Async fetch full profile
      api.getMe().then((freshUser) => {
        applyUserData(freshUser);
      }).catch((err) => {
        console.warn('Could not fetch user profile:', err);
      });
    } else {
      const { access, refresh, user: returnedUser } = tokenOrResponse;
      if (access) api.setToken(access);
      if (refresh) api.setRefreshToken(refresh);

      const resolvedUser: User = returnedUser || {
        username: usernameFallback || localStorage.getItem('username') || 'user',
        role: 'ADMIN'
      };

      applyUserData(resolvedUser);
    }
  };

  const logout = () => {
    api.removeToken();
    setUser(null);
    setIsAuthenticated(false);
  };

  const role: UserRole | null = user?.role || (user ? 'ADMIN' : null);
  const isAdmin = role === 'ADMIN';
  const isCashier = role === 'CASHIER';
  const username = user?.username || null;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-sm font-medium text-slate-600">Initializing Mediflex POS...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        username,
        role,
        isAdmin,
        isCashier,
        isAuthenticated,
        isLoading,
        login,
        logout,
        refreshUserProfile
      }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
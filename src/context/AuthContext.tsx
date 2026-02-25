import React, { useEffect, useState, createContext, useContext } from 'react';
import { api } from '../lib/api';
interface AuthContextType {
  user: string | null;
  isAuthenticated: boolean;
  login: (token: string, username: string) => void;
  logout: () => void;
}
const AuthContext = createContext<AuthContextType | undefined>(undefined);
export function AuthProvider({ children }: {children: React.ReactNode;}) {
  const [user, setUser] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    const token = api.getToken();
    const savedUser = localStorage.getItem('username');
    if (token && savedUser) {
      setUser(savedUser);
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, []);
  const login = (token: string, username: string) => {
    api.setToken(token);
    localStorage.setItem('username', username);
    setUser(username);
    setIsAuthenticated(true);
  };
  const logout = () => {
    api.removeToken();
    localStorage.removeItem('username');
    setUser(null);
    setIsAuthenticated(false);
  };
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>);

  }
  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        login,
        logout
      }}>

      {children}
    </AuthContext.Provider>);

}
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
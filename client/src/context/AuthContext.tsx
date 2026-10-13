import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { User, UserRole } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (data: any) => Promise<User>;
  register: (data: any) => Promise<User>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const response = await api.get('/auth/me');
      if (response.data.success && response.data.user) {
        const u = response.data.user;
        if (u.role) u.role = String(u.role).trim().toUpperCase() as UserRole;
        setUser(u);
      } else {
        localStorage.removeItem('token');
        setUser(null);
      }
    } catch (error) {
      localStorage.removeItem('token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials: any): Promise<User> => {
    const response = await api.post('/auth/login', credentials);
    if (response.data.success && response.data.user) {
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
      }
      const u = response.data.user;
      if (u.role) u.role = String(u.role).trim().toUpperCase() as UserRole;
      setUser(u);
      return u;
    }
    throw new Error(response.data.message || 'Login failed');
  };

  const register = async (userData: any): Promise<User> => {
    const response = await api.post('/auth/register', userData);
    if (response.data.success && response.data.user) {
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
      }
      const u = response.data.user;
      if (u.role) u.role = String(u.role).trim().toUpperCase() as UserRole;
      setUser(u);
      return u;
    }
    throw new Error(response.data.message || 'Registration failed');
  };

  const logout = async (): Promise<void> => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

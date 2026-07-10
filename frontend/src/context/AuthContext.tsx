import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  avatarUrl: string | null;
}

interface AuthContextProps {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<any>;
  register: (email: string, password: string, name: string, role?: string) => Promise<any>;
  logout: () => Promise<void>;
  updateUser: (updatedUser: User) => void;
  apiUrl: string;
}

const AuthContext = createContext<AuthContextProps | null>(null);

const API_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:5000/api'
  : `${window.location.origin}/api`;

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const savedToken = localStorage.getItem('token');
      if (!savedToken) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_URL}/auth/me`, {
          headers: {
            Authorization: `Bearer ${savedToken}`,
          },
        });
        const data = await response.json();

        if (response.ok && data.status === 'success') {
          setUser(data.user);
          setToken(savedToken);
        } else {
          localStorage.removeItem('token');
          setToken(null);
          setUser(null);
        }
      } catch (err) {
        console.error('Auth verification error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [token]);

  const login = async (email: string, password: string) => {
    setError(null);
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      localStorage.setItem('token', data.token);
      setToken(data.token);
      setUser(data.user);
      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const register = async (email: string, password: string, name: string, role = 'USER') => {
    setError(null);
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name, role }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      localStorage.setItem('token', data.token);
      setToken(data.token);
      setUser(data.user);
      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const logout = async () => {
    try {
      await fetch(`${API_URL}/auth/logout`, { method: 'POST' });
    } catch (err: any) {
      console.warn('Logout request failed:', err.message);
    } finally {
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
    }
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        error,
        login,
        register,
        logout,
        updateUser,
        apiUrl: API_URL,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

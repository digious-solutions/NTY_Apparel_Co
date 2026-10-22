// contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { toast } from 'sonner';

type User = {
  id: number;
  name: string;
  email: string;
  role: string;
};

type AuthContextType = {
  user: User | null;
  token: string | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  updateUser: (user: User) => void;
  signOut: () => Promise<void>;
  expireSession: () => void;
  isAdmin: () => boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL = (import.meta.env.VITE_API_URL || 'https://slategrey-cattle-753687.hostingersite.com').replace(/\/+$/, '');

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const clearSession = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
  };

  useEffect(() => {
    const storedToken = localStorage.getItem('auth_token');
    const storedUser = localStorage.getItem('auth_user');

    const restoreSession = async () => {
      if (!storedToken || !storedUser) {
        clearSession();
        setLoading(false);
        return;
      }

      try {
        JSON.parse(storedUser);
      } catch (error) {
        console.error('Failed to parse stored user:', error);
        clearSession();
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${storedToken}` },
        });

        if (response.status === 401) {
          clearSession();
          return;
        }

        if (!response.ok) {
          throw new Error(`Session validation failed (${response.status}).`);
        }

        const data = await response.json();
        const currentUser = data.data?.user as User | undefined;
        if (!currentUser) {
          throw new Error('Session validation returned no user.');
        }

        setToken(storedToken);
        setUser(currentUser);
        localStorage.setItem('auth_user', JSON.stringify(currentUser));
      } catch (error) {
        console.error('Failed to validate stored session:', error);
        toast.error('Session is expired. Login again to access your dashboard.');
      } finally {
        setLoading(false);
      }
    };

    void restoreSession();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/signin/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Sign in failed.');
      }

      const { user, token } = data.data;
      setUser(user);
      setToken(token);
      localStorage.setItem('auth_token', token);
      localStorage.setItem('auth_user', JSON.stringify(user));
      toast.success(data.message || 'Welcome back!');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Sign in failed. Please try again.';
      toast.error(message);
      throw error;
    }
  };

  const signUp = async (name: string, email: string, password: string) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/signup/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Sign up failed.');
      }

      const { user, token } = data.data;
      setUser(user);
      setToken(token);
      localStorage.setItem('auth_token', token);
      localStorage.setItem('auth_user', JSON.stringify(user));
      toast.success(data.message || 'Account created successfully!');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Sign up failed. Please try again.';
      toast.error(message);
      throw error;
    }
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem('auth_user', JSON.stringify(updatedUser));
  };

  const signOut = async () => {
    clearSession();
    toast.success('Signed out successfully.');
  };

  const isAdmin = () => {
    return user?.role === 'admin';
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, signIn, signUp, signOut, expireSession: clearSession, isAdmin, updateUser }}>
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
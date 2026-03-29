"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { CLEAN_API_URL as API_URL } from '@lib/shared/constants';

interface User {
  id: string;
  _id?: string;
  name: string;
  email: string;
  phone: number;
  role: string;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem('user');
      }
    }
    
    checkAuth(storedToken);
  }, []);

  useEffect(() => {
    if (isLoggingOut) return;

    if (status === 'authenticated' && session) {
      const googleToken = (session as any).accessToken;
      const googleUser = (session as any).user;

      if (googleToken && googleToken !== token) {
        setToken(googleToken);
        setUser(googleUser);
        localStorage.setItem('token', googleToken);
        localStorage.setItem('user', JSON.stringify(googleUser));
      }
    }
  }, [session, status, token, isLoggingOut]);

  const checkAuth = async (currentToken: string | null) => {
    if (!currentToken) {
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/user/me`, {
        headers: { 'Authorization': `Bearer ${currentToken}` }
      });

      if (res.ok) {
        const userData = await res.json();
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
      } else {
        setToken(null);
        setUser(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    } catch (error) {
      console.error('Error verifying token:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch(`${API_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Đăng nhập thất bại');

      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
    } catch (error) {
      throw error;
    }
  };

  const register = async (formData: any) => {
    try {
      const res = await fetch(`${API_URL}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Đăng ký thất bại');
      
      if (data.token) {
         setToken(data.token);
         setUser(data.user);
         localStorage.setItem('token', data.token);
         localStorage.setItem('user', JSON.stringify(data.user));
      }
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      setIsLoggingOut(true);
      if (status === 'authenticated') {
        await signOut({ redirect: false });
      }
      setToken(null);
      setUser(null);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const refreshUser = async () => {
    if (token) await checkAuth(token);
  };

  return (
    <AuthContext.Provider value={{ 
      user, token, isAuthenticated: !!token, isLoading, 
      login, register, logout, updateUser, refreshUser
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

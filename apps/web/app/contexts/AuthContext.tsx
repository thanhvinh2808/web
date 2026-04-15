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
  phone: string;
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

  // 1. Initial Load from LocalStorage
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken) {
      setToken(storedToken);
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (e) {
          localStorage.removeItem('user');
        }
      }
      checkAuth(storedToken);
    } else {
      setIsLoading(false);
    }
  }, []);

  // 2. ✅ SENIOR FIX: Handle NextAuth Session Sync
  // When Google Login is successful, we get an accessToken and userId
  useEffect(() => {
    if (isLoggingOut) return;

    if (status === 'authenticated' && session) {
      const googleToken = (session as any).accessToken;
      if (googleToken && googleToken !== token) {
        setToken(googleToken);
        localStorage.setItem('token', googleToken);
        // Trình kích hoạt fetch dữ liệu user chi tiết từ backend
        checkAuth(googleToken);
      }
    }
  }, [session, status, token, isLoggingOut]);

  const sanitizeUser = (rawUser: any): User | null => {
    if (!rawUser) return null;
    return {
      id: rawUser.id || rawUser._id,
      _id: rawUser._id || rawUser.id,
      name: rawUser.name,
      email: rawUser.email,
      phone: rawUser.phone || '',
      role: rawUser.role,
      avatar: rawUser.avatar // Ở đây avatar đã là URL từ Backend nên rất nhẹ
    };
  };

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
        const data = await res.json();
        if (data.success && data.user) {
          const cleanUser = sanitizeUser(data.user);
          setUser(cleanUser);
          localStorage.setItem('user', JSON.stringify(cleanUser));
        }
      } else {
        // Token expired or invalid
        if (status !== 'loading') logout();
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

      const cleanUser = sanitizeUser(data.user);
      setToken(data.token);
      setUser(cleanUser);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(cleanUser));
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
         const cleanUser = sanitizeUser(data.user);
         setToken(data.token);
         setUser(cleanUser);
         localStorage.setItem('token', data.token);
         localStorage.setItem('user', JSON.stringify(cleanUser));
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
      
      // Cleanup cookies
      document.cookie.split(";").forEach((c) => {
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const updateUser = (updatedUser: User) => {
    const cleanUser = sanitizeUser(updatedUser);
    setUser(cleanUser);
    localStorage.setItem('user', JSON.stringify(cleanUser));
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

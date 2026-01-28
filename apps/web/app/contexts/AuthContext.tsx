// app/contexts/AuthContext.tsx
"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export interface User {
  id: string;
  _id: string;
  name: string;
  email: string;
  role?: string;
  phone?: string;
  address?: string;
  city?: string;
  district?: string;
  ward?: string;
  dateOfBirth?: string;
  gender?: string;
  avatar?: string;
  createdAt?: string;
  updatedAt?: string;
  token: string;
  notes?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (userData: any) => Promise<void>;
  updateProfile: (userData: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // ✅ Auto-refresh token trước khi hết hạn
  useEffect(() => {
    if (!isAuthenticated) return;

    // Refresh sau 8 phút (trước khi token 10 phút hết hạn)
    const interval = setInterval(() => {
      refreshAccessToken();
    }, 8 * 60 * 1000);

    return () => clearInterval(interval);
  }, [isAuthenticated]);

  // ✅ Refresh access token
  const refreshAccessToken = async () => {
  try {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      console.log('⚠️ No refresh token found');
      return;
    }

    console.log('🔄 Refreshing access token...');
    
    const response = await fetch(`${API_URL}/api/refresh-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken })
    });

    if (response.ok) {
      const data = await response.json();
      localStorage.setItem('token', data.token);
      const expiresAt = new Date().getTime() + data.expiresIn * 1000;
      localStorage.setItem('tokenExpiresAt', expiresAt.toString());
      
      // ✅ CẬP NHẬT TOKEN TRONG USER
      if (user) {
        const updatedUser = { ...user, token: data.token };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
      
      console.log('✅ Token refreshed successfully');
    } else {
      console.warn('⚠️ Failed to refresh token, logging out...');
      await logout();
    }
  } catch (error) {
    console.error('❌ Refresh token error:', error);
    await logout();
  }
};

  // ✅ Kiểm tra auth khi load trang
  useEffect(() => {
    const checkAuth = () => {
  if (typeof window === 'undefined') {
    setIsLoading(false);
    return;
  }

  try {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    const expiresAt = localStorage.getItem('tokenExpiresAt');

    if (!token || !storedUser) {
      setUser(null);
      setIsAuthenticated(false);
      setIsLoading(false);
      return;
    }

    // Kiểm tra token hết hạn
    if (expiresAt && new Date().getTime() > parseInt(expiresAt)) {
      localStorage.clear();
      setUser(null);
      setIsAuthenticated(false);
      setIsLoading(false);
      return;
    }

    // ✅ Parse user và thêm token nếu chưa có
    const parsedUser = JSON.parse(storedUser);
    const userWithToken = {
      ...parsedUser,
      token: parsedUser.token || token // ✅ Đảm bảo user luôn có token
    };
    
    // Tạm thời set User trước để UI không bị giật, nhưng sẽ verify ngầm
    setUser(userWithToken);
    setIsAuthenticated(true);
    
    // 🔥 VERIFY TOKEN WITH BACKEND (FIX LỖI LOGIN ẢO)
    fetch(`${API_URL}/api/user/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    }).then(res => {
      if (!res.ok) {
        console.warn('⚠️ Token invalid or expired (System Reset), logging out...');
        localStorage.clear(); // Xóa sạch LocalStorage
        setUser(null);
        setIsAuthenticated(false);
        // Nếu đang ở trang profile thì đá về login
        if (window.location.pathname.startsWith('/profile')) {
          window.location.href = '/login';
        }
      } else {
        console.log('✅ Token verified with server');
      }
    }).catch(err => {
      console.error('❌ Token verification failed (network error?):', err);
      // Giữ nguyên state nếu lỗi mạng, không logout vội để tránh UX tệ khi rớt mạng
    }).finally(() => {
      setIsLoading(false);
    });
    
  } catch (error) {
    console.error('❌ Auth check error:', error);
    setUser(null);
    setIsAuthenticated(false);
    setIsLoading(false);
  }
};

    checkAuth();
  }, []);

const login = async (email: string, password: string) => {
  try {
    console.log('🔐 Logging in to:', `${API_URL}/api/login`);
    
    const response = await fetch(`${API_URL}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Đăng nhập thất bại');
    }

    const data = await response.json();
    console.log('📥 Login response:', data);
    
    // ✅ THÊM TOKEN VÀO USER OBJECT
    const userWithToken = {
      ...data.user,
      token: data.token // ✅ Thêm token vào user
    };
    
    // Lưu tokens và thời gian hết hạn
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', data.token);
      localStorage.setItem('refreshToken', data.refreshToken);
      const expiresAt = new Date().getTime() + (data.expiresIn || 600) * 1000;
      localStorage.setItem('tokenExpiresAt', expiresAt.toString());
      localStorage.setItem('user', JSON.stringify(userWithToken)); // ✅ Lưu user có token
    }
    
    setUser(userWithToken); // ✅ Set user có token
    setIsAuthenticated(true);

    const redirectUrl = sessionStorage.getItem('redirectAfterLogin') || '/';
    sessionStorage.removeItem('redirectAfterLogin');
    
    console.log('🔄 Redirecting to:', redirectUrl);
    window.location.href = redirectUrl;
    
  } catch (error: any) {
    console.error('❌ Login error:', error);
    throw error;
  }
};


  const logout = async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null;
      
      // Gọi API logout
      if (token) {
        try {
          await fetch(`${API_URL}/api/logout`, {
            method: 'POST',
            headers: { 
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ refreshToken })
          });
        } catch (error) {
          console.warn('⚠️ Logout API error (ignored):', error);
        }
      }

      // Xóa tất cả dữ liệu local
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('tokenExpiresAt');
        localStorage.removeItem('user');
        localStorage.removeItem('orders');
        localStorage.removeItem('defaultShippingInfo');
        localStorage.removeItem('cart');
      }

      setUser(null);
      setIsAuthenticated(false);
      
      router.push('/login');
      console.log('👋 Logged out successfully');
    } catch (error) {
      console.error('❌ Logout error:', error);
      router.push('/login');
    }
  };

  const register = async (userData: any) => {
  try {
    console.log('📤 Registering to:', `${API_URL}/api/register`);
    
    const response = await fetch(`${API_URL}/api/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });

    const data = await response.json();
    console.log('📥 Register response:', data);

    if (!response.ok) {
      throw new Error(data.message || 'Đăng ký thất bại');
    }
    
    // ✅ THÊM TOKEN VÀO USER
    const userWithToken = {
      ...data.user,
      token: data.token
    };
    
    // Lưu tokens
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', data.token);
      if (data.refreshToken) {
        localStorage.setItem('refreshToken', data.refreshToken);
        const expiresAt = new Date().getTime() + (data.expiresIn || 600) * 1000;
        localStorage.setItem('tokenExpiresAt', expiresAt.toString());
      }
      localStorage.setItem('user', JSON.stringify(userWithToken)); // ✅ Lưu user có token
    }
    
    setUser(userWithToken); // ✅ Set user có token
    setIsAuthenticated(true);
    
    router.push('/');
  } catch (error: any) {
    console.error('❌ Register error:', error);
    throw error;
  }
};
  const updateProfile = async (userData: Partial<User>) => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      
      if (!token) {
        throw new Error('No authentication token');
      }

      const response = await fetch(`${API_URL}/api/user/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(userData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Cập nhật thất bại');
      }

      const updatedUser = await response.json();
      setUser(updatedUser);
      
      if (typeof window !== 'undefined') {
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
    } catch (error: any) {
      console.error('❌ Update profile error:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        login,
        logout,
        register,
        updateProfile
      }}
    >
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
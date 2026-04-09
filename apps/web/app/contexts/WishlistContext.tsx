"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';

interface Product {
  _id: string;
  name: string;
  price: number;
  image: string;
  slug: string;
  [key: string]: any;
}

interface WishlistContextType {
  wishlist: Product[];
  isLoading: boolean;
  toggleWishlist: (product: Product) => Promise<void>;
  isInWishlist: (productId: string) => boolean;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

import { CLEAN_API_URL } from '@lib/shared/constants';
const API_URL = CLEAN_API_URL;

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [wishlist, setWishlist] = useState<Product[]>([]);
  const [isWishlistLoading, setIsWishlistLoading] = useState(true);
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();

  const fetchWishlist = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setWishlist([]);
      setIsWishlistLoading(false);
      return;
    }

    try {
      setIsWishlistLoading(true);
      const response = await fetch(`${API_URL}/api/wishlist`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        setWishlist(result.data || []);
      }
    } catch (error) {
      console.error('❌ Error fetching wishlist:', error);
    } finally {
      setIsWishlistLoading(false);
    }
  };

  useEffect(() => {
    // Đợi AuthContext tải xong (xác minh token/session) rồi mới hành động
    if (!isAuthLoading) {
      if (isAuthenticated) {
        fetchWishlist();
      } else {
        setWishlist([]);
        setIsWishlistLoading(false);
      }
    }
  }, [isAuthenticated, isAuthLoading]);

  const toggleWishlist = async (product: Product) => {
    if (!isAuthenticated) {
      console.error('Vui lòng đăng nhập để thêm vào yêu thích');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/wishlist/toggle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ productId: product._id })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.action === 'added') {
          // Khi thêm, ta lấy dữ liệu product từ tham số để update UI ngay lập tức
          setWishlist(prev => [...prev, product]);
        } else {
          setWishlist(prev => prev.filter(p => p._id !== product._id));
        }
      }
    } catch (error) {
      console.error('❌ Error toggling wishlist:', error);
    }
  };

  const isInWishlist = (productId: string) => {
    return wishlist.some(p => p._id === productId);
  };

  return (
    <WishlistContext.Provider value={{ wishlist, isLoading: isWishlistLoading, toggleWishlist, isInWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}

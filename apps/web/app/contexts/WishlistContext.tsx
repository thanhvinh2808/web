"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { toast } from 'react-hot-toast';

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

const API_URL = process.env.NEXT_PUBLIC_API_URL || '$ {process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}';

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [wishlist, setWishlist] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user, isAuthenticated } = useAuth();

  const fetchWishlist = async () => {
    if (!isAuthenticated) {
      setWishlist([]);
      setIsLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
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
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, [isAuthenticated]);

  const toggleWishlist = async (product: Product) => {
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập để thêm vào yêu thích');
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
          setWishlist(prev => [...prev, product]);
          toast.success('Đã thêm vào danh sách yêu thích');
        } else {
          setWishlist(prev => prev.filter(p => p._id !== product._id));
          toast.success('Đã xóa khỏi danh sách yêu thích');
        }
      }
    } catch (error) {
      console.error('❌ Error toggling wishlist:', error);
      toast.error('Có lỗi xảy ra, vui lòng thử lại');
    }
  };

  const isInWishlist = (productId: string) => {
    return wishlist.some(p => p._id === productId);
  };

  return (
    <WishlistContext.Provider value={{ wishlist, isLoading, toggleWishlist, isInWishlist }}>
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

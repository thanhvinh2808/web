// components/ClientProviders.tsx
"use client";

import { ReactNode } from 'react';
import { CartProvider } from '../app/contexts/CartContext';
import { WishlistProvider } from '../app/contexts/WishlistContext';
import { useAuth } from '../app/contexts/AuthContext';
import { useOrderUpdates, useAdminUpdates } from '../app/contexts/SocketContext';

export default function ClientProviders({ children }: { children: ReactNode }) {
  // ✅ useAuth() có thể dùng vì ClientProviders nằm BÊN TRONG AuthProvider (trong layout.tsx)
  const { user, isLoading } = useAuth();
  
  // ✅ Ưu tiên _id (MongoDB), fallback về id
  const userId = user?._id || user?.id || null;
  const isAdmin = user?.role === 'admin';
  
  // ✅ Kích hoạt Socket để nhận realtime updates (Join room user & admin)
  useOrderUpdates(userId || undefined);
  useAdminUpdates(isAdmin);
  
  console.log('🛒 ClientProviders render - userId:', userId, 'isAdmin:', isAdmin, 'isLoading:', isLoading);
  
  return (
    <WishlistProvider userId={userId}>
      <CartProvider userId={userId}>
        {children}
      </CartProvider>
    </WishlistProvider>
  );
}
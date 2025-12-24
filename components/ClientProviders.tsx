// components/ClientProviders.tsx
"use client";

import { ReactNode } from 'react';
import { CartProvider } from '@/app/contexts/CartContext';
import { useAuth } from '@/app/contexts/AuthContext';

export default function ClientProviders({ children }: { children: ReactNode }) {
  // ✅ useAuth() có thể dùng vì ClientProviders nằm BÊN TRONG AuthProvider (trong layout.tsx)
  const { user, isLoading } = useAuth();
  
  // ✅ Ưu tiên _id (MongoDB), fallback về id
  const userId = user?._id || user?.id || null;
  
  console.log('🛒 ClientProviders render - userId:', userId, 'isLoading:', isLoading);
  
  return (
    <CartProvider userId={userId}>
      {children}
    </CartProvider>
  );
}
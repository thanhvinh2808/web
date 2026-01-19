// app/contexts/CartContext.tsx
"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface VariantOption {
  name: string;
  price: number;
  stock: number;
  sku: string;
  image: string;
}

interface Variant {
  name: string;
  options: VariantOption[];
}

// --- TYPES ---
interface Product {
  _id: string; // Đổi sang string cho chuẩn MongoDB
  id?: string;
  name: string;
  brand?: string;
  price: number;
  originalPrice?: number;
  rating?: number;
  image?: string;
  images?: string[];
  description?: string;
  category?: string;
  stock?: number;
  variants?: Variant[];
  slug?: string;
}

interface CartItem {
  product: Product;
  quantity: number;
  selectedVariant?: VariantOption;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number, selectedVariant?: VariantOption) => void;
  updateQuantity: (productId: string, variantKey: string | null, newQty: number) => void;
  removeItem: (productId: string, variantKey?: string | null) => void;
  totalItems: number;
  totalPrice: number;
  clearCart: () => void;
  getTotalPrice: () => number;
  getTotalItems: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);
const CART_STORAGE_PREFIX = 'footmark_cart_user_';

export const CartProvider = ({ 
  children, 
  userId 
}: { 
  children: ReactNode;
  userId?: string | number | null;
}) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  const getStorageKey = () => {
    if (!userId) return `${CART_STORAGE_PREFIX}guest`;
    return `${CART_STORAGE_PREFIX}${userId}`;
  };

  // Helper: Tạo Unique Key cho Variant (Dùng Name làm chuẩn nếu ko có SKU)
  const getVariantKey = (variant?: VariantOption | null): string | null => {
    if (!variant) return null;
    return variant.name; // Size 40, Size 41...
  };

  // 1. Load Cart
  useEffect(() => {
    setIsInitialized(false);
    try {
      const storageKey = getStorageKey();
      const savedCart = localStorage.getItem(storageKey);
      if (savedCart) {
        setCart(JSON.parse(savedCart));
      } else {
        setCart([]);
      }
    } catch (error) {
      console.error('Lỗi load cart:', error);
      setCart([]);
    } finally {
      setIsInitialized(true);
    }
  }, [userId]);

  // 2. Save Cart
  useEffect(() => {
    if (isInitialized) {
      try {
        const storageKey = getStorageKey();
        localStorage.setItem(storageKey, JSON.stringify(cart));
      } catch (error) {
        console.error('Lỗi save cart:', error);
      }
    }
  }, [cart, isInitialized, userId]);

  const clearCart = () => setCart([]);

  const getTotalPrice = () => {
    return cart.reduce((total, item) => {
      const price = item.selectedVariant?.price || item.product.price;
      return total + (price * item.quantity);
    }, 0);
  };

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  // ✅ ADD TO CART (Logic mới)
  const addToCart = (product: Product, quantity: number = 1, selectedVariant?: VariantOption) => {
    setCart(prevCart => {
      const productId = product._id || product.id;
      const variantKey = getVariantKey(selectedVariant);

      const existingIndex = prevCart.findIndex(item => {
        const itemId = item.product._id || item.product.id;
        const itemKey = getVariantKey(item.selectedVariant);
        return itemId === productId && itemKey === variantKey;
      });

      if (existingIndex > -1) {
        // Trùng ID và Size -> Tăng số lượng
        const newCart = [...prevCart];
        newCart[existingIndex].quantity += quantity;
        return newCart;
      } else {
        // Khác Size -> Thêm dòng mới
        return [...prevCart, { product, quantity, selectedVariant }];
      }
    });
  };

  // ✅ UPDATE QUANTITY
  const updateQuantity = (productId: string, variantKey: string | null, newQty: number) => {
    if (newQty <= 0) {
      removeItem(productId, variantKey);
      return;
    }
    
    setCart(prevCart =>
      prevCart.map(item => {
        const itemId = item.product._id || item.product.id;
        const itemKey = getVariantKey(item.selectedVariant);
        
        if (itemId === productId && itemKey === variantKey) {
          return { ...item, quantity: newQty };
        }
        return item;
      })
    );
  };

  // ✅ REMOVE ITEM
  const removeItem = (productId: string, variantKey?: string | null) => {
    setCart(prevCart => 
      prevCart.filter(item => {
        const itemId = item.product._id || item.product.id;
        const itemKey = getVariantKey(item.selectedVariant);
        
        // Giữ lại nếu khác ID
        if (itemId !== productId) return true;
        
        // Giữ lại nếu cùng ID nhưng khác Size
        if (itemKey !== (variantKey || null)) return true;
        
        return false;
      })
    );
  };

  return (
    <CartContext.Provider 
      value={{ 
        cart, 
        addToCart, 
        updateQuantity, 
        removeItem, 
        totalItems: getTotalItems(), 
        totalPrice: getTotalPrice(), 
        clearCart, 
        getTotalPrice, 
        getTotalItems 
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart phải được dùng bên trong một CartProvider');
  }
  return context;
};
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
  updateQuantity: (productId: string, variantSku: string | null, newQty: number) => void;
  removeItem: (productId: string, variantSku?: string | null) => void;
  totalItems: number;
  totalPrice: number;
  clearCart: () => void;
  getTotalPrice: () => number;
  getTotalItems: () => number;
}

// --- Tạo Context ---
const CartContext = createContext<CartContextType | undefined>(undefined);

// --- KEY PREFIX để lưu vào localStorage ---
const CART_STORAGE_PREFIX = 'footmark_cart_user_'; // Đổi prefix

// --- Provider ---
export const CartProvider = ({ 
  children, 
  userId 
}: { 
  children: ReactNode;
  userId?: string | number | null;
}) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Tạo key dựa trên userId
  const getStorageKey = () => {
    if (!userId) return `${CART_STORAGE_PREFIX}guest`;
    return `${CART_STORAGE_PREFIX}${userId}`;
  };

  // ✅ 1. KHÔI PHỤC giỏ hàng từ localStorage
  useEffect(() => {
    setIsInitialized(false);
    try {
      const storageKey = getStorageKey();
      const savedCart = localStorage.getItem(storageKey);
      if (savedCart) {
        const parsedCart = JSON.parse(savedCart);
        setCart(parsedCart);
      } else {
        setCart([]);
      }
    } catch (error) {
      console.error('Lỗi khi đọc giỏ hàng từ localStorage:', error);
      setCart([]);
    } finally {
      setIsInitialized(true);
    }
  }, [userId]);

  // ✅ 2. TỰ ĐỘNG LƯU giỏ hàng vào localStorage
  useEffect(() => {
    if (isInitialized) {
      try {
        const storageKey = getStorageKey();
        localStorage.setItem(storageKey, JSON.stringify(cart));
      } catch (error) {
        console.error('Lỗi khi lưu giỏ hàng vào localStorage:', error);
      }
    }
  }, [cart, isInitialized, userId]);

  // ✅ Xóa toàn bộ giỏ hàng
  const clearCart = () => {
    setCart([]);
  };

  // ✅ Tính tổng tiền
  const getTotalPrice = () => {
    return cart.reduce((total, item) => {
      const price = item.selectedVariant?.price || item.product.price;
      return total + (price * item.quantity);
    }, 0);
  };

  // ✅ Tính tổng số lượng sản phẩm
  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  // ✅ Thêm sản phẩm vào giỏ
  const addToCart = (product: Product, quantity: number = 1, selectedVariant?: VariantOption) => {
    setCart(prevCart => {
      // Tìm item trùng khớp (cùng ID và cùng Variant SKU)
      const existingItemIndex = prevCart.findIndex(item => {
        const sameProduct = item.product._id === product._id || item.product.id === product.id;
        const sameVariant = (item.selectedVariant?.sku || null) === (selectedVariant?.sku || null);
        return sameProduct && sameVariant;
      });

      if (existingItemIndex > -1) {
        // Tăng số lượng
        const newCart = [...prevCart];
        newCart[existingItemIndex].quantity += quantity;
        return newCart;
      } else {
        // Thêm mới
        return [...prevCart, { 
          product, 
          quantity, 
          selectedVariant: selectedVariant 
        }];
      }
    });
  };

  // ✅ Cập nhật số lượng
  const updateQuantity = (productId: string, variantSku: string | null, newQty: number) => {
    if (newQty <= 0) {
      removeItem(productId, variantSku);
      return;
    }
    
    setCart(prevCart =>
      prevCart.map(item => {
        const itemId = item.product._id || item.product.id;
        const itemSku = item.selectedVariant?.sku || null;
        
        if (itemId === productId && itemSku === variantSku) {
          return { ...item, quantity: newQty };
        }
        return item;
      })
    );
  };

  // ✅ Xóa sản phẩm khỏi giỏ
  const removeItem = (productId: string, variantSku?: string | null) => {
    setCart(prevCart => 
      prevCart.filter(item => {
        const itemId = item.product._id || item.product.id;
        const itemSku = item.selectedVariant?.sku || null;
        const targetSku = variantSku || null;
        
        // Nếu không trùng ID -> giữ lại
        if (itemId !== productId) return true;
        
        // Nếu trùng ID -> kiểm tra SKU
        if (itemSku !== targetSku) return true;
        
        // Trùng cả ID và SKU -> Xóa (return false)
        return false;
      })
    );
  };

  const totalItems = getTotalItems();
  const totalPrice = getTotalPrice();

  return (
    <CartContext.Provider 
      value={{ 
        cart, 
        addToCart, 
        updateQuantity, 
        removeItem, 
        totalItems, 
        totalPrice, 
        clearCart, 
        getTotalPrice, 
        getTotalItems 
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

// --- Hook để sử dụng Cart ---
export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart phải được dùng bên trong một CartProvider');
  }
  return context;
};

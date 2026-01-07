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
  _id: number;
  id: number;
  name: string;
  brand: string;
  price: number;
  originalPrice: number;
  rating: number;
  image: string;
  description: string;
  category?: string;
  stock?: number;
  variants?: Variant[];
}

interface CartItem {
  product: Product;
  quantity: number;
  selectedVariant?: VariantOption; // ✅ Đã có
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product, selectedVariant?: VariantOption, quantity?: number) => void; // ✅ Thêm selectedVariant
  updateQuantity: (productId: number, variantSku: string | null, newQty: number) => void; // ✅ Thêm variantSku
  removeItem: (productId: number, variantSku?: string | null) => void; // ✅ Thêm variantSku
  totalItems: number;
  totalPrice: number;
  clearCart: () => void;
  getTotalPrice: () => number;
  getTotalItems: () => number;
}

// --- Tạo Context ---
const CartContext = createContext<CartContextType | undefined>(undefined);

// --- KEY PREFIX để lưu vào localStorage ---
const CART_STORAGE_PREFIX = 'shopping_cart_user_';

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

  // ✅ Tính tổng tiền (dựa trên giá của variant hoặc product)
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

  // ✅ Thêm sản phẩm vào giỏ (HỖ TRỢ VARIANT)
  const addToCart = (product: Product, selectedVariant?: VariantOption, quantity: number = 1) => {
    setCart(prevCart => {
      // Tìm item có cùng product ID VÀ cùng variant SKU
      const existingItem = prevCart.find(item => 
        item.product._id === product._id && 
        item.selectedVariant?.sku === selectedVariant?.sku
      );

      if (existingItem) {
        // Nếu đã tồn tại -> tăng số lượng
        return prevCart.map(item =>
          item.product._id === product._id && 
          item.selectedVariant?.sku === selectedVariant?.sku
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        // Nếu chưa tồn tại -> thêm mới
        return [...prevCart, { 
          product, 
          quantity, 
          selectedVariant: selectedVariant || undefined 
        }];
      }
    });
  };

  // ✅ Cập nhật số lượng (HỖ TRỢ VARIANT)
  const updateQuantity = (productId: number, variantSku: string | null, newQty: number) => {
    if (newQty <= 0) {
      removeItem(productId, variantSku);
      return;
    }
    
    setCart(prevCart =>
      prevCart.map(item => {
        const itemSku = item.selectedVariant?.sku || null;
        if (item.product._id === productId && itemSku === variantSku) {
          return { ...item, quantity: newQty };
        }
        return item;
      })
    );
  };

  // ✅ Xóa sản phẩm khỏi giỏ (HỖ TRỢ VARIANT)
  const removeItem = (productId: number, variantSku?: string | null) => {
    setCart(prevCart => 
      prevCart.filter(item => {
        const itemSku = item.selectedVariant?.sku || null;
        const targetSku = variantSku || null;
        
        // Nếu không có variantSku, chỉ so sánh productId
        if (targetSku === null) {
          return !(item.product._id === productId && itemSku === null);
        }
        
        // Nếu có variantSku, so sánh cả productId và SKU
        return !(item.product._id === productId && itemSku === targetSku);
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
// app/contexts/CartContext.tsx
"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

import { Voucher } from '../types/voucher';

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
  _id: string; 
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
  selectedColor?: string; 
  selected: boolean; // ✅ Trạng thái checkbox (Shopee style)
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number, selectedVariant?: VariantOption, selectedColor?: string) => void;
  updateQuantity: (productId: string, variantKey: string | null, color: string | null, newQty: number) => void;
  removeItem: (productId: string, variantKey?: string | null, color?: string | null) => void;
  toggleSelectItem: (productId: string, variantKey?: string | null, color?: string | null) => void;
  toggleAllItems: (isSelected: boolean) => void;
  clearCart: () => void;
  getTotalPrice: () => number; // Tổng giỏ hàng (tất cả)
  getSelectedTotalPrice: () => number; // Tổng tiền các món được chọn
  getTotalItems: () => number;
  getSelectedItemsCount: () => number;
  selectedVoucher: Voucher | null;
  setSelectedVoucher: (voucher: Voucher | null) => void;
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
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const getStorageKey = () => {
    if (!userId) return `${CART_STORAGE_PREFIX}guest`;
    return `${CART_STORAGE_PREFIX}${userId}`;
  };

  const getVoucherStorageKey = () => {
     return `${getStorageKey()}_voucher`;
  };

  const getVariantKey = (variant?: VariantOption | null): string | null => {
    if (!variant) return null;
    return variant.name;
  };

  // 1. Load Cart & Voucher
  useEffect(() => {
    setIsInitialized(false);
    try {
      const storageKey = getStorageKey();
      const savedCart = localStorage.getItem(storageKey);
      if (savedCart) {
        const parsedCart = JSON.parse(savedCart);
        // Đảm bảo các item cũ cũng có trường selected
        setCart(parsedCart.map((item: any) => ({
          ...item,
          selected: item.selected !== undefined ? item.selected : true
        })));
      } else {
        setCart([]);
      }

      const savedVoucher = localStorage.getItem(getVoucherStorageKey());
      if (savedVoucher) {
         setSelectedVoucher(JSON.parse(savedVoucher));
      } else {
         setSelectedVoucher(null);
      }
    } catch (error) {
      console.error('Lỗi load cart:', error);
      setCart([]);
    } finally {
      setIsInitialized(true);
    }
  }, [userId]);

  // 2. Save Cart & Voucher
  useEffect(() => {
    if (isInitialized) {
      const storageKey = getStorageKey();
      localStorage.setItem(storageKey, JSON.stringify(cart));
      
      const vKey = getVoucherStorageKey();
      if (selectedVoucher) {
         localStorage.setItem(vKey, JSON.stringify(selectedVoucher));
      } else {
         localStorage.removeItem(vKey);
      }
    }
  }, [cart, selectedVoucher, isInitialized, userId]);

  const clearCart = () => {
     setCart([]);
     setSelectedVoucher(null);
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => {
      const basePrice = item.product.price || 0;
      const surcharge = item.selectedVariant?.price || 0;
      return total + ((basePrice + surcharge) * item.quantity);
    }, 0);
  };

  // ✅ Tính tổng tiền của những món được tích chọn
  const getSelectedTotalPrice = () => {
    return cart
      .filter(item => item.selected)
      .reduce((total, item) => {
        const basePrice = item.product.price || 0;
        const surcharge = item.selectedVariant?.price || 0;
        return total + ((basePrice + surcharge) * item.quantity);
      }, 0);
  };

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const getSelectedItemsCount = () => {
    return cart.filter(item => item.selected).reduce((total, item) => total + item.quantity, 0);
  };

  // ✅ Toggle chọn 1 sản phẩm
  const toggleSelectItem = (productId: string, variantKey?: string | null, color?: string | null) => {
    setCart(prevCart => prevCart.map(item => {
      const itemId = String(item.product._id || item.product.id);
      const itemKey = getVariantKey(item.selectedVariant);
      const itemColor = item.selectedColor || null;
      
      if (itemId === productId && itemKey === (variantKey || null) && itemColor === (color || null)) {
        return { ...item, selected: !item.selected };
      }
      return item;
    }));
  };

  // ✅ Chọn tất cả / Bỏ chọn tất cả
  const toggleAllItems = (isSelected: boolean) => {
    setCart(prevCart => prevCart.map(item => ({ ...item, selected: isSelected })));
  };

  // ✅ ADD TO CART
  const addToCart = (product: Product, quantity: number = 1, selectedVariant?: VariantOption, selectedColor?: string) => {
    setCart(prevCart => {
      const productId = String(product._id || product.id);
      const variantKey = getVariantKey(selectedVariant);
      const colorKey = selectedColor || null;
      const maxStock = selectedVariant ? selectedVariant.stock : (product.stock || 0);

      const existingIndex = prevCart.findIndex(item => {
        const itemId = String(item.product._id || item.product.id);
        const itemKey = getVariantKey(item.selectedVariant);
        const itemColor = item.selectedColor || null;
        return itemId === productId && itemKey === variantKey && itemColor === colorKey;
      });

      if (existingIndex > -1) {
        const currentQty = prevCart[existingIndex].quantity;
        const potentialQty = Math.min(currentQty + quantity, maxStock);
        
        return prevCart.map((item, index) => 
          index === existingIndex 
            ? { ...item, quantity: potentialQty, selected: true } // Luôn chọn khi vừa thêm
            : item
        );
      } else {
        const finalQty = Math.min(quantity, maxStock);
        return [...prevCart, { product, quantity: finalQty, selectedVariant, selectedColor, selected: true }];
      }
    });
  };

  const updateQuantity = (productId: string, variantKey: string | null, color: string | null, newQty: number) => {
    if (newQty <= 0) {
      removeItem(productId, variantKey, color);
      return;
    }
    
    setCart(prevCart =>
      prevCart.map(item => {
        const itemId = String(item.product._id || item.product.id);
        const itemKey = getVariantKey(item.selectedVariant);
        const itemColor = item.selectedColor || null;
        
        if (itemId === productId && itemKey === variantKey && itemColor === color) {
          return { ...item, quantity: newQty };
        }
        return item;
      })
    );
  };

  const removeItem = (productId: string, variantKey?: string | null, color?: string | null) => {
    setCart(prevCart => 
      prevCart.filter(item => {
        const itemId = String(item.product._id || item.product.id);
        const itemKey = getVariantKey(item.selectedVariant);
        const itemColor = item.selectedColor || null;
        
        if (itemId !== productId) return true;
        if (itemKey !== (variantKey || null)) return true;
        if (itemColor !== (color || null)) return true;
        
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
        toggleSelectItem,
        toggleAllItems,
        clearCart, 
        getTotalPrice, 
        getSelectedTotalPrice,
        getTotalItems, 
        getSelectedItemsCount,
        selectedVoucher,
        setSelectedVoucher
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

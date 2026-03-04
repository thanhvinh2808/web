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
  selectedColor?: string; // ✅ Thêm field màu sắc
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number, selectedVariant?: VariantOption, selectedColor?: string) => void;
  updateQuantity: (productId: string, variantKey: string | null, color: string | null, newQty: number) => void;
  removeItem: (productId: string, variantKey?: string | null, color?: string | null) => void;
  totalItems: number;
  totalPrice: number;
  clearCart: () => void;
  getTotalPrice: () => number;
  getTotalItems: () => number;
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

  // Helper: Tạo Unique Key cho Variant (Dùng Name làm chuẩn nếu ko có SKU)
  const getVariantKey = (variant?: VariantOption | null): string | null => {
    if (!variant) return null;
    return variant.name; // Size 40, Size 41...
  };

  // 1. Load Cart & Voucher
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
    // Chỉ lưu khi đã initialized và không đang trong quá trình chuyển đổi userId (tránh reset cart)
    if (isInitialized) {
      const storageKey = getStorageKey();
      console.log('💾 Saving cart to:', storageKey, cart);
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
      // ✅ Logic mới: Giá gốc + Phụ phí cấu hình
      const basePrice = item.product.price || 0;
      const surcharge = item.selectedVariant?.price || 0;
      const finalPrice = basePrice + surcharge;
      return total + (finalPrice * item.quantity);
    }, 0);
  };

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  // ✅ ADD TO CART (Logic mới - Bất biến hoàn toàn + Chặn vượt kho + Support Color)
  const addToCart = (product: Product, quantity: number = 1, selectedVariant?: VariantOption, selectedColor?: string) => {
    setCart(prevCart => {
      const productId = String(product._id || product.id);
      const variantKey = getVariantKey(selectedVariant);
      const colorKey = selectedColor || null; // Normalize
      
      // Lấy giới hạn kho (ưu tiên kho của Size đã chọn, nếu không thì lấy kho tổng)
      const maxStock = selectedVariant ? selectedVariant.stock : (product.stock || 0);

      const existingIndex = prevCart.findIndex(item => {
        const itemId = String(item.product._id || item.product.id);
        const itemKey = getVariantKey(item.selectedVariant);
        const itemColor = item.selectedColor || null;
        return itemId === productId && itemKey === variantKey && itemColor === colorKey;
      });

      if (existingIndex > -1) {
        const currentQty = prevCart[existingIndex].quantity;
        const potentialQty = currentQty + quantity;
        
        // Kiểm tra xem tổng số lượng có vượt kho không
        if (potentialQty > maxStock) {
           const allowedExtra = maxStock - currentQty;
           if (allowedExtra <= 0) {
              alert(`Sản phẩm này chỉ còn ${maxStock} cái trong kho (Size ${selectedVariant?.name}). Bạn đã có đủ số lượng tối đa trong giỏ hàng.`);
              return prevCart;
           }
           alert(`Bạn chỉ có thể thêm tối đa ${allowedExtra} sản phẩm này vào giỏ hàng.`);
           return prevCart.map((item, index) => 
              index === existingIndex ? { ...item, quantity: maxStock } : item
           );
        }

        return prevCart.map((item, index) => 
          index === existingIndex 
            ? { ...item, quantity: potentialQty } 
            : item
        );
      } else {
        // Kiểm tra nếu thêm mới có vượt kho không
        const finalQty = Math.min(quantity, maxStock);
        if (quantity > maxStock) {
           alert(`Sản phẩm này chỉ còn ${maxStock} cái trong kho.`);
        }
        return [...prevCart, { product, quantity: finalQty, selectedVariant, selectedColor }];
      }
    });
  };

  // ✅ UPDATE QUANTITY
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

  // ✅ REMOVE ITEM
  const removeItem = (productId: string, variantKey?: string | null, color?: string | null) => {
    setCart(prevCart => 
      prevCart.filter(item => {
        const itemId = String(item.product._id || item.product.id);
        const itemKey = getVariantKey(item.selectedVariant);
        const itemColor = item.selectedColor || null;
        
        // Giữ lại nếu khác ID
        if (itemId !== productId) return true;
        
        // Giữ lại nếu cùng ID nhưng khác Size
        if (itemKey !== (variantKey || null)) return true;

        // Giữ lại nếu cùng ID, cùng Size nhưng khác Màu
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
        totalItems: getTotalItems(), 
        totalPrice: getTotalPrice(), 
        clearCart, 
        getTotalPrice, 
        getTotalItems,
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
// app/cart/page.tsx
"use client";
import React, { useState } from 'react';
import Link from "next/link";
import { Trash2, Minus, Plus, ShoppingBag, ArrowLeft, Ticket, CreditCard, ChevronRight } from "lucide-react";
import { useCart } from "../contexts/CartContext";
import { Voucher } from '../types/voucher';
import { VoucherSelector } from "../../components/VoucherSelector";

export default function CartPage() {
  const { cart, updateQuantity, removeItem, getTotalItems, getTotalPrice } = useCart();
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const subtotal = getTotalPrice();
  const totalItems = getTotalItems();

  const getImageUrl = (item: any): string => {
    const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000').replace('/api', '');
    let rawUrl = item.selectedVariant?.image || item.product.image || '';
    
    // Nếu rawUrl là object
    let url = typeof rawUrl === 'string' ? rawUrl : (rawUrl?.url || '');
    
    if (!url || typeof url !== 'string' || url.includes('[object')) return '/placeholder.jpg';
    if (url.startsWith('http') || url.startsWith('data:')) return url;
    return `${API_URL}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  const calculateDiscount = (voucher: Voucher | null): number => {
    if (!voucher) return 0;
    if (voucher.discountType === 'percentage') {
      const discount = (subtotal * voucher.discountValue) / 100;
      return voucher.maxDiscount ? Math.min(discount, voucher.maxDiscount) : discount;
    }
    return voucher.discountValue;
  };

  const discountAmount = calculateDiscount(selectedVoucher);
  const finalTotal = Math.max(0, subtotal - discountAmount);

  return (
    <div className="bg-white min-h-screen font-sans text-gray-900 pb-20">
      
      {/* Header */}
      <div className="border-b border-gray-100 bg-white sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
             <Link href="/" className="font-black text-xl italic tracking-tighter">FOOTMARK.</Link>
             <span className="text-gray-300">|</span>
             <h1 className="font-bold text-lg uppercase tracking-wide">Giỏ Hàng ({totalItems})</h1>
          </div>
          <Link href="/products" className="text-sm font-bold text-gray-500 hover:text-primary">
             Tiếp tục mua sắm
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {cart.length === 0 ? (
          <div className="text-center py-20 bg-gray-50 rounded-none border border-dashed border-gray-300">
            <ShoppingBag size={64} className="mx-auto text-gray-300 mb-4" />
            <h2 className="text-2xl font-bold mb-2 uppercase tracking-tighter italic">Giỏ hàng trống trơn</h2>
            <p className="text-gray-500 mb-8 font-medium">Bạn chưa chọn được đôi giày nào ưng ý à?</p>
            <Link
              href="/products"
              className="inline-block bg-primary text-white px-8 py-3 rounded-none font-bold uppercase hover:bg-primary-dark transition shadow-lg shadow-primary/20"
            >
              Xem bộ sưu tập mới
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Cart Items List (8 cols) */}
            <div className="lg:col-span-8 space-y-6">
              {cart.map((item, index) => {
                const productId = item.product._id || item.product.id || '';
                const variantKey = item.selectedVariant?.name || null;
                const itemKey = `${productId}-${variantKey || 'base'}-${index}`;
                
                return (
                  <div key={itemKey} className="flex gap-4 sm:gap-6 py-6 border-b border-gray-100 last:border-0">
                    {/* Image */}
                    <div className="w-24 h-24 sm:w-32 sm:h-32 bg-gray-100 rounded-none overflow-hidden flex-shrink-0 border border-gray-200">
                      <img
                        src={getImageUrl(item)}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Info */}
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start mb-1">
                           <h3 className="font-bold text-lg leading-tight line-clamp-2 pr-4">
                              <Link href={`/products/${item.product.slug}`} className="hover:text-primary transition">
                                 {item.product.name}
                              </Link>
                           </h3>
                           <button 
                              onClick={() => removeItem(productId, variantKey)}
                              className="text-gray-400 hover:text-red-500 transition p-1"
                           >
                              <Trash2 size={18}/>
                           </button>
                        </div>
                        
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">{item.product.brand}</p>
                        
                        {item.selectedVariant && (
                           <div className="inline-flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-none text-xs font-bold text-gray-700 border border-gray-200">
                              <span>Size: {item.selectedVariant.name}</span>
                           </div>
                        )}
                      </div>

                      <div className="flex justify-between items-end mt-4">
                         <div className="flex items-center border border-gray-300 rounded-none h-9">
                            <button 
                               onClick={() => updateQuantity(productId, variantKey, item.quantity - 1)}
                               className="px-3 hover:bg-gray-100 h-full flex items-center justify-center text-gray-600 disabled:opacity-50"
                               disabled={item.quantity <= 1}
                            >
                               <Minus size={14}/>
                            </button>
                            <span className="w-8 text-center font-bold text-sm">{item.quantity}</span>
                            <button 
                               onClick={() => updateQuantity(productId, variantKey, item.quantity + 1)}
                               className="px-3 hover:bg-gray-100 h-full flex items-center justify-center text-gray-600"
                            >
                               <Plus size={14}/>
                            </button>
                         </div>
                         <div className="text-right">
                            <span className="block font-black text-lg italic">
                               {formatCurrency((item.selectedVariant?.price || item.product.price) * item.quantity)}
                            </span>
                            {item.quantity > 1 && (
                               <span className="text-xs text-gray-500 font-medium">
                                  {formatCurrency(item.selectedVariant?.price || item.product.price)} / đôi
                               </span>
                            )}
                         </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Checkout Summary (4 cols) */}
            <div className="lg:col-span-4">
               <div className="bg-gray-50 rounded-none p-6 sticky top-24 border border-gray-100">
                  <h3 className="font-black italic text-xl mb-6 uppercase tracking-tighter">Tổng đơn hàng</h3>
                  
                  <div className="space-y-3 mb-6 pb-6 border-b border-gray-200">
                     <div className="flex justify-between text-sm">
                        <span className="text-gray-500 font-medium">Tạm tính:</span>
                        <span className="font-bold">{formatCurrency(subtotal)}</span>
                     </div>
                     <div className="flex justify-between text-sm">
                        <span className="text-gray-500 font-medium">Vận chuyển:</span>
                        <span className="font-bold text-green-600">Miễn phí</span>
                     </div>
                     {discountAmount > 0 && (
                        <div className="flex justify-between text-sm text-primary">
                           <span className="font-medium">Giảm giá:</span>
                           <span className="font-bold">-{formatCurrency(discountAmount)}</span>
                        </div>
                     )}
                  </div>

                  {/* Voucher Input */}
                  <div className="mb-6">
                     <VoucherSelector 
                        totalAmount={subtotal} 
                        onVoucherApply={setSelectedVoucher} 
                        selectedVoucher={selectedVoucher}
                     />
                  </div>

                  <div className="flex justify-between items-end mb-8">
                     <span className="font-black text-lg uppercase italic tracking-tighter">Tổng cộng</span>
                     <div className="text-right">
                        <span className="block font-black text-3xl text-primary italic tracking-tighter">{formatCurrency(finalTotal)}</span>
                        <span className="text-[10px] text-gray-400 font-bold uppercase">(Đã bao gồm VAT)</span>
                     </div>
                  </div>

                  <Link 
                     href="/checkout"
                     className="w-full bg-primary text-white py-4 rounded-none font-bold uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-primary-dark transition shadow-xl shadow-primary/20"
                  >
                     Thanh toán <ChevronRight size={18}/>
                  </Link>
                  
                  <div className="mt-6 flex items-center justify-center gap-2 text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                     <CreditCard size={14}/>
                     <span>Bảo mật thanh toán 100%</span>
                  </div>
               </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}

// app/cart/page.tsx
"use client";
import React from 'react';
import Link from "next/link";
import { Trash2, Minus, Plus, ShoppingBag, Ticket, CreditCard, ChevronRight, Check } from "lucide-react";
import { useCart } from "../contexts/CartContext";
import { Voucher } from '../types/voucher';
import { VoucherSelector } from "../../components/VoucherSelector";
import { getImageUrl } from '../../lib/imageHelper';

export default function CartPage() {
  const { 
    cart, 
    updateQuantity, 
    removeItem, 
    toggleSelectItem, 
    toggleAllItems,
    getSelectedTotalPrice,
    getSelectedItemsCount,
    selectedVoucher, 
    setSelectedVoucher 
  } = useCart();

  // ✅ Trạng thái hiển thị thông báo hết hàng cho từng sản phẩm
  const [stockErrors, setStockErrors] = React.useState<Record<string, boolean>>({});

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const selectedTotal = getSelectedTotalPrice();
  const selectedCount = getSelectedItemsCount();
  const isAllSelected = cart.length > 0 && cart.every(item => item.selected);

  const calculateDiscount = (voucher: Voucher | null): number => {
    if (!voucher || selectedTotal < (voucher.minOrderAmount || 0)) return 0;
    if (voucher.discountType === 'percentage') {
      const discount = (selectedTotal * voucher.discountValue) / 100;
      return voucher.maxDiscount ? Math.min(discount, voucher.maxDiscount) : discount;
    }
    return voucher.discountValue;
  };

  const discountAmount = calculateDiscount(selectedVoucher);
  const finalTotal = Math.max(0, selectedTotal - discountAmount);

  return (
    <div className="bg-gray-50 min-h-screen font-sans text-gray-900 pb-20">
      
      {/* Header */}
      <div className="border-b border-gray-100 bg-white sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
             <Link href="/" className="font-black text-xl italic tracking-tighter">FOOTMARK.</Link>
             <span className="text-gray-300">|</span>
             <h1 className="font-bold text-lg uppercase tracking-wide">Giỏ Hàng</h1>
          </div>
          <Link href="/products" className="text-sm font-bold text-gray-500 hover:text-black transition-colors">
             Tiếp tục mua sắm
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {cart.length === 0 ? (
          <div className="text-center py-20 bg-white border border-dashed border-gray-300">
            <ShoppingBag size={64} className="mx-auto text-gray-200 mb-4" />
            <h2 className="text-2xl font-black mb-2 uppercase tracking-tighter italic">Giỏ hàng trống</h2>
            <p className="text-gray-500 mb-8 font-medium">Bạn chưa chọn được đôi giày nào ưng ý à?</p>
            <Link
              href="/products"
              className="inline-block bg-black text-white px-10 py-4 font-black uppercase hover:bg-gray-900 transition shadow-lg"
            >
              Khám phá ngay
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Cart Items List (8 cols) */}
            <div className="lg:col-span-8 space-y-4">
              
              {/* Select All Toolbar */}
              <div className="bg-white p-4 flex items-center gap-4 shadow-sm border border-gray-100">
                <button 
                  onClick={() => toggleAllItems(!isAllSelected)}
                  className={`w-5 h-5 border-2 flex items-center justify-center transition-all ${
                    isAllSelected ? 'bg-black border-black text-white' : 'border-gray-300 hover:border-black'
                  }`}
                >
                  {isAllSelected && <Check size={14} strokeWidth={4} />}
                </button>
                <span className="text-sm font-bold uppercase tracking-widest">Chọn tất cả ({cart.length})</span>
                <div className="flex-1"></div>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest hidden sm:block">Sản phẩm</span>
              </div>

              <div className="space-y-4">
                {cart.map((item, index) => {
                  const productId = String(item.product._id || item.product.id || '');
                  const variantKey = item.selectedVariant?.name || null;
                  const colorKey = item.selectedColor || null;
                  const itemKey = `${productId}-${variantKey || 'base'}-${colorKey || 'base'}`;
                  
                  return (
                    <div key={`${itemKey}-${index}`} className="bg-white p-4 sm:p-6 flex gap-4 sm:gap-6 shadow-sm border border-gray-100 items-center">
                      
                      {/* Individual Checkbox */}
                      <button 
                        onClick={() => toggleSelectItem(productId, variantKey, colorKey)}
                        className={`w-5 h-5 border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                          item.selected ? 'bg-black border-black text-white' : 'border-gray-300 hover:border-black'
                        }`}
                      >
                        {item.selected && <Check size={14} strokeWidth={4} />}
                      </button>

                      {/* Image */}
                      <div className="w-20 h-20 sm:w-28 sm:h-28 bg-gray-50 overflow-hidden flex-shrink-0 border border-gray-100">
                        <img
                          src={getImageUrl(item)}
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Info */}
                      <div className="flex-1 flex flex-col justify-between min-w-0">
                        <div>
                          <div className="flex justify-between items-start mb-1">
                             <h3 className="font-black text-sm sm:text-base leading-tight line-clamp-1 uppercase italic pr-4">
                                <Link href={`/products/${item.product.slug}`} className="hover:text-blue-600 transition">
                                   {item.product.name}
                                </Link>
                             </h3>
                             <button 
                                onClick={() => removeItem(productId, variantKey, colorKey)}
                                className="text-gray-300 hover:text-red-500 transition p-1"
                             >
                                <Trash2 size={16}/>
                             </button>
                          </div>
                          
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">{item.product.brand}</p>
                          
                          <div className="flex flex-wrap gap-2 mb-3">
                             {item.selectedVariant && (
                                <span className="text-[9px] font-black uppercase bg-gray-100 px-2 py-1 text-gray-600">Size: {item.selectedVariant.name}</span>
                             )}
                             {item.selectedColor && (
                                <span className="text-[9px] font-black uppercase bg-gray-100 px-2 py-1 text-gray-600">Màu: {item.selectedColor}</span>
                             )}
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                           <div className="relative">
                              <div className="flex items-center border-2 border-gray-100 w-fit">
                                 <button 
                                    onClick={() => {
                                       updateQuantity(productId, variantKey, colorKey, item.quantity - 1);
                                       setStockErrors(prev => ({ ...prev, [itemKey]: false }));
                                    }}
                                    className="w-8 h-8 hover:bg-gray-50 flex items-center justify-center text-gray-600 disabled:opacity-30"
                                    disabled={item.quantity <= 1}
                                 >
                                    <Minus size={12} strokeWidth={3}/>
                                 </button>
                                 <span className="w-8 text-center font-black text-xs">{item.quantity}</span>
                                 <button 
                                    onClick={() => {
                                       const maxStock = item.selectedVariant ? item.selectedVariant.stock : (item.product.stock || 0);
                                       if (item.quantity < maxStock) {
                                          updateQuantity(productId, variantKey, colorKey, item.quantity + 1);
                                          setStockErrors(prev => ({ ...prev, [itemKey]: false }));
                                       } else {
                                          setStockErrors(prev => ({ ...prev, [itemKey]: true }));
                                          // Tự động ẩn sau 2 giây
                                          setTimeout(() => {
                                             setStockErrors(prev => ({ ...prev, [itemKey]: false }));
                                          }, 2000);
                                       }
                                    }}
                                    className="w-8 h-8 hover:bg-gray-50 flex items-center justify-center text-gray-600 border-l-2 border-gray-100"
                                 >
                                    <Plus size={12} strokeWidth={3}/>
                                 </button>
                              </div>
                              {stockErrors[itemKey] && (
                                 <div className="absolute top-full left-0 mt-1 whitespace-nowrap z-10">
                                    <span className="text-[9px] font-black uppercase text-red-500 bg-white">
                                       Hết hàng trong kho!
                                    </span>
                                 </div>
                              )}
                           </div>
                           <div className="text-right">
                              <span className="block font-black text-base italic leading-none">
                                 {formatCurrency((item.product.price + (item.selectedVariant?.price || 0)) * item.quantity)}
                              </span>
                           </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Checkout Summary (4 cols) */}
            <div className="lg:col-span-4">
               <div className="bg-white p-6 sticky top-24 border border-gray-100 shadow-sm space-y-6">
                  <h3 className="font-black italic text-lg uppercase tracking-tighter border-b-2 border-black pb-2 w-fit">Thanh toán</h3>
                  
                  {/* Voucher Selector Integration */}
                  <div className="bg-gray-50 p-4 border border-dashed border-gray-200">
                     <div className="flex items-center gap-2 mb-4 text-gray-500">
                        <Ticket size={16}/>
                        <span className="text-[10px] font-black uppercase tracking-widest">Ưu đãi FootMark</span>
                     </div>
                     <VoucherSelector 
                        totalAmount={selectedTotal} 
                        onVoucherApply={setSelectedVoucher} 
                        selectedVoucher={selectedVoucher}
                     />
                  </div>

                  <div className="space-y-3 pt-2">
                     <div className="flex justify-between text-xs font-bold uppercase tracking-widest">
                        <span className="text-gray-400">Tạm tính ({selectedCount} món):</span>
                        <span>{formatCurrency(selectedTotal)}</span>
                     </div>
                     {discountAmount > 0 && (
                        <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-red-600">
                           <span>Giảm giá:</span>
                           <span>-{formatCurrency(discountAmount)}</span>
                        </div>
                     )}
                     <div className="flex justify-between text-xs font-bold uppercase tracking-widest">
                        <span className="text-gray-400">Vận chuyển:</span>
                        <span className="text-green-600 italic">Free</span>
                     </div>
                  </div>

                  <div className="border-t-2 border-dashed border-gray-100 pt-6">
                     <div className="flex justify-between items-end">
                        <span className="font-black text-sm uppercase italic tracking-tighter">Tổng thanh toán</span>
                        <span className="block font-black text-2xl text-black italic tracking-tighter leading-none">{formatCurrency(finalTotal)}</span>
                     </div>
                  </div>

                  <Link 
                     href={selectedCount > 0 ? "/checkout" : "#"}
                     className={`w-full py-5 font-black uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-2 transition-all shadow-lg ${
                        selectedCount > 0 
                        ? 'bg-black text-white hover:bg-gray-800' 
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                     }`}
                  >
                     Mua hàng {selectedCount > 0 && `(${selectedCount})`} <ChevronRight size={16}/>
                  </Link>
                  
                  <div className="flex items-center justify-center gap-2 text-[9px] text-gray-400 font-black uppercase tracking-[0.2em]">
                     <CreditCard size={12}/>
                     <span>Thanh toán an toàn & bảo mật</span>
                  </div>
               </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}

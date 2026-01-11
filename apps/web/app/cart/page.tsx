// app/cart/page.tsx
"use client";
import { Trash2, Minus, Plus, ShoppingCart, ArrowLeft, Package, Truck } from "lucide-react";
import Link from "next/link";
import { useCart } from "../../contexts/CartContext";
import { Voucher } from '../types/voucher';
import { useState } from 'react';
import { VoucherSelector } from "../../components/VoucherSelector";

// ✅ THÊM TYPE DEFINITIONS
interface ProductSpecs {
  screen?: string;
  chip?: string;
  ram?: string;
  storage?: string;
  camera?: string;
  battery?: string;
}

interface VariantOption {
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

interface Product {
  id?: string;
  _id?: string;
  name: string;
  brand?: string;
  price: number;
  originalPrice?: number;
  rating?: number;
  image?: string;
  images?: string[];
  description?: string;
  categorySlug?: string;
  slug?: string;
  specs?: ProductSpecs;
  stock?: number;
  soldCount?: number;
  isNew?: boolean;
  hasPromotion?: boolean;
  variants?: Variant[];
}

export default function CartPage() {
  const { cart, updateQuantity, removeItem, getTotalItems } = useCart();
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { 
      style: 'currency', 
      currency: 'VND' 
    }).format(amount);
  };

  const calculateSubtotal = () => {
    return cart.reduce((total, item) => {
      return total + (item.product.price * item.quantity);
    }, 0);
  };
  
  const subtotal = calculateSubtotal();
  const totalItems = getTotalItems();
  
  const hasVariants = (product: Product): boolean => {
    return !!(product.variants && product.variants.length > 0);
  };

  const calculateShippingFee = () => {
    if (subtotal >= 1000000) return 0;
    if (subtotal >= 500000) return 30000;
    return 50000;
  };

  const shippingFee = calculateShippingFee();

  const calculateDiscount = (voucher: Voucher | null): number => {
    if (!voucher) return 0;
    
    const amount = subtotal;
    
    if (voucher.discountType === 'percentage') {
      const discount = (amount * voucher.discountValue) / 100;
      return voucher.maxDiscount ? Math.min(discount, voucher.maxDiscount) : discount;
    }
    
    return voucher.discountValue;
  };

  const handleVoucherApply = (voucher: Voucher | null) => {
    setSelectedVoucher(voucher);
    setDiscountAmount(calculateDiscount(voucher));
  };

  const vatAmount = Math.round(subtotal * 0.01);
  const finalTotal = subtotal + shippingFee + vatAmount - discountAmount;

  return (
    <div className="container mx-auto px-4 py-8 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold mb-8 flex items-center gap-3">
          <ShoppingCart className="text-blue-600" size={36} />
          Giỏ hàng của bạn
          {totalItems > 0 && (
            <span className="bg-blue-600 text-white text-lg px-4 py-1 rounded-full">
              {totalItems}
            </span>
          )}
        </h1>

        {cart.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="text-gray-300 mb-6">
              <ShoppingCart size={100} className="mx-auto opacity-50" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">Giỏ hàng đang trống</h2>
            <p className="text-gray-500 mb-8">Hãy thêm vài sản phẩm thú vị vào đây nhé!</p>
            
            <Link
              href="/products"
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-3 rounded-full font-semibold hover:bg-blue-700 hover:shadow-lg transition-all"
            >
              <ArrowLeft size={20} />
              Tiếp tục mua sắm
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items List */}
            <div className="lg:col-span-2 space-y-4">
              {cart.map((item, index) => (
                <div 
                  key={`${item.product._id}-${index}`}
                  className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 flex flex-col sm:flex-row items-center gap-4 sm:gap-6 transition-all hover:shadow-md"
                >
                  {/* Product Image */}
                  <div className="relative w-24 h-24 sm:w-32 sm:h-32 flex-shrink-0 rounded-xl overflow-hidden border border-gray-200">
                    <img
                      src={item.selectedVariant?.image || item.product.image}
                      alt={item.product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Product Info */}
                  <div className="flex-1 text-center sm:text-left">
                    <h3 className="font-semibold text-lg text-gray-900 mb-1 line-clamp-2">
                      {item.product.name}
                    </h3>
                    <p className="text-gray-500 text-sm mb-2">Thương hiệu: {item.product.brand}</p>

                    {/* ✅ HIỂN THỊ BIẾN THỂ ĐÃ CHỌN */}
                    {item.selectedVariant && (
                      <div className="mb-3 bg-blue-50 border border-blue-200 rounded-lg p-2 inline-block">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-gray-600">Phiên bản:</span>
                          <span className="font-semibold text-blue-700">
                            {item.selectedVariant.name}
                          </span>
                        </div>
                        {item.selectedVariant.sku && (
                          <div className="text-xs text-gray-500 mt-1">
                            SKU: {item.selectedVariant.sku}
                          </div>
                        )}
                      </div>
                    )}

                    {/* ✅ HIỂN THỊ SỐ LƯỢNG BIẾN THỂ CÓ SẴN */}
                    {hasVariants(item.product) && !item.selectedVariant && (
                      <div className="mt-2 flex items-center gap-1 text-xs text-gray-500">
                        {item.product.variants!.slice(0, 2).map((variant, idx) => (
                          <span key={idx} className="bg-gray-100 px-2 py-1 rounded">
                            {variant.options.length} {variant.name}
                          </span>
                        ))}
                        {item.product.variants!.length > 2 && (
                          <span className="text-gray-400">+{item.product.variants!.length - 2}</span>
                        )}
                      </div>
                    )}
                    
                    <div className="space-y-2 mt-3">
                      <div className="text-blue-600 font-bold text-xl">
                        {formatCurrency(item.selectedVariant?.price || item.product.price)}
                      </div>
                      
                      {/* Nút điều chỉnh số lượng */}
                      <div className="flex items-center gap-3 justify-center sm:justify-start">
                        <span className="text-gray-600 text-sm">Số lượng:</span>
                        <div className="flex items-center border border-gray-300 rounded-lg">
                          <button
                            onClick={() => updateQuantity(item.product._id,item.selectedVariant?.sku || null, item.quantity - 1)}
                            className="px-3 py-1 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={item.quantity <= 1}
                          >
                            <Minus size={16} />
                          </button>
                          <span className="px-4 py-1 font-semibold min-w-[40px] text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => {
                              const maxStock = item.selectedVariant?.stock || item.product.stock || 99;
                              const newQuantity = Math.min(item.quantity + 1, maxStock);
                              updateQuantity(item.product._id,item.selectedVariant?.sku || null, newQuantity);
                            }}
                            disabled={item.quantity >= (item.selectedVariant?.stock || item.product.stock || 99)}
                            className="px-3 py-1 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                        
                        {/* ✅ HIỂN THỊ SỐ LƯỢNG CÒN LẠI */}
                        <span className="text-xs text-gray-500">
                          (Còn {item.selectedVariant?.stock || item.product.stock || 0})
                        </span>
                      </div>
                      
                      {/* Thành tiền */}
                      <div className="text-gray-700 font-semibold">
                        Thành tiền: <span className="text-blue-600">
                          {formatCurrency((item.selectedVariant?.price || item.product.price) * item.quantity)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Remove Button */}
                  <div className="flex flex-col items-center gap-4">
                    <button
                      onClick={() => removeItem(item.product._id)}
                      className="flex items-center gap-2 text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 px-4 py-2 rounded-lg transition-colors font-medium"
                      title="Xóa sản phẩm"
                    >
                      <Trash2 size={18} />
                      <span className="hidden sm:inline">Xóa</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-24">
                <h3 className="font-bold text-xl text-gray-900 mb-6 pb-4 border-b border-gray-100">
                  Tổng đơn hàng
                </h3>
                
                <div className="space-y-4 mb-6">
                  {/* Tạm tính */}
                  <div className="flex justify-between text-gray-600">
                    <span>Tạm tính ({totalItems} sản phẩm):</span>
                    <span className="font-medium text-gray-900">
                      {formatCurrency(subtotal)}
                    </span>
                  </div>

                  {/* CHI TIẾT TỪNG SẢN PHẨM */}
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2 border border-gray-200">
                    {cart.map((item, index) => (
                      <div 
                        key={`summary-${item.product._id}-${index}`}
                        className="flex justify-between text-sm text-gray-600"
                      >
                        <span className="flex-1 pr-2">
                          <div className="truncate">
                            {item.product.name}
                            <span className="text-gray-400 ml-1">x{item.quantity}</span>
                          </div>
                          {item.selectedVariant && (
                            <div className="text-xs text-blue-600 mt-0.5">
                              {item.selectedVariant.name}
                            </div>
                          )}
                        </span>
                        <span className="font-medium text-gray-900 whitespace-nowrap">
                          {formatCurrency((item.selectedVariant?.price || item.product.price) * item.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* PHÍ VẬN CHUYỂN */}
                  <div className="flex justify-between text-gray-600">
                    <div className="flex items-center gap-2">
                      <Truck size={16} />
                      <span>Phí vận chuyển:</span>
                    </div>
                    <span className={`font-medium ${shippingFee === 0 ? 'text-green-600' : 'text-gray-900'}`}>
                      {shippingFee === 0 ? 'Miễn phí' : formatCurrency(shippingFee)}
                    </span>
                  </div>

                  {/* THÔNG BÁO MIỄN PHÍ SHIP */}
                  {subtotal < 1000000 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
                      <p className="text-blue-700 font-medium">
                        💡 Mua thêm <span className="text-blue-900 font-bold">{formatCurrency(1000000 - subtotal)}</span> để được <strong>MIỄN PHÍ VẬN CHUYỂN</strong>!
                      </p>
                    </div>
                  )}

                  {/* THUẾ VAT */}
                  <div className="flex justify-between text-gray-600">
                    <span>VAT (1%):</span>
                    <span className="font-medium text-gray-900">
                      {formatCurrency(vatAmount)}
                    </span>
                  </div>

                  {/* Voucher */}
                  <div className="pb-4 border-b border-gray-200">
                    <VoucherSelector
                      totalAmount={subtotal}
                      onVoucherApply={handleVoucherApply}
                      selectedVoucher={selectedVoucher}
                    />
                  </div>

                  {/* Giảm giá */}
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-blue-600">
                      <span>Giảm giá:</span>
                      <span className="font-medium">
                        -{formatCurrency(discountAmount)}
                      </span>
                    </div>
                  )}

                  {/* TỔNG CỘNG */}
                  <div className="border-t border-dashed border-gray-200 pt-4 flex justify-between items-center">
                    <span className="font-bold text-lg text-gray-900">Tổng cộng:</span>
                    <span className="font-bold text-blue-700 text-2xl">
                      {formatCurrency(finalTotal)}
                    </span>
                  </div>
                </div>

                {/* BẢNG PHÍ VẬN CHUYỂN */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6 border border-gray-200">
                  <h4 className="font-semibold text-sm text-gray-700 mb-3 flex items-center gap-2">
                    <Package size={16} />
                    Mức phí vận chuyển:
                  </h4>
                  <div className="space-y-2 text-xs text-gray-600">
                    <div className="flex justify-between">
                      <span>Dưới 500.000đ:</span>
                      <span className="font-medium">50.000đ</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Từ 500.000đ - 1.000.000đ:</span>
                      <span className="font-medium">30.000đ</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Trên 1.000.000đ:</span>
                      <span className="font-medium text-green-600">Miễn phí ✨</span>
                    </div>
                  </div>
                </div>

                {/* Checkout Button */}
                <Link 
                  href="/checkout"
                  className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-4 rounded-xl font-bold text-lg hover:shadow-xl hover:scale-[1.02] transition-all active:scale-[0.98] mb-4 flex items-center justify-center"
                >
                  Tiến hành thanh toán
                </Link>
                
                <Link
                  href="/products"
                  className="w-full py-3 text-blue-600 font-semibold hover:bg-blue-50 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <ArrowLeft size={18} />
                  Tiếp tục mua sắm
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
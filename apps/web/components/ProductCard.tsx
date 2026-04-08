'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { ShoppingCart, Check, TrendingUp } from 'lucide-react';
import { useCart } from '../app/contexts/CartContext';
import { useRouter } from 'next/navigation';
import { getImageUrl } from '../lib/imageHelper';
import { Product } from '../lib/shared/types';

interface ProductCardProps {
  product: Product;
  showSoldCount?: boolean;
}

export default function ProductCard({ product, showSoldCount = false }: ProductCardProps) {
  const router = useRouter();
  const { addToCart } = useCart();

  // State quản lý UI và lựa chọn
  const [showOptions, setShowOptions] = useState(false);
  const [selectedSize, setSelectedSize] = useState<any>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const productId = product._id || product.id || '';
  const productSlug = product.slug || productId;

  // Tách các loại biến thể
  const sizeVariant = useMemo(() => 
    product.variants?.find(v => v.name.toLowerCase().includes('size')) || null, 
  [product.variants]);

  const colorVariant = useMemo(() => 
    product.variants?.find(v => v.name.toLowerCase().includes('màu') || v.name.toLowerCase().includes('color')) || null, 
  [product.variants]);

  // Logic tính giá hiển thị
  const displayPrice = useMemo(() => {
    const basePrice = product.price || 0;
    const surcharge = selectedSize ? (selectedSize.price || 0) : 0;
    return basePrice + surcharge;
  }, [product.price, selectedSize]);

  const isOutOfStock = useMemo(() => {
    if (product.variants && product.variants.length > 0) {
      return !product.variants.some(v => v.options.some(opt => opt.stock > 0));
    }
    return !(product.stock && product.stock > 0);
  }, [product]);

  const handleAddToCartClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock) return;

    if (product.variants && product.variants.length > 0) {
      setShowOptions(true);
    } else {
      handleAddItem();
    }
  };

  const handleAddItem = () => {
    if ((sizeVariant && !selectedSize) || (colorVariant && !selectedColor)) {
      return;
    }

    setIsAdding(true);
    // @ts-ignore
    addToCart({ ...product, _id: productId }, 1, selectedSize, selectedColor);
    
    setTimeout(() => {
      setIsAdding(false);
      setShowOptions(false);
      setSelectedSize(null);
      setSelectedColor(null);
    }, 500);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  return (
    <div 
      className={`group relative bg-white rounded-none overflow-hidden border border-gray-100 hover:shadow-xl transition-all duration-300 ${isOutOfStock ? 'opacity-75 grayscale-[0.5]' : ''}`}
      onMouseLeave={() => {
        setShowOptions(false);
        setSelectedSize(null);
        setSelectedColor(null);
      }}
    >
      <Link href={`/products/${productSlug}`} className="block relative aspect-square overflow-hidden bg-gray-50">
        <img
          src={getImageUrl(product)}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        
        {isOutOfStock && (
          <div className="absolute inset-0 bg-white/50 z-30 flex items-center justify-center pointer-events-none">
             <div className="bg-black text-white text-xs font-black px-4 py-2 uppercase tracking-[0.2em] border-2 border-white transform -rotate-12 shadow-xl">
                Hết hàng
             </div>
          </div>
        )}
        
        {/* OVERLAY CHỌN BIẾN THỂ */}
        <div className={`absolute inset-0 bg-white/95 backdrop-blur-sm z-20 flex flex-col justify-center p-4 transition-opacity duration-300 ${showOptions ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'}`}>
           
           {/* CHỌN SIZE */}
           {sizeVariant && (
             <div className="mb-4">
               <p className="text-[10px] font-bold uppercase tracking-widest mb-2 text-gray-500">Kích thước {selectedSize && <span className="text-primary">(+{formatCurrency(selectedSize.price)})</span>}</p>
               <div className="grid grid-cols-4 gap-1">
                  {sizeVariant.options.map((opt, idx) => (
                     <button
                        key={idx}
                        disabled={opt.stock === 0}
                        onClick={(e) => {
                           e.preventDefault(); e.stopPropagation();
                           setSelectedSize(opt);
                        }}
                        className={`py-2 text-[10px] font-bold border transition ${
                           opt.stock === 0 ? 'border-gray-100 text-gray-300 bg-gray-50 cursor-not-allowed' :
                           selectedSize?.name === opt.name ? 'border-black bg-black text-white' : 'border-gray-200 hover:border-black text-gray-800'
                        }`}
                     >
                        {opt.name}
                     </button>
                  ))}
               </div>
             </div>
           )}

           {/* CHỌN MÀU (KHÔNG TĂNG GIÁ) */}
           {colorVariant && (
             <div className="mb-4">
               <p className="text-[10px] font-bold uppercase tracking-widest mb-2 text-gray-500">Màu sắc</p>
               <div className="flex flex-wrap gap-1">
                  {colorVariant.options.map((opt, idx) => (
                     <button
                        key={idx}
                        onClick={(e) => {
                           e.preventDefault(); e.stopPropagation();
                           setSelectedColor(opt.name);
                        }}
                        className={`px-3 py-1.5 text-[10px] font-bold border transition ${
                           selectedColor === opt.name ? 'border-black bg-black text-white' : 'border-gray-200 hover:border-black text-gray-800'
                        }`}
                     >
                        {opt.name}
                     </button>
                  ))}
               </div>
             </div>
           )}

           <div className="flex gap-2 mt-auto">
              <button 
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleAddItem(); }}
                className="flex-1 bg-black text-white py-3 font-bold text-[10px] uppercase tracking-widest hover:bg-gray-800"
              >
                Xác nhận thêm
              </button>
              <button 
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowOptions(false); }}
                className="px-4 py-3 border border-gray-200 text-gray-400 hover:text-black text-[10px] font-bold uppercase"
              >
                Hủy
              </button>
           </div>
        </div>
        
        {/* TAGS */}
        <div className="absolute top-3 left-3 flex flex-col gap-2 z-10">
          {product.tags?.map((tag, idx) => (
            <span key={idx} className="bg-black text-white text-[10px] font-bold px-2 py-1 uppercase tracking-wider">
              {tag}
            </span>
          ))}
        </div>

        {!showOptions && !isOutOfStock && (
           <div className="absolute inset-x-0 bottom-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300 flex gap-2 z-10">
              <button 
                 onClick={handleAddToCartClick}
                 className="flex-1 bg-primary text-white py-3 rounded-none font-bold text-xs uppercase tracking-wide hover:bg-primary-dark shadow-lg shadow-primary/30 flex items-center justify-center gap-2"
              >
                 {isAdding ? <Check size={16}/> : <ShoppingCart size={16}/>} 
                 {isAdding ? 'Đã thêm' : 'Thêm vào giỏ'}
              </button>
           </div>
        )}
      </Link>

      <div className="p-4">
        <div className="flex justify-between items-start mb-1">
           <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{product.brand || 'No Brand'}</span>
           {showSoldCount && Number(product.soldCount) > 0 ? (
              <div className="flex items-center gap-1 text-[10px] font-black text-primary uppercase tracking-widest bg-blue-50 px-2 py-0.5">
                 <TrendingUp size={10}/> Đã bán {product.soldCount}
              </div>
           ) : null}
        </div>

        <Link href={`/products/${productSlug}`}>
          <h3 className="font-bold text-gray-900 mb-2 line-clamp-1 hover:text-primary transition uppercase tracking-tighter italic">
            {product.name}
          </h3>
        </Link>

        {/* PHẦN HIỂN THỊ GIÁ THEO YÊU CẦU */}
        <div className="flex items-end justify-between border-t border-dashed border-gray-100 pt-3 mt-3">
           <div>
              <div className="flex items-center gap-2">
                {/* Giá bán hiện tại (Tự động cập nhật khi chọn Size ở Overlay) */}
                <span className="text-lg font-black text-black italic">
                  {formatCurrency(displayPrice)}
                </span>
                
                {/* Giá gốc (Original Price) - Luôn hiển thị nếu có để làm mốc giảm giá */}
                {product.originalPrice && product.originalPrice > displayPrice && (
                  <span className="text-xs text-gray-400 line-through decoration-gray-400">
                    {formatCurrency(product.originalPrice)}
                  </span>
                )}
              </div>
              {selectedSize && selectedSize.price > 0 && (
                <p className="text-[9px] text-primary font-bold uppercase mt-1">
                  * Đã bao gồm phụ phí Size: +{formatCurrency(selectedSize.price)}
                </p>
              )}
           </div>
        </div>
      </div>
    </div>
  );
}

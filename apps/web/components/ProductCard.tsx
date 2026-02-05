'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ShoppingCart, Check, TrendingUp } from 'lucide-react';
import { useCart } from '../app/contexts/CartContext';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { getImageUrl } from '../lib/imageHelper';

interface Product {
  id?: string;
  _id?: string;
  name: string;
  brand?: string;
  categorySlug?: string;
  price: number;
  originalPrice?: number;
  rating?: number;
  image?: string;
  images?: string[];
  slug?: string;
  specs?: {
    condition?: string;
    accessories?: string;
  };
  variants?: {
    name: string;
    options: { name: string; price: number; stock: number; sku?: string }[];
  }[];
  isNew?: boolean;
  hasPromotion?: boolean;
  stock?: number;
  soldCount?: number;
}

interface ProductCardProps {
  product: Product;
  showSoldCount?: boolean; // Prop mới
}

export default function ProductCard({ product, showSoldCount = false }: ProductCardProps) {

  const router = useRouter();

  const { addToCart } = useCart();

  const [showSizes, setShowSizes] = useState(false);

  const [isAdding, setIsAdding] = useState(false);

  const productId = product.id || product._id || '';

  const rawSlug = product.slug || productId;
  const productSlug = typeof rawSlug === 'string' ? rawSlug : productId;

  // getImageUrl removed, now using imported helper

  const getLowestPrice = (p: Product): number => {
    if (!p.variants || p.variants.length === 0) return p.price;
    const variantPrices = p.variants.flatMap(v => v.options.map(opt => opt.price));
    if (variantPrices.length === 0) return p.price;
    return Math.min(p.price, ...variantPrices);
  };

  const lowestPrice = getLowestPrice(product);
  const hasDiscount = product.originalPrice && product.originalPrice > lowestPrice;
  const discountPercent = hasDiscount 
    ? Math.round(((product.originalPrice! - lowestPrice) / product.originalPrice!) * 100)
    : 0;
  
  // ✅ Check Stock
  const isOutOfStock = product.stock !== undefined && product.stock <= 0;

  const sizeOptions = React.useMemo(() => {
    if (!product.variants) return [];
    const sizeVar = product.variants.find(v => v.name.toLowerCase().includes('size')) || product.variants[0];
    return sizeVar?.options || [];
  }, [product]);

  const handleAddToCartClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isOutOfStock) return; // Prevent click

    if (sizeOptions.length > 0) {
      setShowSizes(true);
    } else {
      handleAddItem(undefined);
    }
  };

  const handleAddItem = (variantOption: any) => {
    setIsAdding(true);
    // @ts-ignore
    addToCart({ ...product, _id: productId }, 1, variantOption);
    toast.success('Đã thêm vào giỏ hàng!');
    
    setTimeout(() => {
      setIsAdding(false);
      setShowSizes(false);
    }, 500);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  return (
    <div 
      className={`group relative bg-white rounded-none overflow-hidden border border-gray-100 hover:shadow-xl transition-all duration-300 ${isOutOfStock ? 'opacity-75 grayscale-[0.5]' : ''}`}
      onMouseLeave={() => setShowSizes(false)}
    >
      <Link href={`/products/${productSlug}`} className="block relative aspect-square overflow-hidden bg-gray-50">
        <img
          src={getImageUrl(product)}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e: any) => {
            e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI2YzZjRmNiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iNjQiIGZpbGw9IiNkMWQ1ZGIiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj7wn5O3PC90ZXh0Pjwvc3ZnPg==';
          }}
        />
        
        {/* 🚫 OUT OF STOCK OVERLAY */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-white/50 z-30 flex items-center justify-center pointer-events-none">
             <div className="bg-black text-white text-xs font-black px-4 py-2 uppercase tracking-[0.2em] border-2 border-white transform -rotate-12 shadow-xl">
                Hết hàng
             </div>
          </div>
        )}
        
        <div className={`absolute inset-0 bg-white/95 backdrop-blur-sm z-20 flex flex-col justify-center items-center p-4 transition-opacity duration-300 ${showSizes ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'}`}>
           <p className="text-xs font-bold uppercase tracking-widest mb-4 text-gray-500">Chọn Size</p>
           <div className="grid grid-cols-4 gap-2 w-full">
              {sizeOptions.map((opt, idx) => (
                 <button
                    key={idx}
                    disabled={opt.stock === 0}
                    onClick={(e) => {
                       e.preventDefault();
                       e.stopPropagation();
                       handleAddItem(opt);
                    }}
                    className={`py-2 text-xs font-bold border transition rounded-none ${
                       opt.stock > 0 
                       ? 'border-gray-300 hover:border-primary hover:bg-primary hover:text-white text-gray-800' 
                       : 'border-gray-100 text-gray-300 bg-gray-50 cursor-not-allowed decoration-slice'
                    }`}
                 >
                    {opt.name}
                 </button>
              ))}
           </div>
           <button 
              onClick={(e) => {
                 e.preventDefault();
                 e.stopPropagation();
                 setShowSizes(false);
              }}
              className="mt-4 text-[10px] font-bold text-gray-400 hover:text-black uppercase tracking-widest"
           >
              Đóng
           </button>
        </div>
        
        <div className="absolute top-3 left-3 flex flex-col gap-2 z-10">
          {product.isNew && (
            <span className="bg-black text-white text-[10px] font-bold px-2 py-1 uppercase tracking-wider rounded-none">New</span>
          )}
          {product.specs?.condition && product.specs.condition !== 'New' && (
            <span className="bg-white/90 backdrop-blur text-black text-[10px] font-bold px-2 py-1 border border-black uppercase tracking-wider rounded-none">
              {product.specs.condition}
            </span>
          )}
        </div>

        {hasDiscount && (
          <div className="absolute top-3 right-3 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-none">
            -{discountPercent}%
          </div>
        )}

        {!showSizes && !isOutOfStock && (
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
        <div className="flex justify-between items-start mb-2">
        <Link href={`/products?category=${encodeURIComponent(product.categorySlug || 'unknown')} `} className="hover:underline lowercase">
           <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{product.brand || 'No Brand'}</span>
           </Link>
           {/* Hiển thị số lượng đã bán nếu được yêu cầu */}
           {showSoldCount && product.soldCount && product.soldCount > 0 && (
              <div className="flex items-center gap-1 text-[10px] font-black text-primary uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded-none">
                 <TrendingUp size={10}/> Đã bán {product.soldCount >= 1000 ? `${(product.soldCount/1000).toFixed(1)}k` : product.soldCount}
              </div>
           )}
        </div>

        <Link href={`/products/${productSlug}`} className="block">
          <h3 className="font-bold text-gray-900 mb-2 line-clamp-1 hover:text-primary transition uppercase tracking-tighter italic" title={product.name}>
            {product.name}
          </h3>
        </Link>

        <div className="flex items-end justify-between border-t border-dashed border-gray-100 pt-3 mt-3">
           <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-black text-black italic">
                  {formatCurrency(lowestPrice)}
                </span>
                {hasDiscount && (
                  <span className="text-xs text-gray-400 line-through decoration-gray-400">
                    {formatCurrency(product.originalPrice!)}
                  </span>
                )}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}

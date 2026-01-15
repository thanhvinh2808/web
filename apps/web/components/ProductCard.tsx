'use client';

import React from 'react';
import Link from 'next/link';
import { ShoppingCart, Heart } from 'lucide-react';
import { useCart } from '../app/contexts/CartContext';
import { useRouter } from 'next/navigation';

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
  slug?: string;
  specs?: {
    condition?: string;
    accessories?: string;
  };
  variants?: {
    name: string;
    options: { name: string; price: number; stock: number }[];
  }[];
  isNew?: boolean;
  hasPromotion?: boolean;
  stock?: number;
}

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const router = useRouter();
  const { addToCart } = useCart();
  
  const productId = product.id || product._id || '';
  const productSlug = product.slug || productId;
  
  // Helper: Lấy URL ảnh
  const getImageUrl = (p: Product): string => {
    if (p.images && Array.isArray(p.images) && p.images.length > 0) return p.images[0];
    if (p.image) return p.image;
    return '/placeholder-product.jpg';
  };

  // Helper: Tính giá thấp nhất (nếu có variants)
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

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault(); // Ngăn chặn navigation
    e.stopPropagation();
    // @ts-ignore
    addToCart({ ...product, _id: product.id || product._id || '' }, 1);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  return (
    <div className="group relative bg-white rounded-xl overflow-hidden border border-gray-100 hover:shadow-xl transition-all duration-300">
      <Link href={`/products/${productSlug}`} className="block relative aspect-square overflow-hidden bg-gray-50">
        <img
          src={getImageUrl(product)}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e: any) => {
            e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI2YzZjRmNiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iNjQiIGZpbGw9IiNkMWQ1ZGIiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj7wn5O3PC90ZXh0Pjwvc3ZnPg==';
          }}
        />
        
        {/* Labels */}
        <div className="absolute top-3 left-3 flex flex-col gap-2 z-10">
          {product.isNew && (
            <span className="bg-black text-white text-[10px] font-bold px-2 py-1 uppercase tracking-wider">New</span>
          )}
          {product.specs?.condition && product.specs.condition !== 'New' && (
            <span className="bg-white/90 backdrop-blur text-black text-[10px] font-bold px-2 py-1 border border-black uppercase tracking-wider">
              {product.specs.condition}
            </span>
          )}
        </div>

        {/* Discount Badge */}
        {hasDiscount && (
          <div className="absolute top-3 right-3 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">
            -{discountPercent}%
          </div>
        )}

        {/* Quick Actions (Hover) */}
        <div className="absolute inset-x-0 bottom-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300 flex gap-2">
           <button 
              onClick={handleAddToCart}
              className="flex-1 bg-black text-white py-2.5 rounded font-bold text-xs uppercase tracking-wide hover:bg-stone-800 flex items-center justify-center gap-2"
           >
              <ShoppingCart size={16}/> Thêm vào giỏ
           </button>
        </div>
      </Link>

      <div className="p-4">
        {/* Brand & Stock Status */}
        <div className="flex justify-between items-start mb-2">
           <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{product.brand || 'No Brand'}</span>
           {/* {product.stock === 0 && <span className="text-[10px] font-bold text-red-500 uppercase">Hết hàng</span>} */}
        </div>

        {/* Name */}
        <Link href={`/products/${productSlug}`} className="block">
          <h3 className="font-bold text-gray-900 mb-2 line-clamp-1 hover:text-blue-600 transition" title={product.name}>
            {product.name}
          </h3>
        </Link>

                      {/* Variants Preview */}
                      {product.variants && product.variants.length > 0 && (
                        <div className="mt-2 flex items-center gap-1 text-xs text-gray-500">
                          {product.variants.slice(0, 2).map((variant, idx) => (
                            <span key={idx} className="bg-gray-100 px-2 py-1 rounded">
                              {variant.options?.length || 0} {variant.name}
                            </span>
                          ))}
                          {product.variants.length > 2 && (
                            <span className="text-gray-400">+{product.variants.length - 2}</span>
                          )}
                        </div>
                      )}

        {/* Price */}
        <div className="flex items-end justify-between border-t border-dashed pt-3">
           <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-black text-black">
                  {formatCurrency(lowestPrice)}
                </span>
                {hasDiscount && (
                  <span className="text-xs text-gray-400 line-through decoration-gray-400">
                    {formatCurrency(product.originalPrice!)}
                  </span>
                )}
              </div>
              {/* {hasDiscount && <span className="text-[10px] text-red-500 font-bold">Tiết kiệm {formatCurrency(product.originalPrice! - lowestPrice)}</span>} */}
           </div>
        </div>
      </div>
    </div>
  );
}

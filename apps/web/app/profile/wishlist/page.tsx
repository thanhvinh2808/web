"use client";

import React from 'react';
import { useWishlist } from '../../contexts/WishlistContext';
import ProductCard from '../../../components/ProductCard';
import { Heart, ShoppingBag } from 'lucide-react';
import Link from 'next/link';

export default function WishlistPage() {
  const { wishlist, isLoading } = useWishlist();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="mt-4 text-gray-500 font-bold uppercase tracking-widest text-xs">Đang tải danh sách yêu thích...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="border-b border-gray-100 pb-4 mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-xl font-black text-gray-800 uppercase tracking-tight italic">Sản phẩm yêu thích</h1>
          <p className="text-sm text-gray-500 mt-1">Nơi lưu giữ những đôi giày bạn đang "mê mẩn"</p>
        </div>
        <div className="text-[10px] font-black bg-gray-100 px-3 py-1 uppercase tracking-[0.2em] text-gray-400">
          {wishlist.length} Sản phẩm
        </div>
      </div>

      {wishlist.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {wishlist.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 bg-gray-50 border border-dashed border-gray-200">
          <div className="relative mb-6">
            <Heart size={80} className="text-gray-100 fill-gray-100" />
            <Heart size={40} className="text-gray-200 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <h3 className="text-lg font-black uppercase italic tracking-tighter text-gray-400 mb-2">Chưa có sản phẩm yêu thích</h3>
          <p className="text-gray-400 text-sm font-medium mb-8">Hãy dạo quanh một vòng và chọn cho mình những đôi giày ưng ý nhất nhé!</p>
          <Link 
            href="/products" 
            className="bg-black text-white px-8 py-3 font-black uppercase text-xs tracking-[0.2em] hover:bg-primary transition shadow-xl hover:shadow-primary/20 flex items-center gap-2"
          >
            <ShoppingBag size={16} /> Khám phá ngay
          </Link>
        </div>
      )}
    </div>
  );
}

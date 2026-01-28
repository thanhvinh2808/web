"use client";

import React from 'react';
import { useWishlist } from '../contexts/WishlistContext';
import ProductCard from '../../components/ProductCard';
import { Heart, ShoppingBag, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function WishlistPage() {
  const { wishlist, isLoading } = useWishlist();

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-20 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Đang tải danh sách...</p>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen">
      <div className="container mx-auto px-4 py-12">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-gray-100 pb-8 mb-12 gap-6">
          <div>
            {/* <div className="flex items-center gap-3 mb-2">
               <div className="w-8 h-8 bg-red-50 flex items-center justify-center text-red-500">
                  <Heart size={20} className="fill-red-500"/>
               </div>
               <span className="text-xs font-black text-gray-400 uppercase tracking-[0.3em]">Yêu thích</span>
            </div> */}
            <h1 className="text-4xl md:text-5xl font-black text-black leading-none uppercase italic">
              Danh sách Yêu Thích<br/>
              <span className="text-primary">Của bạn.</span>
            </h1>
          </div>
          
          <div className="flex items-center gap-4 bg-gray-50 p-4 border-l-4 border-primary">
             <div className="text-right">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tổng số mục</p>
                <p className="text-2xl font-black text-black">{wishlist.length} Sản phẩm</p>
             </div>
          </div>
        </div>

        {wishlist.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-gray-100">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6 text-gray-300">
               <Heart size={40} />
            </div>
            <h2 className="text-2xl font-black text-black uppercase mb-2">Chưa có sản phẩm nào</h2>
            <p className="text-gray-500 max-w-md mb-8 px-4">Hãy thêm những mẫu giày bạn yêu thích vào danh sách này để theo dõi và mua sắm dễ dàng hơn.</p>
            <Link 
              href="/products" 
              className="bg-black text-white px-8 py-4 font-black uppercase tracking-widest text-xs flex items-center gap-3 hover:bg-primary transition-all group"
            >
              Tiếp tục mua sắm
              <ArrowRight size={16} className="group-hover:translate-x-2 transition-transform"/>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8">
            {wishlist.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}

        {/* Suggested Section if wishlist is low */}
        {wishlist.length > 0 && wishlist.length < 4 && (
           <div className="mt-20 pt-12 border-t border-gray-100">
              <h3 className="text-xl font-black text-black uppercase italic mb-8 flex items-center gap-3">
                 <ShoppingBag size={24} className="text-primary"/>
                 Có thể bạn sẽ thích
              </h3>
              <p className="text-gray-500 mb-8">Khám phá thêm nhiều mẫu giày Authentic mới nhất tại FootMark.</p>
              <Link 
                href="/products" 
                className="inline-flex items-center gap-2 text-sm font-black text-black uppercase tracking-widest border-b-2 border-black pb-1 hover:text-primary hover:border-primary transition-all"
              >
                Xem tất cả sản phẩm <ArrowRight size={16}/>
              </Link>
           </div>
        )}
      </div>
    </div>
  );
}

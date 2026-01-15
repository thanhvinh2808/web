'use client';
import React from 'react';
import { NEW_ARRIVALS } from './data';

export default function NewArrivals() {
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-end mb-10">
          <div>
            <h3 className="text-4xl font-black text-gray-900 italic uppercase">Hàng Mới Về</h3>
            <p className="text-gray-500 mt-2">Full box, tag, phụ kiện - Bảo hành chính hãng trọn đời</p>
          </div>
          <a href="#" className="hidden md:block border-b-2 border-black pb-1 font-bold hover:text-blue-600 hover:border-blue-600 transition">Xem tất cả</a>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {NEW_ARRIVALS.map(product => (
            <div key={product.id} className="group cursor-pointer">
              <div className="relative aspect-square bg-gray-100 rounded-xl overflow-hidden mb-4">
                <span className="absolute top-3 left-3 bg-black text-white text-[10px] font-bold px-3 py-1 uppercase tracking-wider z-10">
                  New
                </span>
                {product.tag && (
                  <span className="absolute top-3 right-3 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded z-10">
                    {product.tag}
                  </span>
                )}
                <img 
                    src={product.image} 
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-x-0 bottom-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                  <button className="w-full bg-white/90 backdrop-blur text-black font-bold py-3 rounded-lg shadow-lg hover:bg-blue-600 hover:text-white transition">
                    Thêm vào giỏ
                  </button>
                </div>
              </div>
              <h4 className="font-bold text-lg mb-1 truncate">{product.name}</h4>
              <p className="text-gray-500 text-sm mb-2">{product.brand}</p>
              <div className="flex items-center gap-3">
                <span className="font-bold text-lg">{product.price.toLocaleString()}đ</span>
                {product.originalPrice > 0 && (
                  <span className="text-gray-400 line-through text-sm">{product.originalPrice.toLocaleString()}đ</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

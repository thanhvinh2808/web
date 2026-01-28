'use client';
import React from 'react';
import Link from 'next/link';

export default function TradeInBanner() {
  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <div className="bg-black overflow-hidden relative flex flex-col md:flex-row items-center">
          <div className="p-12 md:w-1/2 text-white z-10">
            <h3 className="text-3xl md:text-5xl font-black italic mb-4">THU CŨ ĐỔI MỚI</h3>
            <p className="text-gray-300 mb-8 text-lg">
              Bạn có giày cũ không đi nữa? Mang đến FootMark để được định giá và đổi lấy một đôi giày mới với giá ưu đãi lên đến 30%.
            </p>
            <Link href="/trade-in" className="bg-white text-black px-8 py-3 font-bold rounded-full hover:bg-blue-600 hover:text-white transition inline-block">
              Định giá ngay
            </Link>
          </div>
          <div className="md:w-1/2 h-64 md:h-96 relative w-full">
            <img 
              src="https://images.unsplash.com/photo-1595341888016-a392ef81b7de?auto=format&fit=crop&q=80&w=1000" 
              className="w-full h-full object-cover opacity-80"
              alt="Trade In"
            />
            <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-l from-transparent to-black"></div>
          </div>
        </div>
      </div>
    </section>
  );
}

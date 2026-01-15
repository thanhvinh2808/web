'use client';
import React from 'react';

export default function HeroSection() {
  return (
    <section className="relative h-[600px] bg-gray-900 overflow-hidden">
      <div className="absolute inset-0 opacity-60">
        <img 
            src="https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&q=80&w=2000" 
            alt="Sneaker Wall" 
            className="w-full h-full object-cover"
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-r from-black via-black/50 to-transparent"></div>
      
      <div className="container mx-auto px-4 h-full flex items-center relative z-10">
        <div className="max-w-2xl text-white">
            <div className="flex gap-2 mb-6">
                <span className="bg-blue-600 px-3 py-1 text-xs font-bold uppercase rounded-sm">New Arrival</span>
                <span className="bg-white text-black px-3 py-1 text-xs font-bold uppercase rounded-sm">Free Shipping</span>
            </div>
            <h2 className="text-6xl md:text-8xl font-black italic mb-6 leading-[0.9]">
                WALK <br/> YOUR <br/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-500">STYLE.</span>
            </h2>
            <p className="text-xl text-gray-300 mb-8 max-w-lg font-light">
                FootMark mang đến những đôi giày chính hãng và các deal 2hand "ngon - bổ - rẻ" được tuyển chọn kỹ lưỡng.
            </p>
            <div className="flex flex-wrap gap-4">
                <button className="bg-white text-black px-10 py-4 font-bold uppercase tracking-wider hover:bg-gray-200 transition">
                    Shop Giày Mới
                </button>
                <button className="border-2 border-white text-white px-10 py-4 font-bold uppercase tracking-wider hover:bg-white/10 transition">
                    Săn 2Hand
                </button>
            </div>
        </div>
      </div>
    </section>
  );
}

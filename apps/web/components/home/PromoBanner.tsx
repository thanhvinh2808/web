'use client';
import React from 'react';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';

export default function PromoBanner() {
  return (
    <section className="py-12 bg-white">
       <div className="container mx-auto px-4">
          <div className="relative rounded-none overflow-hidden bg-blue-900 h-[300px] md:h-[400px] flex items-center">
             
             {/* Background Image Overlay */}
             <div className="absolute inset-0 z-0">
                {/* <img 
                   src="https://images.unsplash.com/photo-1556906781-9a412961d289?auto=format&fit=crop&q=80&w=2000" 
                   alt="Sneaker Promo" 
                   className="w-full h-full object-cover opacity-60 mix-blend-overlay"
                /> */}
             </div>

             {/* Content */}
             <div className="relative z-10 container px-8 md:px-16 flex flex-col md:flex-row justify-between items-center gap-8">
                <div className="text-center md:text-left max-w-2xl">
                   <span className="bg-yellow-400 text-black px-4 py-1 text-sm font-black uppercase tracking-widest inline-block mb-4 -rotate-2 rounded-none">
                      Summer Sale 2026
                   </span>
                   <h2 className="text-4xl md:text-6xl font-black italic text-white leading-none tracking-tighter mb-6">
                      MUA 1 TẶNG 1 <br/>
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">
                         TẤT VỚ CHÍNH HÃNG.
                      </span>
                   </h2>
                   <p className="text-blue-100 text-lg font-medium mb-0">
                      Áp dụng cho toàn bộ đơn hàng giày Sneaker trên 2.000.000₫. 
                   </p>
                </div>

                <div className="flex-shrink-0">
                   <Link 
                      href="/products" 
                      className="bg-primary text-white px-10 py-5 rounded-none font-black uppercase tracking-wider hover:bg-white hover:text-primary transition-all transform hover:scale-105 shadow-xl flex items-center gap-2"
                   >
                      Săn Deal Ngay <ArrowUpRight size={24} />
                   </Link>
                </div>
             </div>

             {/* Marquee Effect */}
             <div className="absolute bottom-0 left-0 w-full bg-black/20 backdrop-blur text-white/30 text-[100px] font-black italic leading-none whitespace-nowrap overflow-hidden select-none pointer-events-none">
                <div className="animate-marquee inline-block">
                   SALE SALE SALE SALE SALE SALE SALE SALE SALE SALE SALE SALE
                </div>
             </div>
          </div>
       </div>
    </section>
  );
}
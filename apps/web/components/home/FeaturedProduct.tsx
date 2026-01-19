'use client';
import React from 'react';
import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';

export default function FeaturedProduct() {
  return (
    <section className="py-20 bg-black text-white overflow-hidden relative">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 opacity-20 pointer-events-none">
         <div className="absolute top-10 left-10 w-96 h-96 bg-blue-600 rounded-none blur-[150px]"></div>
         <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-600 rounded-none blur-[150px]"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          {/* Text Content */}
          <div className="order-2 lg:order-1 space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-none backdrop-blur-md border border-white/20">
               <Sparkles size={16} className="text-yellow-400" />
               <span className="text-xs font-bold uppercase tracking-widest text-white">Item of the Week</span>
            </div>

            <h2 className="text-5xl md:text-7xl font-black italic leading-[0.9] tracking-tighter">
              AIR JORDAN 1 <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">
                LOST & FOUND.
              </span>
            </h2>

            <p className="text-gray-400 text-lg max-w-md font-medium leading-relaxed">
              Sự trở lại của huyền thoại Chicago với phong cách Vintage cổ điển. 
              Da nứt, hộp giày cũ kỹ - một kiệt tác kể lại câu chuyện của những năm 80s.
            </p>

            <div className="flex flex-wrap gap-4 pt-4">
               <div className="flex flex-col">
                  <span className="text-xs text-gray-500 font-bold uppercase">Giá bán</span>
                  <span className="text-3xl font-black text-white">12.500.000₫</span>
               </div>
               <div className="w-px h-12 bg-white/20 mx-4 hidden sm:block"></div>
               <Link 
                  href="/products/jordan-1-chicago-lost-and-found" 
                  className="flex-1 sm:flex-none bg-primary text-white px-8 py-3 rounded-none font-black uppercase tracking-wider hover:bg-primary-dark transition flex items-center justify-center gap-2 group shadow-lg shadow-primary/40"
               >
                  Mua Ngay <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform"/>
               </Link>
            </div>
          </div>

          {/* Image Content */}
          <div className="order-1 lg:order-2 relative">
             <div className="relative z-10 animate-float">
                <img 
                  src="/images/1.png" 
                  alt="Jordan 1 Lost & Found" 
                  className="w-full drop-shadow-2xl -rotate-12 hover:rotate-0 transition-transform duration-700 ease-out scale-110"
                />
             </div>
             {/* Decorative Frames Behind (Squared instead of Circles) */}
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] border border-white/10 rounded-none animate-spin-slow pointer-events-none"></div>
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] h-[90%] border border-white/5 rounded-none animate-spin-reverse-slow pointer-events-none"></div>
          </div>

        </div>
      </div>
    </section>
  );
}
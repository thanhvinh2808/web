// apps/web/components/home/BrandSection.tsx
'use client';
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { CLEAN_API_URL } from '@lib/shared/constants';

const API_URL = CLEAN_API_URL;

interface Brand {
  _id: string;
  name: string;
  logo?: string;
  slug: string;
}

export default function BrandSection() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const res = await fetch(`${API_URL}/api/brands`);
        const data = await res.json();
        // Lấy danh sách thương hiệu (tăng lên 12 để có thể trượt)
        const list = data.brands || data || [];
        setBrands(list.slice(0, 15));
      } catch (error) {
        console.error("Error fetching brands:", error);
      }
    };
    fetchBrands();
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollTo = direction === 'left' ? scrollLeft - clientWidth / 2 : scrollLeft + clientWidth / 2;
      scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  if (brands.length === 0) return null;

  return (
    <section className="border-b bg-white overflow-hidden group">
      <div className="container py-6 md:py-10 relative">
        <p className="text-center text-[8px] md:text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mb-8 md:mb-10 italic">
          Thương hiệu nổi bật
        </p>
        
        <div className="relative">
          {/* Nút Trái - Premium Design */}
          <button 
            onClick={() => scroll('left')}
            className="absolute -left-4 md:-left-6 top-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 bg-white/90 backdrop-blur-md border border-gray-100 rounded-full flex items-center justify-center text-gray-400 shadow-xl shadow-black/5 opacity-0 group-hover:opacity-100 transition-all duration-300 z-30 hover:text-primary hover:scale-110 hover:border-primary/30 active:scale-95"
          >
            <ChevronLeft size={24} strokeWidth={2.5} />
          </button>

          {/* Container trượt cố định 6 item */}
          <div className="overflow-hidden">
             <div 
               ref={scrollRef}
               className="flex items-center overflow-x-auto no-scrollbar scroll-smooth py-4"
             >
               {brands.map((b) => (
                 <div key={b._id} className="w-1/3 md:w-1/6 flex-shrink-0 px-4 md:px-6">
                    <Link 
                      href={`/products?brand=${encodeURIComponent(b.name)}`}
                      className="group flex flex-col items-center transition-all duration-500 hover:scale-110"
                    >
                      <div className="h-6 md:h-10 w-full flex items-center justify-center grayscale group-hover:grayscale-0 transition-all opacity-30 group-hover:opacity-100">
                         {b.logo ? (
                           <img src={b.logo} alt={b.name} className="max-h-full max-w-full object-contain" />
                         ) : (
                           <span className="font-black text-sm md:text-base italic tracking-tighter text-gray-400 group-hover:text-black truncate">
                             {b.name}
                           </span>
                         )}
                      </div>
                    </Link>
                 </div>
               ))}
             </div>
          </div>

          {/* Nút Phải - Premium Design */}
          <button 
            onClick={() => scroll('right')}
            className="absolute -right-4 md:-right-6 top-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 bg-white/90 backdrop-blur-md border border-gray-100 rounded-full flex items-center justify-center text-gray-400 shadow-xl shadow-black/5 opacity-0 group-hover:opacity-100 transition-all duration-300 z-30 hover:text-primary hover:scale-110 hover:border-primary/30 active:scale-95"
          >
            <ChevronRight size={24} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </section>
  );
}

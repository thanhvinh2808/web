// apps/web/components/home/BrandSection.tsx
'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
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

  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const res = await fetch(`${API_URL}/api/brands`);
        const data = await res.json();
        // Lấy top 6 thương hiệu nổi bật
        const list = data.brands || data || [];
        setBrands(list.slice(0, 6));
      } catch (error) {
        console.error("Error fetching brands:", error);
      }
    };
    fetchBrands();
  }, []);

  if (brands.length === 0) return null;

  return (
    <section className="border-b bg-white">
      <div className="container mx-auto px-4 py-8">
        <p className="text-center text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mb-8">Thương hiệu nổi bật</p>
        <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-50 hover:opacity-100 transition-opacity duration-500">
          {brands.map((b) => (
            <Link 
              key={b._id} 
              href={`/products?brand=${encodeURIComponent(b.name)}`}
              className="group flex flex-col items-center gap-3 transition-all duration-300 hover:scale-110"
            >
              <div className="h-8 md:h-12 w-auto flex items-center justify-center grayscale group-hover:grayscale-0 transition-all">
                 {b.logo ? (
                   <img src={b.logo} alt={b.name} className="h-full w-auto object-contain" />
                 ) : (
                   <span className="font-black text-xl md:text-2xl italic tracking-tighter text-gray-400 group-hover:text-black">
                     {b.name}
                   </span>
                 )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

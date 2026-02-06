'use client';
import React from 'react';
import { BRANDS } from './data';
import Link from 'next/link';
export default function BrandSection() {
  return (
    <section className="border-b bg-white">
      <div className="container mx-auto px-4 py-8">
        <p className="text-center text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">Thương hiệu nổi bật</p>
        <div className="flex flex-wrap justify-center gap-12 grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all duration-500">
          {BRANDS.map((b, i) => (
            <div key={i} className="flex items-center gap-2 font-bold text-xl text-gray-400">
              <Link 
                  href={`http://localhost:3000/products?category=${b.name.toLowerCase()}`} 
                  className="hover:underline hover:lowercase"
                >
                  <span className="hover:text-black cursor-pointer uppercase">
                    {b.name}
                  </span>
          </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

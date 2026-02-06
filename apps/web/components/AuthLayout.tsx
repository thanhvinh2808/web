import React from 'react';
import Link from 'next/link';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
  image: string;
  side: 'left' | 'right';
}

export default function AuthLayout({ children, title, subtitle, image, side }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex items-stretch bg-white font-sans overflow-hidden">
      {/* Visual Side */}
      <div className={`hidden lg:flex lg:w-1/2 bg-black relative flex-col justify-between p-12 text-white ${side === 'right' ? 'order-2' : ''}`}>
        <div className="absolute inset-0 opacity-40">
           <img 
             src={image} 
             alt="Sneaker Culture" 
             className="w-full h-full object-cover"
           />
           <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black"></div>
        </div>
        
        <div className={`relative z-10 ${side === 'right' ? 'text-right' : ''}`}>
          <Link href="/" className="text-3xl font-black italic tracking-tighter italic hover:text-primary transition-colors">FOOTMARK.</Link>
        </div>

        <div className={`relative z-10 ${side === 'right' ? 'text-right' : ''}`}>
          <h1 className="text-6xl xl:text-7xl font-black italic uppercase leading-none tracking-tighter mb-6">
            {title.split(' ').slice(0, -1).join(' ')} <br />
            <span className="text-primary text-7xl xl:text-8xl">{title.split(' ').slice(-1)}</span>
          </h1>
          <p className={`max-w-md text-gray-300 font-medium text-lg leading-relaxed ${side === 'right' ? 'ml-auto' : ''}`}>
            {subtitle}
          </p>
        </div>

        <div className={`relative z-10 flex gap-8 text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 ${side === 'right' ? 'justify-end' : ''}`}>
          <span className="hover:text-white cursor-pointer transition-colors">Instagram</span>
          <span className="hover:text-white cursor-pointer transition-colors">Facebook</span>
          <span className="hover:text-white cursor-pointer transition-colors">TikTok</span>
        </div>
      </div>

      {/* Form Side */}
      <div className={`w-full lg:w-1/2 flex items-center justify-center p-8 md:p-16 bg-white relative ${side === 'right' ? 'order-1' : ''}`}>
        <div className="w-full max-w-md animate-fade-in-up">
          {children}
        </div>
        
        {/* Floating Tag */}
        <div className={`absolute bottom-8 hidden lg:block ${side === 'right' ? 'left-8' : 'right-8'}`}>
           <div className="flex items-center gap-3 text-gray-300">
              <div className="w-12 h-px bg-gray-200"></div>
              <span className="text-[10px] font-black uppercase tracking-[0.4em]">Footmark Elite 2026</span>
           </div>
        </div>
      </div>
    </div>
  );
}

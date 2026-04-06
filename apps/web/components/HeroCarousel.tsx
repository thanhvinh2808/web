'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, ArrowRight, Star } from 'lucide-react';

const SLIDES = [
  {
    id: 1,
    image: "/images/jordan-1-chicago-lost-and-found.png",
    title: "THE GRAIL IS BACK.",
    subtitle: "SIÊU PHẨM THÁNG 1",
    description: "Sự trở lại của huyền thoại Jordan 1 Chicago 'Lost & Found'. Phối màu Vintage độc bản, số lượng cực giới hạn.",
    buttonText: "Săn Ngay Kẻo Lỡ",
    link: "/products/air-jordan-1-retro-6698",
    align: "left", 
    theme: "dark",
    highlight: true
  },
  {
    id: 2,
    image: "/images/nike_run.png",
    title: "RUN THE CITY",
    subtitle: "BỘ SƯU TẬP HÈ 2026",
    description: "Năng động, thoáng khí và đầy màu sắc. Thiết kế mới nhất từ Nike & Adidas Running.",
    buttonText: "Xem Bộ Sưu Tập",
    link: "/products?category=nike",
    align: "center",
    theme: "dark"
  },
  {
    id: 3,
    image: "/images/streetwear.png",
    title: "STREETWEAR ICONS",
    subtitle: "PHONG CÁCH KHÁC BIỆT",
    description: "Khám phá những mẫu giày 2hand tuyển chọn, độ mới 99% với mức giá không thể tốt hơn.",
    buttonText: "Khám Phá 2Hand",
    link: "/products?type=2hand",
    align: "right",
    theme: "dark"
  }
];

export default function HeroCarousel() {
  const [current, setCurrent] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isAutoPlaying) {
      interval = setInterval(() => {
        nextSlide();
      }, 6000);
    }
    return () => clearInterval(interval);
  }, [current, isAutoPlaying]);

  const nextSlide = () => {
    setCurrent((prev) => (prev === SLIDES.length - 1 ? 0 : prev + 1));
  };

  const prevSlide = () => {
    setCurrent((prev) => (prev === 0 ? SLIDES.length - 1 : prev - 1));
  };

  return (
    <div 
      className="relative w-full h-[500px] md:h-[600px] overflow-hidden group bg-black"
      onMouseEnter={() => setIsAutoPlaying(false)}
      onMouseLeave={() => setIsAutoPlaying(true)}
    >
      <div 
        className="flex transition-transform duration-700 ease-[cubic-bezier(0.25,0.1,0.25,1)] h-full"
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {SLIDES.map((slide) => (
          <div key={slide.id} className="w-full h-full flex-shrink-0 relative">
            <div className="absolute inset-0">
               <img 
                 src={slide.image} 
                 alt={slide.title} 
                 className="w-full h-full object-cover" 
               />
            </div>
            
            <div className={`absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-black/80 via-black/40 to-transparent`}></div>

            <div className="absolute inset-0 container mx-auto px-6 md:px-12 flex flex-col justify-center h-full relative z-10">
              <div className={`max-w-3xl animate-fade-in-up ${
                slide.align === 'center' ? 'mx-auto text-center items-center' : 
                slide.align === 'right' ? 'ml-auto text-right items-end' : 'text-left items-start'
              } flex flex-col`}>
                
                {slide.highlight && (
                   <div className="flex items-center gap-2 bg-red-600 text-white px-4 py-1.5 mb-6 font-black text-xs uppercase tracking-widest animate-pulse rounded-none">
                      <Star size={12} fill="currentColor" /> Hàng Hiếm / Limited Stock
                   </div>
                )}

                {!slide.highlight && (
                   <span className="inline-block px-3 py-1 mb-4 text-xs font-bold uppercase tracking-[0.3em] text-white/80 border border-white/30 rounded-none">
                     {slide.subtitle}
                   </span>
                )}

                <h2 className="text-6xl md:text-8xl lg:text-9xl font-black italic tracking-tighter mb-6 leading-[0.85] text-white drop-shadow-2xl">
                  {slide.title}
                </h2>

                <p className="text-lg md:text-2xl font-medium mb-10 max-w-xl text-gray-200 leading-relaxed drop-shadow-md">
                  {slide.description}
                </p>

                <div className="flex gap-4">
                   <Link 
                     href={slide.link}
                     className="bg-primary text-white px-10 py-5 font-black uppercase tracking-wider flex items-center gap-3 transition-all transform hover:scale-105 hover:bg-primary-dark shadow-lg shadow-primary/30 rounded-none"
                   >
                     {slide.buttonText} <ArrowRight size={24}/>
                   </Link>
                   {slide.highlight && (
                      <button className="hidden md:flex items-center justify-center w-16 h-16 border-2 border-white/30 text-white hover:bg-white hover:text-black hover:border-white transition-all rounded-none">
                         <Star size={24} />
                      </button>
                   )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button 
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 w-14 h-14 border border-white/20 bg-black/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white hover:text-black transition-all transform -translate-x-full group-hover:translate-x-0 rounded-none"
      >
        <ChevronLeft size={28} />
      </button>

      <button 
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 w-14 h-14 border border-white/20 bg-black/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white hover:text-black transition-all transform translate-x-full group-hover:translate-x-0 rounded-none"
      >
        <ChevronRight size={28} />
      </button>

      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-4">
        {SLIDES.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrent(idx)}
            className={`h-2 transition-all duration-500 ${
              current === idx ? 'w-16 bg-white shadow-[0_0_10px_white]' : 'w-4 bg-white/30 hover:bg-white/60'
            } rounded-none`}
          />
        ))}
      </div>
    </div>
  );
}

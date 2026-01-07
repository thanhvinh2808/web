import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// Đã xóa các dòng import banner vì giờ chúng ta dùng đường dẫn trực tiếp từ thư mục public

const HeroCarousel = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // 1. Banner chính (lớn bên trái) - Main Slider
  const mainBanners = [
    {
      id: 1,
      image: '/images/banner1.png', // Thay đổi ở đây: Dùng đường dẫn chuỗi
      alt: 'Siêu Sale Mùa Hè - Giảm đến 50%',
      slug: 'sieu-sale-mua-he', 
      link: '/products'
    },
    {
      id: 2,
      image: '/images/banner2.png', // Thay đổi ở đây
      alt: 'Ra Mắt Hàng Mới 2025',
      slug: 'hang-moi-2025',
      link: '/products'
    },
    {
      id: 3,
      image: '/images/banner3.png', // Thay đổi ở đây
      alt: 'Trả Góp 0% Cực Hấp Dẫn',
      slug: 'tra-gop-0-phan-tram',
      link: '/products'
    }
  ];

  // 2. 2 Banner phụ (nhỏ bên phải) - Side Banners
  const sideBanners = [
    {
      id: 4,
      image: '/images/banner4.png', // Thay đổi ở đây
      alt: 'Laptop Cao Cấp, Gaming và Đồ Họa',
      slug: 'laptop',
      link: '/categories/laptops'
    },
    {
      id: 5,
      image: '/images/banner5.png', // Thay đổi ở đây
      alt: 'Smartphone Flagship',
      slug: 'dien-thoai',
      link: '/categories/smartphones'
    }
  ];

  // 3. 3 Banner nhỏ ngang (hàng dưới) - Bottom Banners
  const bottomBanners = [
    {
      id: 6,
      image: '/images/banner6.png', // Thay đổi ở đây
      alt: 'Phụ kiện chính hãng',
      slug: 'phu-kien',
      link: '/categories/accessories'
    },
    {
      id: 7,
      image: '/images/banner7.png', // Thay đổi ở đây
      alt: 'Miễn Phí Giao Hàng Toàn Quốc',
      slug: 'mien-phi-van-chuyen',
      link: '/products'
    },
    {
      id: 8,
      image: '/images/banner8.png', // Thay đổi ở đây
      alt: 'Khách hàng VIP',
      slug: 'thanh-vien-vip',
      link: '/products'
    }
  ];

  // Auto-play carousel cho banner chính
  useEffect(() => {
    if (!isPaused) {
      const timer = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % mainBanners.length);
      }, 4000);
      return () => clearInterval(timer);
    }
  }, [isPaused, mainBanners.length]);

  const goToSlide = (index) => {
    setCurrentSlide(index);
  };

  const goToPrevious = () => {
    setCurrentSlide((prev) => (prev - 1 + mainBanners.length) % mainBanners.length);
  };

  const goToNext = () => {
    setCurrentSlide((prev) => (prev + 1) % mainBanners.length);
  };

   
  return (
    <section className="bg-white py-6 md:py-8 font-sans">
      <div className="container mx-auto px-4 max-w-7xl">
        
        {/* Hàng trên: Banner lớn + 2 banner nhỏ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mb-4 md:mb-6">
          
          {/* Banner chính - Lớn bên trái (2/3 width) */}
          <div 
            className="lg:col-span-2 relative group"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            <div className="relative overflow-hidden rounded-xl shadow-2xl transition-all duration-300 hover:shadow-3xl">
              <div className="relative h-64 md:h-96 lg:h-[480px]">
                {mainBanners.map((banner, index) => (
                  <Link
                    key={banner.id}
                    href={banner.link}
                    className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                      index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
                    }`}
                  >
                    <Image
                      src={banner.image}
                      alt={banner.alt}
                      fill
                      className="object-cover"
                      priority={index === 0}
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 66vw, 66vw"
                    />
                  </Link>
                ))}
              </div>

              {/* Nút Previous */}
              <button
                onClick={goToPrevious}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/30 backdrop-blur-sm text-white p-2 md:p-3 rounded-full transition-all opacity-0 group-hover:opacity-100 hover:bg-white/50 focus:outline-none focus:ring-4 focus:ring-white/50 z-20"
                aria-label="Previous slide"
              >
                <ChevronLeft className="w-5 h-5 md:w-6 md:h-6 stroke-2 text-gray-800" />
              </button>

              {/* Nút Next */}
              <button
                onClick={goToNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/30 backdrop-blur-sm text-white p-2 md:p-3 rounded-full transition-all opacity-0 group-hover:opacity-100 hover:bg-white/50 focus:outline-none focus:ring-4 focus:ring-white/50 z-20"
                aria-label="Next slide"
              >
                <ChevronRight className="w-5 h-5 md:w-6 md:h-6 stroke-2 text-gray-800" />
              </button>

              {/* Dots navigation */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                {mainBanners.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToSlide(index)}
                    className={`h-2 transition-all duration-300 ${
                      index === currentSlide
                        ? 'bg-red-500 w-8 rounded-full shadow-md'
                        : 'bg-white/50 hover:bg-white w-2 rounded-full'
                    }`}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* 2 Banner phụ - Nhỏ bên phải (1/3 width) */}
          <div className="flex flex-col gap-4 md:gap-6">
            {sideBanners.map((banner) => (
              <Link
                key={banner.id}
                href={banner.link}
                className="relative overflow-hidden rounded-xl shadow-lg cursor-pointer transform transition-transform duration-300 hover:scale-[1.03] hover:shadow-xl group"
              >
                <div className="relative h-32 md:h-44 lg:h-[230px]">
                  <Image
                    src={banner.image}
                    alt={banner.alt}
                    fill
                    className="object-cover transition-opacity duration-500 group-hover:opacity-90"
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                </div>
                {/* Overlay text */}
                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-all flex items-end p-4">
                  <span className="text-white text-base font-semibold drop-shadow-lg">
                    {banner.alt}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Hàng dưới: 3 banner nhỏ ngang */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {bottomBanners.map((banner) => (
            <Link
              key={banner.id}
              href={banner.link}
              className="relative overflow-hidden rounded-xl shadow-md cursor-pointer transform transition-transform duration-300 hover:scale-[1.02] hover:shadow-lg group"
            >
              <div className="relative h-32 md:h-40 lg:h-48">
                <Image
                  src={banner.image}
                  alt={banner.alt}
                  fill
                  className="object-cover transition-opacity duration-500 group-hover:opacity-90"
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
              </div>
              {/* Overlay text */}
              <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-all flex items-end p-3">
                <span className="text-white text-sm font-medium drop-shadow-lg">
                  {banner.alt}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HeroCarousel;
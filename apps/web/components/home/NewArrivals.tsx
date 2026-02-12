'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import ProductCard from '../ProductCard';

const API_URL = process.env.NEXT_PUBLIC_API_URL || `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api`;
const ITEMS_PER_PAGE = 4; // Số sản phẩm mỗi trang

export default function NewArrivals() {
  const [activeTab, setActiveTab] = useState<'new' | 'best'>('new');
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1); // Trang hiện tại

  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`${API_URL}/api/products`);
        const data = await res.json();
        const allProducts = Array.isArray(data) ? data : data.data || [];
        setProducts(allProducts);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProducts();
  }, []);

  // Reset về trang 1 khi đổi tab
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  // Logic lọc và sắp xếp
  const sortedList = React.useMemo(() => {
    let filtered = [...products];

    if (activeTab === 'new') {
      filtered = filtered.sort((a, b) => {
        // Ưu tiên ngày tạo mới nhất lên đầu
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        
        if (dateB !== dateA) return dateB - dateA;
        
        // Dự phòng bằng _id
        return (b._id || '').localeCompare(a._id || '');
      });
    } else {
      filtered = filtered.sort((a, b) => {
        const soldA = a.soldCount || 0;
        const soldB = b.soldCount || 0;
        return soldB - soldA;
      });
    }
    return filtered;
  }, [products, activeTab]);

  // Logic phân trang
  const totalPages = Math.ceil(sortedList.length / ITEMS_PER_PAGE);
  const currentProducts = sortedList.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Tùy chọn: Scroll nhẹ lên đầu section nếu cần
    // const section = document.getElementById('new-arrivals');
    // if (section) section.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section id="new-arrivals" className="py-20 bg-white">
      <div className="container mx-auto px-4">
        
        {/* Header & Tabs */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
          <div className="flex gap-8 border-b-2 border-gray-100 w-full md:w-auto">
            <button 
              onClick={() => setActiveTab('new')}
              className={`pb-4 text-2xl md:text-4xl font-black italic uppercase tracking-tighter transition-all relative ${
                activeTab === 'new' 
                  ? 'text-black' 
                  : 'text-gray-300 hover:text-gray-500'
              }`}
            >
              Hàng Mới Về
              {activeTab === 'new' && <span className="absolute bottom-[-2px] left-0 w-full h-1 bg-primary"></span>}
            </button>
            
            <button 
              onClick={() => setActiveTab('best')}
              className={`pb-4 text-2xl md:text-4xl font-black italic uppercase tracking-tighter transition-all relative ${
                activeTab === 'best' 
                  ? 'text-black' 
                  : 'text-gray-300 hover:text-gray-500'
              }`}
            >
              Hàng Bán Chạy
              {activeTab === 'best' && <span className="absolute bottom-[-2px] left-0 w-full h-1 bg-primary"></span>}
            </button>
          </div>

          <Link href="/products" className="hidden md:block text-sm font-bold uppercase tracking-widest text-gray-500 hover:text-primary transition mb-4">
            Xem tất cả
          </Link>
        </div>

        {/* Product Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="aspect-square bg-gray-100 animate-pulse rounded-none"></div>
            ))}
          </div>
        ) : (
          <div className="min-h-[400px]">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {currentProducts.map((product) => (
                <ProductCard 
                  key={product._id || product.id} 
                  product={product} 
                  showSoldCount={activeTab === 'best'} 
                />
              ))}
            </div>
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-12 gap-2">
            <button 
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="w-10 h-10 flex items-center justify-center border-2 border-gray-100 text-gray-400 hover:text-primary hover:border-primary disabled:opacity-30 disabled:hover:border-gray-100 transition rounded-none"
            >
              <ChevronLeft size={18} />
            </button>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
              const isFirst = page === 1;
              const isLast = page === totalPages;
              const isNear = Math.abs(page - currentPage) <= 1;
              const isEllipsis = page === currentPage - 2 || page === currentPage + 2;

              if (isFirst || isLast || isNear) {
                return (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`w-10 h-10 flex items-center justify-center font-bold text-xs transition rounded-none ${
                      currentPage === page 
                        ? 'bg-primary text-white border-2 border-primary' 
                        : 'bg-white border-2 border-gray-100 text-gray-400 hover:border-primary hover:text-primary'
                    }`}
                  >
                    {page}
                  </button>
                );
              } else if (isEllipsis) {
                return (
                  <span key={page} className="w-10 h-10 flex items-center justify-center text-gray-300 font-bold">
                    ...
                  </span>
                );
              }
              return null;
            })}

            <button 
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="w-10 h-10 flex items-center justify-center border-2 border-gray-100 text-gray-400 hover:text-primary hover:border-primary disabled:opacity-30 disabled:hover:border-gray-100 transition rounded-none"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        )}

        <div className="mt-8 text-center md:hidden">
           <Link href="/products" className="inline-block px-8 py-4 border-2 border-black text-black font-bold uppercase tracking-widest text-xs hover:bg-black hover:text-white transition rounded-none">
              Xem tất cả sản phẩm
           </Link>
        </div>

      </div>
    </section>
  );
}

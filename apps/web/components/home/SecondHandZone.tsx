'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, ChevronDown, Package, History } from 'lucide-react';
import ProductCard from '../ProductCard';
import { CLEAN_API_URL } from '@lib/shared/constants';

const API_URL = CLEAN_API_URL;

const SIZES = ['36', '37', '38', '39', '40', '41', '42', '43', '44', '45'];

export default function SecondHandZone() {
  const [products, setProducts] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedSize, setSelectedSize] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch Products
        const prodRes = await fetch(`${API_URL}/api/products?sort=newest&limit=50`);
        const prodData = await prodRes.json();
        const allProds = Array.isArray(prodData) ? prodData : prodData.data || [];
        
        const secondhand = allProds.filter((p: any) => 
           p.isNew === false || p.tags?.includes('2hand')
        );
        setProducts(secondhand);

        // Fetch Brands
        const brandRes = await fetch(`${API_URL}/api/brands`);
        const brandData = await brandRes.json();
        if (brandData.success) {
          setBrands(brandData.brands || []);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // Filter Logic
  const filteredProducts = React.useMemo(() => {
    return products.filter(p => {
      const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchBrand = selectedBrand ? p.brand === selectedBrand : true;
      
      // Lọc theo size trong variants
      const matchSize = selectedSize ? 
        p.variants?.some((v: any) => v.options.some((opt: any) => opt.name === selectedSize)) : 
        true;

      return matchSearch && matchBrand && matchSize;
    }).slice(0, 4); // Chỉ hiện 4 cái tiêu biểu ở trang chủ
  }, [products, searchTerm, selectedBrand, selectedSize]);

  return (
    <section className="py-24 bg-stone-100 relative overflow-hidden font-sans">
      {/* Decorative BG Text */}
      <div className="absolute top-0 right-0 text-[200px] font-black text-stone-200 leading-none select-none -z-0 opacity-40 pointer-events-none italic">
        2HAND
      </div>

      <div className="container mx-auto px-4 relative z-10">
        
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <span className="bg-red-600 text-white px-4 py-1 font-black text-[10px] uppercase tracking-[0.2em] rounded-none shadow-lg shadow-red-600/20">
              Selected 2Hand
            </span>
            <div className="h-[1px] w-12 bg-red-600"></div>
            <span className="text-red-600 font-black text-[10px] uppercase tracking-widest flex items-center gap-1 animate-pulse">
               <History size={12}/> Hàng tuyển chọn - Đã vệ sinh
            </span>
          </div>
          <h3 className="text-5xl md:text-6xl font-black text-gray-900 italic uppercase tracking-tighter">SĂN DEAL SIÊU LƯỚT</h3>
        </div>

        {/* 🔍 QUICK FILTER BAR */}
        <div className="bg-white p-2   mb-12 flex flex-col lg:flex-row gap-2 rounded-none ">
           {/* Search */}
           <div className="relative flex-1 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-primary transition" size={20} />
              <input 
                 type="text" 
                 placeholder="Tên giày bạn đang tìm..." 
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
                 className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-none focus:ring-2 focus:ring-primary outline-none font-bold uppercase text-xs tracking-widest"
              />
           </div>

           {/* Brand Select */}
           <div className="relative lg:w-60 group border-l-0 lg:border-l border-gray-100">
              <select 
                 value={selectedBrand}
                 onChange={(e) => setSelectedBrand(e.target.value)}
                 className="w-full px-6 py-4 bg-gray-50 lg:bg-white border-none rounded-none focus:ring-2 focus:ring-primary outline-none font-black uppercase text-[10px] tracking-widest appearance-none cursor-pointer"
              >
                 <option value="">Tất cả thương hiệu</option>
                 {brands.map(b => (
                    <option key={b._id} value={b.name}>
                       {b.name}
                    </option>
                 ))}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
           </div>

           {/* Size Select */}
           <div className="relative lg:w-48 group border-l-0 lg:border-l border-gray-100">
              <select 
                 value={selectedSize}
                 onChange={(e) => setSelectedSize(e.target.value)}
                 className="w-full px-6 py-4 bg-gray-50 lg:bg-white border-none rounded-none focus:ring-2 focus:ring-primary outline-none font-black uppercase text-[10px] tracking-widest appearance-none cursor-pointer"
              >
                 <option value="">Chọn Size</option>
                 {SIZES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
           </div>

           {/* View Full Button */}
           <Link 
              href="/products?type=2hand"
              className="bg-primary text-white px-8 py-4 font-black uppercase text-xs tracking-[0.2em] hover:bg-primary-dark transition rounded-none flex items-center justify-center gap-2"
           >
              Xem Kho 2Hand <Package size={18}/>
           </Link>
        </div>

        {/* Product Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="aspect-square bg-white border border-gray-200 animate-pulse rounded-none"></div>
            ))}
          </div>
        ) : (
          <div>
            {filteredProducts.length > 0 ? (
               <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-8">
                  {filteredProducts.map((product) => (
                    <ProductCard key={product._id || product.id} product={product} />
                  ))}
               </div>
            ) : (
               <div className="bg-white py-20 text-center border-2 border-dashed border-gray-300">
                  <p className="text-gray-400 font-black uppercase tracking-widest text-sm">Không tìm thấy deal nào khớp với bộ lọc</p>
                  <button onClick={() => {setSearchTerm(''); setSelectedBrand(''); setSelectedSize('');}} className="mt-4 text-primary font-bold underline uppercase text-xs">Xóa bộ lọc</button>
               </div>
            )}
          </div>
        )}

      </div>
    </section>
  );
}

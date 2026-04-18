'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Filter, SlidersHorizontal, X, Check, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import ProductCard from '../../components/ProductCard';
import { Product } from '../../lib/shared/types';
import { CLEAN_API_URL } from '@lib/shared/constants';

const API_URL = CLEAN_API_URL;
const PRODUCTS_PER_PAGE = 12;

interface Category {
  id?: string;
  _id?: string;
  name: string;
  slug: string;
}

const PRICE_RANGES = [
  { id: 'under_1m', label: 'Dưới 1 triệu', min: 0, max: 1000000 },
  { id: '1m_3m', label: '1 triệu - 3 triệu', min: 1000000, max: 3000000 },
  { id: '3m_5m', label: '3 triệu - 5 triệu', min: 3000000, max: 5000000 },
  { id: '5m_10m', label: '5 triệu - 10 triệu', min: 5000000, max: 10000000 },
  { id: 'over_10m', label: 'Trên 10 triệu', min: 10000000, max: Infinity },
];

const CONDITION_LIST = ['New', 'Like New', '98%', '95%', 'Used'];
const SIZE_LIST = ['36', '37', '38', '39', '40', '41', '42', '43', '44', '45'];

function ProductsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all');
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedPriceRange, setSelectedPriceRange] = useState<string>('');
  const [showMobileFilter, setShowMobileFilter] = useState(false);
  const [sortBy, setSortBy] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);

  const searchKeyword = searchParams.get('search') || '';
  const productType = searchParams.get('type') || 'all';

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [catRes, brandRes] = await Promise.all([
          fetch(`${API_URL}/api/categories`),
          fetch(`${API_URL}/api/brands`)
        ]);
        
        const catData = await catRes.json();
        const brandData = await brandRes.json();
        
        setCategories(Array.isArray(catData) ? catData : catData.data || []);
        setBrands(brandData.brands || brandData || []);

        const typeParam = productType !== 'all' ? `?tag=${productType}` : '';
        const sortParam = typeParam ? '&sort=newest&limit=100' : '?sort=newest&limit=100';
        const prodRes = await fetch(`${API_URL}/api/products${typeParam}${sortParam}`);
        const prodData = await prodRes.json();
        setProducts(Array.isArray(prodData) ? prodData : prodData.data || []);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [productType]);

  useEffect(() => {
    const cat = searchParams.get('category');
    if (cat) setSelectedCategory(cat);
    const brand = searchParams.get('brand');
    if (brand) setSelectedBrands([brand]);
  }, [searchParams]);

  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      if (searchKeyword) {
        const keyword = searchKeyword.toLowerCase();
        if (!product.name.toLowerCase().includes(keyword) && 
            !product.brand?.toLowerCase().includes(keyword)) return false;
      }

      if (productType !== 'all') {
        const matchLegacy = productType === 'new' ? product.isNew : !product.isNew;
        if (!product.tags?.includes(productType) && !matchLegacy) return false;
      }

      if (selectedCategory !== 'all' && product.categorySlug !== selectedCategory) return false;
      if (selectedBrands.length > 0 && !selectedBrands.includes(product.brand || '')) return false;
      
      if (selectedConditions.length > 0) {
        if (!selectedConditions.includes(product.specs?.condition || 'New')) return false;
      }
      
      if (selectedPriceRange) {
        const range = PRICE_RANGES.find(r => r.id === selectedPriceRange);
        if (range && (product.price < range.min || product.price >= range.max)) return false;
      }

      if (selectedSizes.length > 0) {
        const hasSize = product.variants?.some(v => 
          v.options.some((opt: any) => selectedSizes.includes(opt.name))
        );
        if (!hasSize) return false;
      }
      return true;
    });
  }, [products, selectedCategory, selectedBrands, selectedConditions, selectedPriceRange, selectedSizes, searchKeyword, productType]);

  const sortedProducts = useMemo(() => {
    let sorted = [...filteredProducts];
    switch (sortBy) {
      case 'price-asc': sorted.sort((a, b) => a.price - b.price); break;
      case 'price-desc': sorted.sort((a, b) => b.price - a.price); break;
      case 'name-asc': sorted.sort((a, b) => a.name.localeCompare(b.name)); break;
      case 'newest': sorted.sort((a, b) => (new Date(b.createdAt || 0).getTime()) - (new Date(a.createdAt || 0).getTime())); break;
    }
    return sorted;
  }, [filteredProducts, sortBy]);

  const totalPages = Math.ceil(sortedProducts.length / PRODUCTS_PER_PAGE);
  const currentProducts = sortedProducts.slice((currentPage - 1) * PRODUCTS_PER_PAGE, currentPage * PRODUCTS_PER_PAGE);

  const toggleBrand = (brandName: string) => {
    setSelectedBrands(prev => prev.includes(brandName) ? prev.filter(b => b !== brandName) : [...prev, brandName]);
    setCurrentPage(1);
  };

  const FilterSection = ({ title, children }: { title: string, children: React.ReactNode }) => (
    <div className="mb-10 border-b border-gray-100 pb-8 last:border-0 last:pb-0">
      <h4 className="font-black text-[10px] uppercase tracking-[0.2em] mb-6 text-gray-400">{title}</h4>
      {children}
    </div>
  );

  if (isLoading) return (
    <div className="min-h-screen bg-white flex justify-center items-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  );

  return (
    <div className="bg-white min-h-screen font-sans text-gray-900">
      <div className="bg-gray-50 py-16 border-b border-gray-200">
        <div className="container mx-auto px-4 text-center lg:text-left">
          <h1 className="text-5xl md:text-7xl font-black italic tracking-tighter mb-4 uppercase italic">
            ALL <span className="text-primary">SNEAKERS</span>
          </h1>
          <p className="text-gray-500 max-w-2xl font-bold uppercase tracking-widest text-[10px] mx-auto lg:mx-0">
            Khám phá bộ sưu tập giày chính hãng và 2hand tuyển chọn. Fullbox, check legit trọn đời.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="flex gap-12">
          <aside className="hidden lg:block w-72 flex-shrink-0">
            <FilterSection title="Loại Giày (Danh Mục)">
              <div className="space-y-3">
                <button 
                  onClick={() => setSelectedCategory('all')}
                  className={`block w-full text-left text-xs font-black uppercase tracking-widest transition ${selectedCategory === 'all' ? 'text-primary' : 'text-gray-400 hover:text-black'}`}
                >
                  Tất cả sản phẩm
                </button>
                {categories.map(cat => (
                  <button 
                    key={cat.slug}
                    onClick={() => setSelectedCategory(cat.slug)}
                    className={`block w-full text-left text-xs font-black uppercase tracking-widest transition ${selectedCategory === cat.slug ? 'text-primary' : 'text-gray-400 hover:text-black'}`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </FilterSection>

            <FilterSection title="Thương Hiệu">
              <div className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                {brands.map(brand => (
                  <label key={brand._id} className="flex items-center gap-3 cursor-pointer group">
                    <div className={`w-5 h-5 border rounded-none flex items-center justify-center transition ${selectedBrands.includes(brand.name) ? 'bg-primary border-primary' : 'border-gray-300 group-hover:border-primary'}`}>
                      {selectedBrands.includes(brand.name) && <Check size={12} className="text-white"/>}
                    </div>
                    <input type="checkbox" className="hidden" checked={selectedBrands.includes(brand.name)} onChange={() => toggleBrand(brand.name)}/>
                    <span className={`text-xs font-black uppercase tracking-widest ${selectedBrands.includes(brand.name) ? 'text-primary' : 'text-gray-500'}`}>{brand.name}</span>
                  </label>
                ))}
              </div>
            </FilterSection>

            <FilterSection title="Khoảng Giá">
              <div className="space-y-3">
                {PRICE_RANGES.map(range => (
                  <label key={range.id} className="flex items-center gap-3 cursor-pointer group">
                    <div className={`w-5 h-5 rounded-none border flex items-center justify-center ${selectedPriceRange === range.id ? 'border-primary' : 'border-gray-300'}`}>
                      {selectedPriceRange === range.id && <div className="w-2.5 h-2.5 bg-primary rounded-none"/>}
                    </div>
                    <input type="radio" name="price" className="hidden" checked={selectedPriceRange === range.id} onChange={() => setSelectedPriceRange(range.id)}/>
                    <span className={`text-xs font-black uppercase tracking-widest ${selectedPriceRange === range.id ? 'text-primary' : 'text-gray-500'}`}>{range.label}</span>
                  </label>
                ))}
              </div>
            </FilterSection>

            <button onClick={() => {setSelectedBrands([]); setSelectedCategory('all'); setSelectedPriceRange('');}} className="w-full py-4 border-2 border-gray-200 rounded-none font-black text-xs uppercase tracking-widest hover:bg-black hover:text-white transition">Xóa bộ lọc</button>
          </aside>

          <main className="flex-1">
            <div className="flex justify-between items-center mb-10 pb-6 border-b border-gray-100">
               <p className="text-xs font-black uppercase tracking-[0.2em] text-gray-400">
                Hiển thị <span className="text-black">{currentProducts.length}</span> / {filteredProducts.length} sản phẩm
              </p>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="bg-gray-50 border-none text-xs font-black uppercase tracking-widest py-2 px-4 outline-none">
                <option value="newest">Mới nhất</option>
                <option value="price-asc">Giá: Thấp - Cao</option>
                <option value="price-desc">Giá: Cao - Thấp</option>
                <option value="name-asc">Tên: A-Z</option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {currentProducts.map(product => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center mt-20 gap-3">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button key={page} onClick={() => {setCurrentPage(page); window.scrollTo({top: 0, behavior: 'smooth'});}} className={`w-12 h-12 font-black text-xs transition ${currentPage === page ? 'bg-primary text-white' : 'bg-white border-2 border-gray-100 text-gray-400 hover:border-primary'}`}>{page}</button>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex justify-center items-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>}>
      <ProductsContent />
    </Suspense>
  );
}

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Filter, SlidersHorizontal, X, Check, ChevronDown } from 'lucide-react';
import ProductCard from '../../components/ProductCard';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
const PRODUCTS_PER_PAGE = 12;

interface Product {
  id?: string;
  _id?: string;
  name: string;
  brand?: string;
  price: number;
  originalPrice?: number;
  rating?: number;
  image?: string;
  images?: string[];
  description?: string;
  categorySlug?: string;
  slug?: string;
  specs?: {
    condition?: string;
    accessories?: string;
    styleCode?: string;
  };
  stock?: number;
  soldCount?: number;
  isNew?: boolean;
  hasPromotion?: boolean;
  variants?: any[];
}

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

const CONDITIONS = ['New', 'Like New', '98%', '95%', 'Used'];
const SIZES = ['36', '37', '38', '39', '40', '41', '42', '43', '44', '45'];
const BRANDS = ['Nike', 'Adidas', 'Jordan', 'New Balance', 'MLB', 'Vans', 'Converse', 'Puma'];

export default function ProductsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all');
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedPriceRange, setSelectedPriceRange] = useState<string>('');
  const [showMobileFilter, setShowMobileFilter] = useState(false);
  const [sortBy, setSortBy] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const catRes = await fetch(`${API_URL}/api/categories`);
        const catData = await catRes.json();
        setCategories(Array.isArray(catData) ? catData : catData.data || []);

        const prodRes = await fetch(`${API_URL}/api/products`);
        const prodData = await prodRes.json();
        setProducts(Array.isArray(prodData) ? prodData : prodData.data || []);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const cat = searchParams.get('category');
    if (cat) setSelectedCategory(cat);
  }, [searchParams]);

  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      if (selectedCategory !== 'all' && product.categorySlug !== selectedCategory) return false;
      if (selectedBrands.length > 0 && !selectedBrands.includes(product.brand || '')) return false;
      if (selectedConditions.length > 0) {
        const prodCond = product.specs?.condition || 'New';
        if (!selectedConditions.includes(prodCond)) return false;
      }
      if (selectedPriceRange) {
        const range = PRICE_RANGES.find(r => r.id === selectedPriceRange);
        if (range) {
          if (product.price < range.min || product.price >= range.max) return false;
        }
      }
      if (selectedSizes.length > 0) {
        if (!product.variants || product.variants.length === 0) return false;
        const hasSize = product.variants.some(v => 
          v.options.some((opt: any) => selectedSizes.includes(opt.name))
        );
        if (!hasSize) return false;
      }
      return true;
    });
  }, [products, selectedCategory, selectedBrands, selectedConditions, selectedPriceRange, selectedSizes]);

  const sortedProducts = useMemo(() => {
    let sorted = [...filteredProducts];
    switch (sortBy) {
      case 'price-asc': sorted.sort((a, b) => a.price - b.price); break;
      case 'price-desc': sorted.sort((a, b) => b.price - a.price); break;
      case 'name-asc': sorted.sort((a, b) => a.name.localeCompare(b.name)); break;
      case 'newest': sorted.sort((a, b) => (b._id || '').localeCompare(a._id || '')); break;
      default: break;
    }
    return sorted;
  }, [filteredProducts, sortBy]);

  const totalPages = Math.ceil(sortedProducts.length / PRODUCTS_PER_PAGE);
  const currentProducts = sortedProducts.slice(
    (currentPage - 1) * PRODUCTS_PER_PAGE,
    currentPage * PRODUCTS_PER_PAGE
  );

  const toggleBrand = (brand: string) => {
    setSelectedBrands(prev => prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]);
    setCurrentPage(1);
  };

  const toggleCondition = (cond: string) => {
    setSelectedConditions(prev => prev.includes(cond) ? prev.filter(c => c !== cond) : [...prev, cond]);
    setCurrentPage(1);
  };

  const toggleSize = (size: string) => {
    setSelectedSizes(prev => prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSelectedBrands([]);
    setSelectedConditions([]);
    setSelectedSizes([]);
    setSelectedPriceRange('');
    setSelectedCategory('all');
    router.push('/products');
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
        <div className="container mx-auto px-4">
          <h1 className="text-5xl md:text-7xl font-black italic tracking-tighter mb-4 uppercase italic uppercase">
            ALL <span className="text-primary">SNEAKERS</span>
          </h1>
          <p className="text-gray-500 max-w-2xl font-bold uppercase tracking-widest text-[10px]">
            Khám phá bộ sưu tập giày chính hãng và 2hand tuyển chọn. Fullbox, check legit trọn đời.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="lg:hidden flex justify-between items-center mb-8">
          <button 
            onClick={() => setShowMobileFilter(true)}
            className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-none font-black text-xs uppercase tracking-widest"
          >
            <Filter size={16}/> Bộ lọc
          </button>
          <span className="font-black text-xs text-gray-400 uppercase tracking-widest">{sortedProducts.length} sản phẩm</span>
        </div>

        <div className="flex gap-12">
          <aside className={`
            fixed inset-0 z-[50] bg-white p-8 overflow-y-auto w-full transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 lg:w-72 lg:p-0 lg:block lg:shadow-none lg:bg-transparent lg:inset-auto lg:h-auto lg:overflow-visible
            ${showMobileFilter ? 'translate-x-0' : '-translate-x-full'}
          `}>
            <div className="flex justify-between items-center mb-10 lg:hidden">
              <h3 className="font-black text-2xl uppercase italic tracking-tighter">Bộ Lọc</h3>
              <button onClick={() => setShowMobileFilter(false)} className="p-2 bg-gray-100"><X size={24}/></button>
            </div>

            <FilterSection title="Danh Mục">
              <div className="space-y-3">
                <button 
                  onClick={() => setSelectedCategory('all')}
                  className={`block w-full text-left text-xs font-black uppercase tracking-widest transition ${selectedCategory === 'all' ? 'text-primary' : 'text-gray-400 hover:text-black'}`}
                >
                  Tất cả sản phẩm
                </button>
                {categories.map(cat => (
                  <button 
                    key={cat.id || cat._id}
                    onClick={() => setSelectedCategory(cat.slug)}
                    className={`block w-full text-left text-xs font-black uppercase tracking-widest transition ${selectedCategory === cat.slug ? 'text-primary' : 'text-gray-400 hover:text-black'}`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </FilterSection>

            <FilterSection title="Tình Trạng">
              <div className="space-y-3">
                {CONDITIONS.map(cond => (
                  <label key={cond} className="flex items-center gap-3 cursor-pointer group">
                    <div className={`w-5 h-5 border rounded-none flex items-center justify-center transition ${selectedConditions.includes(cond) ? 'bg-primary border-primary' : 'border-gray-300 group-hover:border-primary'}`}>
                      {selectedConditions.includes(cond) && <Check size={12} className="text-white"/>}
                    </div>
                    <input type="checkbox" className="hidden" checked={selectedConditions.includes(cond)} onChange={() => toggleCondition(cond)}/>
                    <span className={`text-xs font-black uppercase tracking-widest ${selectedConditions.includes(cond) ? 'text-primary' : 'text-gray-500'}`}>{cond}</span>
                  </label>
                ))}
              </div>
            </FilterSection>

            <FilterSection title="Size (EU)">
              <div className="grid grid-cols-4 gap-2">
                {SIZES.map(size => (
                  <button
                    key={size}
                    onClick={() => toggleSize(size)}
                    className={`h-10 border rounded-none text-xs font-black transition ${
                      selectedSizes.includes(size) 
                        ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' 
                        : 'bg-white text-gray-400 border-gray-200 hover:border-primary hover:text-primary'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </FilterSection>

            <FilterSection title="Thương Hiệu">
              <div className="space-y-3">
                {BRANDS.map(brand => (
                  <label key={brand} className="flex items-center gap-3 cursor-pointer group">
                    <div className={`w-5 h-5 border rounded-none flex items-center justify-center transition ${selectedBrands.includes(brand) ? 'bg-primary border-primary' : 'border-gray-300 group-hover:border-primary'}`}>
                      {selectedBrands.includes(brand) && <Check size={12} className="text-white"/>}
                    </div>
                    <input type="checkbox" className="hidden" checked={selectedBrands.includes(brand)} onChange={() => toggleBrand(brand)}/>
                    <span className={`text-xs font-black uppercase tracking-widest ${selectedBrands.includes(brand) ? 'text-primary' : 'text-gray-500'}`}>{brand}</span>
                  </label>
                ))}
              </div>
            </FilterSection>

            <FilterSection title="Khoảng Giá">
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className={`w-5 h-5 rounded-none border flex items-center justify-center ${selectedPriceRange === '' ? 'border-primary' : 'border-gray-300'}`}>
                    {selectedPriceRange === '' && <div className="w-2.5 h-2.5 bg-primary rounded-none"/>}
                  </div>
                  <input type="radio" name="price" className="hidden" checked={selectedPriceRange === ''} onChange={() => setSelectedPriceRange('')}/>
                  <span className={`text-xs font-black uppercase tracking-widest ${selectedPriceRange === '' ? 'text-primary' : 'text-gray-500'}`}>Tất cả giá</span>
                </label>
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

            <button 
              onClick={clearFilters}
              className="w-full py-4 border-2 border-gray-200 rounded-none font-black text-xs uppercase tracking-[0.2em] hover:bg-black hover:text-white hover:border-black transition mt-4"
            >
              Xóa bộ lọc
            </button>
          </aside>

          <main className="flex-1">
            <div className="flex justify-between items-center mb-10 pb-6 border-b border-gray-100">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 hidden lg:block">
                Hiển thị <span className="text-black">{currentProducts.length}</span> / {filteredProducts.length} sản phẩm
              </p>
              
              <div className="flex items-center gap-4 ml-auto">
                <span className="text-xs font-black uppercase tracking-[0.2em] text-gray-400">Sắp xếp:</span>
                <select 
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-gray-50 border-none text-xs font-black uppercase tracking-widest rounded-none focus:ring-0 cursor-pointer outline-none py-2 px-4"
                >
                  <option value="newest">Mới nhất</option>
                  <option value="price-asc">Giá: Thấp - Cao</option>
                  <option value="price-desc">Giá: Cao - Thấp</option>
                  <option value="name-asc">Tên: A-Z</option>
                </select>
              </div>
            </div>

            {currentProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {currentProducts.map(product => (
                  <ProductCard key={product._id || product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="text-center py-32 bg-gray-50 rounded-none border border-dashed border-gray-300">
                <div className="text-7xl mb-6">👟</div>
                <h3 className="text-2xl font-black italic uppercase tracking-tighter mb-2">Không tìm thấy sản phẩm</h3>
                <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px] mb-10">Thử thay đổi bộ lọc hoặc tìm kiếm từ khóa khác.</p>
                <button 
                  onClick={clearFilters}
                  className="bg-primary text-white px-10 py-4 rounded-none font-black uppercase tracking-[0.2em] hover:bg-primary-dark transition shadow-xl shadow-primary/20"
                >
                  Xóa tất cả bộ lọc
                </button>
              </div>
            )}

            {totalPages > 1 && (
              <div className="flex justify-center mt-20 gap-3">
                 {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => {setCurrentPage(page); window.scrollTo({top: 0, behavior: 'smooth'});}}
                      className={`w-12 h-12 rounded-none flex items-center justify-center font-black text-xs transition ${
                        currentPage === page 
                          ? 'bg-primary text-white shadow-lg shadow-primary/30' 
                          : 'bg-white border-2 border-gray-100 text-gray-400 hover:border-primary hover:text-primary'
                      }`}
                    >
                      {page}
                    </button>
                 ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
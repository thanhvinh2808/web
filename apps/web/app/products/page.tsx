'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Filter, SlidersHorizontal, X, Check, ChevronDown } from 'lucide-react';
import ProductCard from '../../components/ProductCard';

// --- API URL ---
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// --- CONSTANTS ---
const PRODUCTS_PER_PAGE = 12;

// --- TYPES ---
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

// --- FILTER DATA ---
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

  // Data State
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filter State
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all');
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedPriceRange, setSelectedPriceRange] = useState<string>('');
  const [showMobileFilter, setShowMobileFilter] = useState(false);
  const [sortBy, setSortBy] = useState('newest');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  // --- FETCH DATA ---
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch Categories
        const catRes = await fetch(`${API_URL}/api/categories`);
        const catData = await catRes.json();
        setCategories(Array.isArray(catData) ? catData : catData.data || []);

        // Fetch Products
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

  // Update Category from URL
  useEffect(() => {
    const cat = searchParams.get('category');
    if (cat) setSelectedCategory(cat);
  }, [searchParams]);

  // --- FILTER LOGIC ---
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      // 1. Category
      if (selectedCategory !== 'all' && product.categorySlug !== selectedCategory) return false;

      // 2. Brand
      if (selectedBrands.length > 0 && !selectedBrands.includes(product.brand || '')) return false;

      // 3. Condition (Dựa vào specs.condition)
      if (selectedConditions.length > 0) {
        const prodCond = product.specs?.condition || 'New';
        if (!selectedConditions.includes(prodCond)) return false;
      }

      // 4. Price
      if (selectedPriceRange) {
        const range = PRICE_RANGES.find(r => r.id === selectedPriceRange);
        if (range) {
          if (product.price < range.min || product.price >= range.max) return false;
        }
      }

      // 5. Size (Kiểm tra trong variants)
      if (selectedSizes.length > 0) {
        // Nếu không có variants, bỏ qua (hoặc coi như không match nếu muốn chặt chẽ)
        if (!product.variants || product.variants.length === 0) return false;
        
        // Tìm xem có variant nào chứa size đã chọn không
        // Giả sử variant name là 'Size' hoặc option name là '42'
        const hasSize = product.variants.some(v => 
          v.options.some((opt: any) => selectedSizes.includes(opt.name))
        );
        if (!hasSize) return false;
      }

      return true;
    });
  }, [products, selectedCategory, selectedBrands, selectedConditions, selectedPriceRange, selectedSizes]);

  // --- SORT LOGIC ---
  const sortedProducts = useMemo(() => {
    let sorted = [...filteredProducts];
    switch (sortBy) {
      case 'price-asc': sorted.sort((a, b) => a.price - b.price); break;
      case 'price-desc': sorted.sort((a, b) => b.price - a.price); break;
      case 'name-asc': sorted.sort((a, b) => a.name.localeCompare(b.name)); break;
      case 'newest': sorted.sort((a, b) => (b.id ? parseInt(b.id) : 0) - (a.id ? parseInt(a.id) : 0)); break; // Giả sử ID tăng dần
      default: break;
    }
    return sorted;
  }, [filteredProducts, sortBy]);

  // --- PAGINATION ---
  const totalPages = Math.ceil(sortedProducts.length / PRODUCTS_PER_PAGE);
  const currentProducts = sortedProducts.slice(
    (currentPage - 1) * PRODUCTS_PER_PAGE,
    currentPage * PRODUCTS_PER_PAGE
  );

  // --- HANDLERS ---
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

  // --- UI COMPONENTS ---
  const FilterSection = ({ title, children }: { title: string, children: React.ReactNode }) => (
    <div className="mb-8 border-b border-gray-100 pb-6 last:border-0 last:pb-0">
      <h4 className="font-bold text-sm uppercase tracking-wider mb-4 text-gray-900">{title}</h4>
      {children}
    </div>
  );

  if (isLoading) return (
    <div className="min-h-screen bg-white flex justify-center items-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
    </div>
  );

  return (
    <div className="bg-white min-h-screen font-sans text-gray-900">
      {/* HEADER */}
      <div className="bg-gray-50 py-12 border-b border-gray-200">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-black italic tracking-tighter mb-4">
            ALL <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">SNEAKERS</span>
          </h1>
          <p className="text-gray-500 max-w-2xl font-medium">
            Khám phá bộ sưu tập giày chính hãng và 2hand tuyển chọn. Fullbox, check legit trọn đời.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* MOBILE FILTER TOGGLE */}
        <div className="lg:hidden flex justify-between items-center mb-6">
          <button 
            onClick={() => setShowMobileFilter(true)}
            className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded font-bold text-sm uppercase"
          >
            <Filter size={16}/> Bộ lọc
          </button>
          <span className="font-bold text-sm text-gray-500">{sortedProducts.length} sản phẩm</span>
        </div>

        <div className="flex gap-8">
          {/* SIDEBAR FILTER (DESKTOP) */}
          <aside className={`
            fixed inset-0 z-50 bg-white p-6 overflow-y-auto w-80 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 lg:w-64 lg:p-0 lg:block lg:shadow-none lg:bg-transparent lg:inset-auto lg:h-auto lg:overflow-visible
            ${showMobileFilter ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
          `}>
            <div className="flex justify-between items-center mb-6 lg:hidden">
              <h3 className="font-black text-xl uppercase">Bộ Lọc</h3>
              <button onClick={() => setShowMobileFilter(false)}><X size={24}/></button>
            </div>

            {/* DANH MỤC */}
            <FilterSection title="Danh Mục">
              <div className="space-y-2">
                <button 
                  onClick={() => setSelectedCategory('all')}
                  className={`block w-full text-left text-sm font-medium transition ${selectedCategory === 'all' ? 'text-blue-600 font-bold' : 'text-gray-600 hover:text-black'}`}
                >
                  Tất cả
                </button>
                {categories.map(cat => (
                  <button 
                    key={cat.id || cat._id}
                    onClick={() => setSelectedCategory(cat.slug)}
                    className={`block w-full text-left text-sm font-medium transition ${selectedCategory === cat.slug ? 'text-blue-600 font-bold' : 'text-gray-600 hover:text-black'}`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </FilterSection>

            {/* TÌNH TRẠNG */}
            <FilterSection title="Tình Trạng">
              <div className="space-y-2">
                {CONDITIONS.map(cond => (
                  <label key={cond} className="flex items-center gap-3 cursor-pointer group">
                    <div className={`w-5 h-5 border rounded flex items-center justify-center transition ${selectedConditions.includes(cond) ? 'bg-black border-black' : 'border-gray-300 group-hover:border-gray-500'}`}>
                      {selectedConditions.includes(cond) && <Check size={12} className="text-white"/>}
                    </div>
                    <input type="checkbox" className="hidden" checked={selectedConditions.includes(cond)} onChange={() => toggleCondition(cond)}/>
                    <span className="text-sm font-medium text-gray-700">{cond}</span>
                  </label>
                ))}
              </div>
            </FilterSection>

            {/* SIZE */}
            <FilterSection title="Size (EU)">
              <div className="grid grid-cols-4 gap-2">
                {SIZES.map(size => (
                  <button
                    key={size}
                    onClick={() => toggleSize(size)}
                    className={`h-10 border rounded text-sm font-bold transition ${
                      selectedSizes.includes(size) 
                        ? 'bg-black text-white border-black' 
                        : 'bg-white text-gray-600 border-gray-200 hover:border-black'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </FilterSection>

            {/* THƯƠNG HIỆU */}
            <FilterSection title="Thương Hiệu">
              <div className="space-y-2">
                {BRANDS.map(brand => (
                  <label key={brand} className="flex items-center gap-3 cursor-pointer group">
                    <div className={`w-5 h-5 border rounded flex items-center justify-center transition ${selectedBrands.includes(brand) ? 'bg-black border-black' : 'border-gray-300 group-hover:border-gray-500'}`}>
                      {selectedBrands.includes(brand) && <Check size={12} className="text-white"/>}
                    </div>
                    <input type="checkbox" className="hidden" checked={selectedBrands.includes(brand)} onChange={() => toggleBrand(brand)}/>
                    <span className="text-sm font-medium text-gray-700">{brand}</span>
                  </label>
                ))}
              </div>
            </FilterSection>

            {/* KHOẢNG GIÁ */}
            <FilterSection title="Khoảng Giá">
              <div className="space-y-2">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${selectedPriceRange === '' ? 'border-blue-600' : 'border-gray-300'}`}>
                    {selectedPriceRange === '' && <div className="w-2.5 h-2.5 bg-blue-600 rounded-full"/>}
                  </div>
                  <input type="radio" name="price" className="hidden" checked={selectedPriceRange === ''} onChange={() => setSelectedPriceRange('')}/>
                  <span className="text-sm font-medium text-gray-700">Tất cả</span>
                </label>
                {PRICE_RANGES.map(range => (
                  <label key={range.id} className="flex items-center gap-3 cursor-pointer group">
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${selectedPriceRange === range.id ? 'border-blue-600' : 'border-gray-300'}`}>
                      {selectedPriceRange === range.id && <div className="w-2.5 h-2.5 bg-blue-600 rounded-full"/>}
                    </div>
                    <input type="radio" name="price" className="hidden" checked={selectedPriceRange === range.id} onChange={() => setSelectedPriceRange(range.id)}/>
                    <span className="text-sm font-medium text-gray-700">{range.label}</span>
                  </label>
                ))}
              </div>
            </FilterSection>

            <button 
              onClick={clearFilters}
              className="w-full py-3 border border-gray-300 rounded font-bold text-sm uppercase hover:bg-gray-50 transition mt-4"
            >
              Xóa bộ lọc
            </button>
          </aside>

          {/* MAIN CONTENT */}
          <main className="flex-1">
            {/* Sort & Info Bar */}
            <div className="flex justify-between items-center mb-6">
              <p className="text-sm text-gray-500 hidden lg:block">
                Hiển thị <span className="font-bold text-black">{currentProducts.length}</span> / {filteredProducts.length} sản phẩm
              </p>
              
              <div className="flex items-center gap-3 ml-auto">
                <span className="text-sm font-medium text-gray-500">Sắp xếp:</span>
                <select 
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-gray-50 border-none text-sm font-bold rounded focus:ring-0 cursor-pointer outline-none"
                >
                  <option value="newest">Mới nhất</option>
                  <option value="price-asc">Giá: Thấp - Cao</option>
                  <option value="price-desc">Giá: Cao - Thấp</option>
                  <option value="name-asc">Tên: A-Z</option>
                </select>
              </div>
            </div>

            {/* PRODUCTS GRID */}
            {currentProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
                {currentProducts.map(product => (
                  <ProductCard key={product.id || product._id} product={product} />
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                <div className="text-6xl mb-4">👟</div>
                <h3 className="text-xl font-bold mb-2">Không tìm thấy sản phẩm</h3>
                <p className="text-gray-500 mb-6">Thử thay đổi bộ lọc hoặc tìm kiếm từ khóa khác.</p>
                <button 
                  onClick={clearFilters}
                  className="bg-black text-white px-6 py-3 rounded-lg font-bold uppercase hover:bg-stone-800 transition"
                >
                  Xóa tất cả bộ lọc
                </button>
              </div>
            )}

            {/* PAGINATION */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-12 gap-2">
                 {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => {setCurrentPage(page); window.scrollTo({top: 0, behavior: 'smooth'});}}
                      className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold transition ${
                        currentPage === page 
                          ? 'bg-black text-white' 
                          : 'bg-white border border-gray-200 text-gray-600 hover:border-black'
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

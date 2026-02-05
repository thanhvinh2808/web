"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation"; // Removed for artifact demo
import { Search, X } from "lucide-react";

interface Product {
  id: number;
  name: string;
  brand: string;
  price: number;
  originalPrice: number;
  image: string;
  categorySlug?: string;
  slug?: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || '$ {process.env.NEXT_PUBLIC_API_URL' || 'http://localhost:5000';

export const SearchBar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [isProductsLoading, setIsProductsLoading] = useState(true); // New state
  const [apiError, setApiError] = useState<string | null>(null); // New state
  const inputRef = useRef<HTMLInputElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const router = useRouter(); // Removed for artifact demo
  
  // Mock navigation function for demo
  // const navigate = (path: string) => {
  //   console.log('🔗 Would navigate to:', path);
  //   alert(`Navigation: ${path}`);
  // };

  // ✅ FIX 1: Hàm loại bỏ dấu tiếng Việt
  const removeVietnameseTones = (str: string) => {
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .toLowerCase();
  };

  // ✅ FIX 2: Thêm logs để debug + xử lý lỗi tốt hơn
  useEffect(() => {
    const fetchProducts = async () => {
      setIsProductsLoading(true);
      setApiError(null);
      
      try {
        console.log('🔄 Fetching products from:', `${API_URL}/api/products`);
        const response = await fetch(`${API_URL}/api/products`);
        
        console.log('📡 Response status:', response.status);
        console.log('📡 Response ok:', response.ok);
        
        if (response.ok) {
          const data = await response.json();
          console.log('✅ Raw API Response:', data);
          console.log('✅ Is Array?:', Array.isArray(data));
          
          // Kiểm tra nếu data có structure khác
          let products = [];
          if (Array.isArray(data)) {
            products = data;
          } else if (data && Array.isArray(data.products)) {
            products = data.products;
            console.log('📦 Products from data.products:', products.length);
          } else if (data && Array.isArray(data.data)) {
            products = data.data;
            console.log('📦 Products from data.data:', products.length);
          }
          
          console.log('💾 Setting allProducts with:', products.length, 'items');
          setAllProducts(products);
          
          if (products.length > 0) {
            console.log('📋 Sample products:', products.slice(0, 3));
            console.log('🔍 First product structure:', products[0]);
          } else {
            console.warn('⚠️ No products found in response!');
            setApiError('Không có sản phẩm nào');
          }
        } else {
          console.error('❌ API Error:', response.status, response.statusText);
          const errorText = await response.text();
          console.error('❌ Error body:', errorText);
          setApiError(`API Error: ${response.status}`);
        }
      } catch (error) {
        console.error('❌ Fetch Error:', error);
        setApiError(`Lỗi kết nối: ${(error as any).message}`);
      } finally {
        setIsProductsLoading(false);
        console.log('✅ API fetch completed');
      }
    };
    
    fetchProducts();
  }, []);

  // ✅ FIX 3: Cải thiện thuật toán tìm kiếm + debug state
  useEffect(() => {
    console.log('🔄 Search effect triggered');
    console.log('📊 Current allProducts.length:', allProducts.length);
    console.log('🔍 Current searchQuery:', searchQuery);
    
    if (searchQuery.trim()) {
      setIsLoading(true);
      const timeoutId = setTimeout(() => {
        console.log('🔍 Searching for:', searchQuery);
        console.log('📦 Available products:', allProducts.length);
        
        if (allProducts.length === 0) {
          console.warn('⚠️ WARNING: allProducts is empty! API might not have loaded yet.');
        }
        
        const normalizedQuery = removeVietnameseTones(searchQuery);
        console.log('🔤 Normalized query:', normalizedQuery);
        
        const filtered = allProducts.filter(product => {
          const normalizedName = removeVietnameseTones(product.name);
          const normalizedBrand = removeVietnameseTones(product.brand);
          
          const matchName = normalizedName.includes(normalizedQuery);
          const matchBrand = normalizedBrand.includes(normalizedQuery);
          
          if (matchName || matchBrand) {
            console.log('✅ Match found:', product.name, '|', product.brand);
          }
          
          return matchName || matchBrand;
        }).slice(0, 8);
        
        console.log('📊 Filtered results:', filtered.length);
        console.log('📋 Filtered products:', filtered.map(p => p.name));
        setSuggestions(filtered);
        setIsLoading(false);
      }, 300);

      return () => clearTimeout(timeoutId);
    } else {
      setSuggestions([]);
      setIsLoading(false);
    }
  }, [searchQuery, allProducts]);

  // Đóng search khi click bên ngoài
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  // Focus vào input khi mở search
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleOpenSearch = () => {
    setIsOpen(true);
  };

  const handleCloseSearch = () => {
    setIsOpen(false);
    setSearchQuery("");
    setSuggestions([]);
  };

  const handleProductClick = (slug: string | undefined) => {
    if (slug) {
      router.push(`/products/${slug}`);
      handleCloseSearch();
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery)}`);
      handleCloseSearch();
    }
  };

  // ✅ Helper function để lấy URL ảnh đầy đủ
  const getImageUrl = (imgData: any): string => {
    if (!imgData) return '/placeholder-product.jpg';
    const url = typeof imgData === 'string' ? imgData : (imgData.url || '');
    if (!url || url.includes('[object')) return '/placeholder-product.jpg';
    if (url.startsWith('http') || url.startsWith('data:')) return url;
    const baseUrl = (process.env.NEXT_PUBLIC_API_URL || `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}`).replace('/api', '');
    return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { 
      style: 'currency', 
      currency: 'VND' 
    }).format(amount);
  };

  // ✅ FIX 4: Cải thiện highlight text
  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text;
    
    const normalizedText = removeVietnameseTones(text);
    const normalizedQuery = removeVietnameseTones(query);
    
    // Tìm vị trí match trong text đã normalize
    const index = normalizedText.indexOf(normalizedQuery);
    
    if (index === -1) return text;
    
    // Highlight phần text gốc (có dấu)
    const before = text.slice(0, index);
    const match = text.slice(index, index + query.length);
    const after = text.slice(index + query.length);
    
    return (
      <>
        {before}
        <mark className="bg-yellow-200 text-gray-900 font-semibold">
          {match}
        </mark>
        {after}
      </>
    );
  };

  return (
    <div ref={searchRef} className="relative">
      {/* Search Icon Button */}
      <button 
        onClick={handleOpenSearch}
        className="hover:bg-white/10 p-2 rounded-lg transition"
        aria-label="Tìm kiếm"
      >
        <Search size={20} />
      </button>

      {/* Expanded Search Bar - Mở rộng về bên TRÁI */}
      {isOpen && (
        <div className="absolute right-0 top-0 w-[280px] animate-expandWidth z-50">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSearchSubmit(e);
                }
              }}
              placeholder="Tìm sản phẩm..."
              className="w-full pl-10 pr-10 py-2 bg-white text-gray-900 rounded-lg border-2 border-white focus:border-blue-300 focus:outline-none shadow-lg"
            />
            <button
              type="button"
              onClick={handleCloseSearch}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded transition"
              aria-label="Đóng"
            >
              <X size={18} className="text-gray-500" />
            </button>
          </div>

          {/* Suggestions Dropdown */}
          {(searchQuery.trim() || isLoading) && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-2xl border border-gray-100 max-h-[400px] overflow-y-auto animate-fadeIn">
              {isProductsLoading ? (
                // API đang loading
                <div className="flex flex-col items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3"></div>
                  <p className="text-gray-600 text-sm">Đang tải sản phẩm...</p>
                </div>
              ) : apiError ? (
                // Có lỗi API
                <div className="text-center py-8 px-4">
                  <div className="text-4xl mb-2">⚠️</div>
                  <p className="text-red-600 text-sm font-medium mb-1">Lỗi tải dữ liệu</p>
                  <p className="text-gray-500 text-xs">{apiError}</p>
                </div>
              ) : isLoading ? (
                // Đang search
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : suggestions.length > 0 ? (
                <div className="py-2">
                  {suggestions.map((product) => (
                    <div
                      key={product.id}
                      onClick={() => handleProductClick(product.slug)}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer transition group"
                    >
                      {/* Product Image */}
                      <div className="w-16 h-16 flex-shrink-0 bg-gray-50 rounded-lg overflow-hidden border border-gray-100">
                        <img
                          src={getImageUrl(product.image)}
                          alt={product.name}
                          className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300"
                        />
                      </div>

                      {/* Product Info */}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm text-gray-900 font-medium mb-1 line-clamp-2">
                          {highlightText(product.name, searchQuery)}
                        </h4>
                        <div className="flex items-center gap-2">
                          <span className="text-red-600 font-bold text-sm">
                            {formatCurrency(product.price)}
                          </span>
                          {product.originalPrice > product.price && (
                            <span className="text-xs text-gray-400 line-through">
                              {formatCurrency(product.originalPrice)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Discount Badge */}
                      {product.originalPrice > product.price && (
                        <div className="flex-shrink-0">
                          <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                            -{Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%
                          </span>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* View All Button */}
                  {suggestions.length >= 8 && (
                    <div className="px-4 py-3 border-t border-gray-100">
                      <button
                        onClick={() => {
                          router.push(`/products?search=${encodeURIComponent(searchQuery)}`);
                          handleCloseSearch();
                        }}
                        className="w-full py-2 text-blue-600 hover:text-blue-700 font-medium text-sm transition"
                      >
                        Xem tất cả kết quả →
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 px-4">
                  <div className="text-4xl mb-2">🔍</div>
                  <p className="text-gray-600 text-sm">
                    Không tìm thấy "{searchQuery}"
                  </p>
                  <p className="text-gray-400 text-xs mt-2">
                    ({allProducts.length} sản phẩm trong database)
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes expandWidth {
          from { 
            width: 0;
            opacity: 0;
          }
          to { 
            width: 280px;
            opacity: 1;
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        
        .animate-expandWidth {
          animation: expandWidth 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

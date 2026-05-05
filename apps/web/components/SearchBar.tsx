"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, X, Loader2 } from "lucide-react";
import { CLEAN_API_URL } from '@lib/shared/constants';

const API_URL = CLEAN_API_URL;

interface Product {
  _id: string;
  id?: string;
  name: string;
  brand: string;
  price: number;
  originalPrice?: number;
  image: string;
  slug: string;
}

export const SearchBar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // ✅ SENIOR DEBOUNCE SEARCH: Gọi API tìm kiếm từ Backend
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSuggestions([]);
      setIsLoading(false);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsLoading(true);
      setApiError(null);
      try {
        const response = await fetch(`${API_URL}/api/products?search=${encodeURIComponent(searchQuery)}&limit=8`);
        if (response.ok) {
          const result = await response.json();
          // Backend trả về { success: true, data: [...] }
          setSuggestions(result.data || []);
        } else {
          setApiError("Lỗi tìm kiếm");
        }
      } catch (error) {
        console.error("Search API Error:", error);
        setApiError("Lỗi kết nối server");
      } finally {
        setIsLoading(false);
      }
    }, 400); // 400ms debounce

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

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

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleCloseSearch = () => {
    setIsOpen(false);
    setSearchQuery("");
    setSuggestions([]);
  };

  const handleProductClick = (slug: string) => {
    router.push(`/products/${slug}`);
    handleCloseSearch();
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery)}`);
      handleCloseSearch();
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { 
      style: 'currency', 
      currency: 'VND' 
    }).format(amount);
  };

  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text;
    const regex = new RegExp(`(${query})`, 'gi');
    const parts = text.split(regex);
    return (
      <>
        {parts.map((part, i) => 
          part.toLowerCase() === query.toLowerCase() 
            ? <mark key={i} className="bg-yellow-200 text-gray-900 rounded-sm">{part}</mark> 
            : part
        )}
      </>
    );
  };

  return (
    <div ref={searchRef} className="relative">
      <button 
        onClick={() => setIsOpen(true)}
        className="hover:bg-white/10 p-2 rounded-lg transition text-white"
        aria-label="Tìm kiếm"
      >
        <Search size={20} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-0 w-[320px] sm:w-[400px] z-50 animate-in fade-in slide-in-from-right-4 duration-300">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit(e)}
              placeholder="Bạn đang tìm gì?..."
              className="w-full pl-10 pr-10 py-3 bg-white text-gray-900 rounded-xl border-2 border-transparent focus:border-blue-500 shadow-2xl focus:outline-none transition-all"
            />
            {isLoading ? (
              <Loader2 className="absolute right-12 top-1/2 -translate-y-1/2 text-blue-500 animate-spin" size={18} />
            ) : searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-12 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full"
              >
                <X size={14} className="text-gray-400" />
              </button>
            )}
            <button
              onClick={handleCloseSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition"
            >
              <X size={18} className="text-gray-500" />
            </button>
          </div>

          {searchQuery.trim() && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 max-h-[480px] overflow-y-auto overflow-x-hidden">
              {isLoading && suggestions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10">
                  <Loader2 className="animate-spin text-blue-600 mb-2" size={24} />
                  <p className="text-sm text-gray-500">Đang tìm kiếm...</p>
                </div>
              ) : suggestions.length > 0 ? (
                <div className="py-2">
                  <div className="px-4 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-50 mb-1">
                    Sản phẩm gợi ý
                  </div>
                  {suggestions.map((product) => (
                    <div
                      key={product._id}
                      onClick={() => handleProductClick(product.slug)}
                      className="flex items-center gap-4 px-4 py-3 hover:bg-blue-50 cursor-pointer transition-all group border-b border-gray-50 last:border-0"
                    >
                      <div className="w-14 h-14 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden border border-gray-100">
                        <img
                          src={product.image.startsWith('http') ? product.image : `${API_URL}${product.image}`}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm text-gray-900 font-semibold truncate group-hover:text-blue-600 transition-colors">
                          {highlightText(product.name, searchQuery)}
                        </h4>
                        <p className="text-[11px] text-gray-500 uppercase font-bold tracking-tighter mb-1">{product.brand}</p>
                        <div className="flex items-center gap-2">
                          <span className="text-blue-600 font-black text-sm">
                            {formatCurrency(product.price)}
                          </span>
                          {product.originalPrice && product.originalPrice > product.price && (
                            <span className="text-[10px] text-gray-400 line-through">
                              {formatCurrency(product.originalPrice)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={handleSearchSubmit}
                    className="w-full py-4 text-center text-sm font-bold text-blue-600 hover:bg-blue-50 transition-colors border-t border-gray-100"
                  >
                    Xem tất cả kết quả cho "{searchQuery}"
                  </button>
                </div>
              ) : !isLoading && (
                <div className="text-center py-12 px-6">
                  <div className="text-4xl mb-4">🔍</div>
                  <p className="text-gray-900 font-bold">Không tìm thấy sản phẩm</p>
                  <p className="text-gray-500 text-xs mt-1">Hãy thử tìm kiếm với từ khóa khác</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};


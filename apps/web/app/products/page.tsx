"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Filter, ChevronLeft, ChevronRight, ArrowUpDown } from "lucide-react";

// --- TYPES - ĐỒNG BỘ VỚI BACKEND ---
interface ProductSpecs {
  screen?: string;
  chip?: string;
  ram?: string;
  storage?: string;
  camera?: string;
  battery?: string;
}

interface VariantOption {
  name: string;
  price: number;
  stock: number;
  sku: string;
  image: string;
}

interface Variant {
  name: string;
  options: VariantOption[];
}

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
  specs?: ProductSpecs;
  stock?: number;
  soldCount?: number;
  isNew?: boolean;
  hasPromotion?: boolean;
  variants?: Variant[];
}

interface Category {
  id?: string;
  _id?: string;
  name: string;
  slug: string;
  icon?: string;
  description?: string;
}

// --- API URL ---
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// --- CONSTANTS ---
const PRODUCTS_PER_PAGE = 9;

// --- SORT OPTIONS ---
type SortOption = 
  | 'default'
  | 'price-asc'
  | 'price-desc'
  | 'name-asc'
  | 'name-desc'
  | 'newest'
  | 'best-selling'
  | 'discount';

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'default', label: 'Mặc định' },
  { value: 'price-asc', label: 'Giá: Thấp đến cao' },
  { value: 'price-desc', label: 'Giá: Cao đến thấp' },
  { value: 'name-asc', label: 'Tên: A-Z' },
  { value: 'name-desc', label: 'Tên: Z-A' },
  { value: 'newest', label: 'Mới nhất' },
  { value: 'best-selling', label: 'Bán chạy nhất' },
  { value: 'discount', label: 'Giảm giá nhiều nhất' },
];

// --- PRODUCTS PAGE COMPONENT ---
export default function ProductsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>('default');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Lấy category từ URL
  const selectedCategory = searchParams.get('category') || 'all';

  // ✅ Helper: Lấy URL ảnh đầu tiên
  const getImageUrl = (product: Product): string => {
    if (product.images && Array.isArray(product.images) && product.images.length > 0) {
      return product.images[0];
    }
    if (product.image) {
      return product.image;
    }
    return '/placeholder-product.jpg'; // Fallback image
  };

  // ✅ Helper: Lấy giá thấp nhất từ variants (nếu có)
  const getLowestPrice = (product: Product): number => {
    if (!product.variants || product.variants.length === 0) {
      return product.price;
    }
    
    const variantPrices = product.variants.flatMap(v => 
      v.options.map(opt => opt.price)
    );
    
    return Math.min(product.price, ...variantPrices);
  };

  // ✅ Helper: Kiểm tra có variants không
  const hasVariants = (product: Product): boolean => {
    return !!(product.variants && product.variants.length > 0);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch products
        try {
          const productsResponse = await fetch(`${API_URL}/api/products`);
          if (productsResponse.ok) {
            const result = await productsResponse.json();
            console.log('Products API response:', result);
            
            const productsData = result.data || result;
            setProducts(Array.isArray(productsData) ? productsData : []);
          } else {
            console.error('Products API error:', productsResponse.status);
          }
        } catch (err) {
          console.error('Error fetching products:', err);
        }

        // Fetch categories
        try {
          const categoriesResponse = await fetch(`${API_URL}/api/categories`);
          if (categoriesResponse.ok) {
            const result = await categoriesResponse.json();
            console.log('Categories API response:', result);
            
            const categoriesData = result.data || result;
            setCategories(Array.isArray(categoriesData) ? categoriesData : []);
          } else {
            console.error('Categories API error:', categoriesResponse.status);
          }
        } catch (err) {
          console.error('Error fetching categories:', err);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Không thể tải dữ liệu. Vui lòng thử lại sau.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Reset về trang 1 khi thay đổi category hoặc sort
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, sortBy]);

  // Hàm thay đổi category bằng router
  const handleCategoryChange = (categorySlug: string) => {
    if (categorySlug === 'all') {
      router.push('/products');
    } else {
      router.push(`/products?category=${categorySlug}`);
    }
  };

  const filteredProducts = selectedCategory === 'all'
    ? products
    : products.filter(p => p.categorySlug === selectedCategory);

  // Sắp xếp sản phẩm
  const sortProducts = (products: Product[]): Product[] => {
    const sorted = [...products];
    
    switch (sortBy) {
      case 'price-asc':
        return sorted.sort((a, b) => getLowestPrice(a) - getLowestPrice(b));
      
      case 'price-desc':
        return sorted.sort((a, b) => getLowestPrice(b) - getLowestPrice(a));
      
      case 'name-asc':
        return sorted.sort((a, b) => a.name.localeCompare(b.name, 'vi'));
      
      case 'name-desc':
        return sorted.sort((a, b) => b.name.localeCompare(a.name, 'vi'));
      
      case 'newest':
        return sorted.sort((a, b) => {
          const idA = parseInt(a.id || a._id || '0');
          const idB = parseInt(b.id || b._id || '0');
          return idB - idA;
        });
      
      case 'best-selling':
        return sorted.sort((a, b) => (b.soldCount || 0) - (a.soldCount || 0));
      
      case 'discount':
        return sorted.sort((a, b) => {
          const discountA = a.originalPrice && a.originalPrice > a.price
            ? ((a.originalPrice - a.price) / a.originalPrice) * 100
            : 0;
          const discountB = b.originalPrice && b.originalPrice > b.price
            ? ((b.originalPrice - b.price) / b.originalPrice) * 100
            : 0;
          return discountB - discountA;
        });
      
      default:
        return sorted;
    }
  };

  const sortedProducts = sortProducts(filteredProducts);

  // Tính toán phân trang
  const totalPages = Math.ceil(sortedProducts.length / PRODUCTS_PER_PAGE);
  const startIndex = (currentPage - 1) * PRODUCTS_PER_PAGE;
  const endIndex = startIndex + PRODUCTS_PER_PAGE;
  const currentProducts = sortedProducts.slice(startIndex, endIndex);

  const handleProductClick = (product: Product) => {
    const slug = product.slug || product.id || product._id;
    if (slug) {
      router.push(`/products/${slug}`);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { 
      style: 'currency', 
      currency: 'VND' 
    }).format(amount);
  };

  const goToPage = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      goToPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      goToPage(currentPage + 1);
    }
  };

  // Tạo mảng số trang để hiển thị
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxPagesToShow = 5;
    
    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="h-10 bg-gray-200 rounded w-64 mb-4 animate-pulse"></div>
          <div className="h-6 bg-gray-200 rounded w-96 animate-pulse"></div>
        </div>
        <div className="flex gap-3 mb-8">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-10 bg-gray-200 rounded-full w-24 animate-pulse"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl shadow-md overflow-hidden animate-pulse">
              <div className="h-64 bg-gray-200"></div>
              <div className="p-4">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded mb-4"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">Tất cả sản phẩm</h1>
        <p className="text-gray-600 text-lg">Khám phá các sản phẩm công nghệ cao cấp</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-8">
          {error}
        </div>
      )}

      {/* Category Filter */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Filter size={20} className="text-gray-600" />
          <h3 className="font-semibold text-lg">Lọc theo danh mục:</h3>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => handleCategoryChange('all')}
            className={`px-6 py-2 rounded-full font-medium transition-all ${
              selectedCategory === 'all'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Tất cả ({products.length})
          </button>
          {categories.map(cat => {
            const count = products.filter(p => p.categorySlug === cat.slug).length;
            return (
              <button
                key={cat.id || cat._id}
                onClick={() => handleCategoryChange(cat.slug)}
                className={`px-6 py-2 rounded-full font-medium transition-all ${
                  selectedCategory === cat.slug
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {cat.icon && <span className="mr-2">{cat.icon}</span>}
                {cat.name} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Sort Options */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <ArrowUpDown size={20} className="text-gray-600" />
          <h3 className="font-semibold text-lg">Sắp xếp theo:</h3>
        </div>
      </div>

      {/* Products Count */}
      <div className="mb-6">
        <p className="text-gray-600">
          Hiển thị <span className="font-semibold">{startIndex + 1}-{Math.min(endIndex, sortedProducts.length)}</span> trong số <span className="font-semibold">{sortedProducts.length}</span> sản phẩm
          {(selectedCategory !== 'all' || sortBy !== 'default') && (
            <button
              onClick={() => {
                handleCategoryChange('all');
                setSortBy('default');
              }}
              className="ml-2 text-blue-600 hover:underline"
            >
              (Xóa tất cả bộ lọc)
            </button>
          )}
        </p>
      </div>

      {/* Products Grid with Sidebar */}
      {currentProducts.length > 0 ? (
        <div className="flex gap-6">
          {/* Sort Sidebar */}
          <div className="w-64 flex-shrink-0">
            <div className="sticky top-4 flex flex-col gap-3">
              {SORT_OPTIONS.map(option => (
                <button
                  key={option.value}
                  onClick={() => setSortBy(option.value)}
                  className={`px-6 py-2 rounded-full font-medium transition-all text-left ${
                    sortBy === option.value
                      ? 'bg-green-600 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Products Grid */}
          <div className="flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {currentProducts.map(product => {
                const productId = product.id || product._id || '';
                const lowestPrice = getLowestPrice(product);
                const hasDiscount = product.originalPrice && product.originalPrice > lowestPrice;
                
                return (
                  <div 
                    key={productId}
                    onClick={() => handleProductClick(product)}
                    className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group flex flex-col"
                  >
                    {/* Product Image */}
                    <div className="relative h-64 overflow-hidden bg-gray-50 p-6 flex items-center justify-center">
                      <img 
                        
                        src={product.image} 
                        alt={product.name} 
                        className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500"
                        onError={(e: any) => {
                          e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI2YzZjRmNiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iNjQiIGZpbGw9IiNkMWQ1ZGIiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj7wn5O3PC90ZXh0Pjwvc3ZnPg==';
                        }}
                      />
                      
                      {/* Badges */}
                      <div className="absolute top-3 right-3 flex flex-col gap-2">
                        {/* Discount Badge */}
                        {hasDiscount && (
                          <span className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                            -{Math.round(((product.originalPrice! - lowestPrice) / product.originalPrice!) * 100)}%
                          </span>
                        )}
                        {/* New Badge */}
                        {product.isNew && (
                          <span className="bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                           Mới
                          </span>
                        )}
                        {/* Promotion Badge */}
                        {product.hasPromotion && (
                          <span className="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                           KM
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Product Info */}
                    <div className="p-5 flex flex-col flex-1">
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded-md uppercase tracking-wider">
                          {product.brand || 'N/A'}
                        </span>
                        {/* {hasVariants(product) && (
                          <span className="text-xs font-medium text-purple-600 bg-purple-50 px-2 py-1 rounded-md">
                            🎨 Nhiều lựa chọn
                          </span>
                        )} */}
                      </div>
                      
                      <h3 className="font-bold text-gray-900 mb-3 line-clamp-2 text-lg group-hover:text-blue-600 transition-colors flex-1">
                        {product.name}
                      </h3>
                      
                      {/* Price */}
                      <div className="flex items-baseline gap-2 mt-auto">
                        {hasVariants(product) && lowestPrice < product.price ? (
                          <>
                            <span className="text-sm text-gray-500">Từ</span>
                            <span className="text-xl font-bold text-red-600">
                              {formatCurrency(lowestPrice)}
                            </span>
                          </>
                        ) : (
                          <span className="text-xl font-bold text-red-600">
                            {formatCurrency(product.price)}
                          </span>
                        )}
                        {hasDiscount && (
                          <span className="text-sm text-gray-400 line-through hidden sm:inline-block">
                            {formatCurrency(product.originalPrice!)}
                          </span>
                        )}
                      </div>

                      {/* Variants Preview */}
                      {hasVariants(product) && (
                        <div className="mt-2 flex items-center gap-1 text-xs text-gray-500">
                          {product.variants!.slice(0, 2).map((variant, idx) => (
                            <span key={idx} className="bg-gray-100 px-2 py-1 rounded">
                              {variant.options.length} {variant.name}
                            </span>
                          ))}
                          {product.variants!.length > 2 && (
                            <span className="text-gray-400">+{product.variants!.length - 2}</span>
                          )}
                        </div>
                      )}

                      {/* Stock & Rating */}
                      <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                        <span>
                          {product.stock && product.stock > 0 ? (
                            <span className="text-green-600">✓ Còn hàng</span>
                          ) : (
                            <span className="text-red-600">✗ Hết hàng</span>
                          )}
                        </span>
                        {product.rating && (
                          <span className="flex items-center gap-1">
                            ⭐ {product.rating.toFixed(1)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-8">
                {/* Previous Button */}
                <button
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1}
                  className={`p-2 rounded-lg border transition-all ${
                    currentPage === 1
                      ? 'border-gray-200 text-gray-300 cursor-not-allowed'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <ChevronLeft size={20} />
                </button>

                {/* Page Numbers */}
                {getPageNumbers().map((page, index) => (
                  page === '...' ? (
                    <span key={`ellipsis-${index}`} className="px-3 py-2 text-gray-400">
                      ...
                    </span>
                  ) : (
                    <button
                      key={page}
                      onClick={() => goToPage(page as number)}
                      className={`px-4 py-2 rounded-lg font-medium transition-all ${
                        currentPage === page
                          ? 'bg-blue-600 text-white shadow-lg'
                          : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  )
                ))}

                {/* Next Button */}
                <button
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  className={`p-2 rounded-lg border transition-all ${
                    currentPage === totalPages
                      ? 'border-gray-200 text-gray-300 cursor-not-allowed'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center py-16 bg-gray-50 rounded-xl">
          <div className="text-6xl mb-4">🔍</div>
          <p className="text-gray-500 text-lg mb-2">Không tìm thấy sản phẩm nào</p>
          <p className="text-gray-400 mb-4">Thử chọn danh mục khác hoặc xóa bộ lọc</p>
          {selectedCategory !== 'all' && (
            <button
              onClick={() => handleCategoryChange('all')}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
            >
              Xem tất cả sản phẩm
            </button>
          )}
        </div>
      )}
    </div>
  );
}
"use client";
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface Product {
  id: number;
  name: string;
  brand: string;
  price: number;
  originalPrice: number;
  rating: number;
  image: string;
  description: string;
  categorySlug?: string;
}

interface Category {
  id: number;
  name: string;
  slug: string;
  icon: string;
  description: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function CategoryPage() {
  const params = useParams();
  const router = useRouter();
  const categorySlug = params.slug as string;
  
  const [products, setProducts] = useState<Product[]>([]);
  const [category, setCategory] = useState<Category | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategoryAndProducts = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // 1. Lấy thông tin category theo slug
        const categoryRes = await fetch(`${API_URL}/api/categories/${categorySlug}`);
        if (!categoryRes.ok) {
          throw new Error('Không tìm thấy danh mục');
        }
        const categoryData = await categoryRes.json();
        setCategory(categoryData);
        
        // 2. Lấy sản phẩm theo categorySlug
        const productsRes = await fetch(`${API_URL}/api/products?category=${categorySlug}`);
        if (!productsRes.ok) {
          throw new Error('Không thể kết nối đến server');
        }
        
        const productsData = await productsRes.json();
        // Handle response format { success: true, data: [...] }
        const actualData = productsData.data || productsData;
        setProducts(Array.isArray(actualData) ? actualData : []);
        
      } catch (err) {
        console.error(`Lỗi khi lấy danh sách sản phẩm:`, err);
        setError(err instanceof Error ? err.message : 'Không thể tải danh sách sản phẩm. Vui lòng thử lại sau.');
      } finally {
        setIsLoading(false);
      }
    };

    if (categorySlug) {
      fetchCategoryAndProducts();
    }
  }, [categorySlug]);

  const handleProductClick = (product: Product) => {
    router.push(`/products/${product.id}`);
  };

  // Hàm định dạng tiền tệ VNĐ
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  // Giao diện Loading Skeleton
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="h-10 bg-gray-200 rounded w-64 mb-8 animate-pulse"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl shadow-sm overflow-hidden animate-pulse border border-gray-100">
              <div className="h-64 bg-gray-200"></div>
              <div className="p-5 space-y-3">
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                <div className="h-6 bg-gray-200 rounded w-1/2 mt-4"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Giao diện báo lỗi
  if (error) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="bg-red-50 text-red-600 p-6 rounded-xl inline-block max-w-md">
          <svg className="w-12 h-12 mx-auto mb-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="font-semibold text-lg mb-2">Có lỗi xảy ra</p>
          <p>{error}</p>
          <button 
            onClick={() => router.push('/')}
            className="mt-4 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            Về trang chủ
          </button>
        </div>
      </div>
    );
  }

  // Giao diện chính
  return (
    <div className="container mx-auto px-4 py-8 min-h-screen">
      {/* Category Header */}
      {category && (
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 flex items-center gap-3 mb-2">
            <span className="text-4xl">{category.icon}</span>
            {category.name}
          </h1>
          <p className="text-gray-600 text-lg">{category.description}</p>
          <div className="mt-4 text-sm text-gray-500">
            Tìm thấy <span className="font-semibold text-gray-700">{products.length}</span> sản phẩm
          </div>
        </div>
      )}
      
      {products.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 xl:gap-8">
          {products.map(product => (
            <div 
              key={product.id} 
              onClick={() => handleProductClick(product)}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group flex flex-col"
            >
              {/* Product Image Container */}
              <div className="relative h-64 overflow-hidden bg-gray-50 p-6 flex items-center justify-center">
                <img 
                  src={product.image} 
                  alt={product.name} 
                  className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500 will-change-transform"
                />
                {/* Discount Badge */}
                {product.originalPrice > product.price && (
                  <span className="absolute top-3 right-3 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                    -{Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%
                  </span>
                )}
              </div>

              {/* Product Info */}
              <div className="p-5 flex flex-col flex-1">
                <div className="mb-1">
                  <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded-md uppercase tracking-wider">
                    {product.brand}
                  </span>
                </div>
                <h3 className="font-bold text-gray-900 mb-3 line-clamp-2 text-lg group-hover:text-blue-600 transition-colors flex-1">
                  {product.name}
                </h3>
                <div className="flex items-baseline gap-2 mt-auto">
                  <span className="text-xl font-bold text-red-600">
                    {formatCurrency(product.price)}
                  </span>
                  {product.originalPrice > product.price && (
                    <span className="text-sm text-gray-400 line-through hidden sm:inline-block">
                      {formatCurrency(product.originalPrice)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-gray-50 rounded-3xl">
          <svg className="w-20 h-20 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
          <p className="text-gray-500 text-xl font-medium">Chưa có sản phẩm nào trong danh mục này</p>
          <button 
            onClick={() => router.push('/')}
            className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Khám phá sản phẩm khác
          </button>
        </div>
      )}
    </div>
  );
}
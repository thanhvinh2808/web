"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRight, Box, Star, Phone } from 'lucide-react';
import HeroCarousel from '../components/HeroCarousel';

interface Category {
  _id: string;
  name: string;
  slug: string;
  icon: string;
  description?: string;
}

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
  slug?: string;
  soldCount?: number;
  isNew?: boolean;
  hasPromotion?: boolean;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function HomePage() {
  const router = useRouter();
  
  // State cho categories
  const [categories, setCategories] = useState<Category[]>([]);
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(true);
  
  // State cho products
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [isProductsLoading, setIsProductsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('new');
  
  // State cho "Xem Thêm" - Bắt đầu với 8 sản phẩm
  const [visibleCount, setVisibleCount] = useState(8);

  // ✅ Fetch categories từ MongoDB
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setIsCategoriesLoading(true);
      const response = await fetch(`${API_URL}/api/categories`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }
      
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
      // Fallback: categories mặc định
      setCategories([
        { _id: '1', name: 'Điện thoại', slug: 'smartphones', icon: '📱', description: 'iPhone, Samsung, Xiaomi...' },
        { _id: '2', name: 'Laptop', slug: 'laptops', icon: '💻', description: 'MacBook, Dell, HP...' },
        { _id: '3', name: 'Máy tính bảng', slug: 'tablets', icon: '📲', description: 'iPad, Galaxy Tab...' },
        { _id: '4', name: 'Âm thanh', slug: 'audio', icon: '🎧', description: 'Tai nghe, Loa...' },
        { _id: '5', name: 'Đồng hồ', slug: 'wearables', icon: '⌚', description: 'Apple Watch, Galaxy Watch...' },
        { _id: '6', name: 'Camera', slug: 'cameras', icon: '📷', description: 'Canon, Sony, Nikon...' },
        { _id: '7', name: 'Gaming', slug: 'gaming', icon: '🎮', description: 'PS5, Xbox, Nintendo...' },
        { _id: '8', name: 'Phụ kiện', slug: 'accessories', icon: '⚡', description: 'Sạc, Cáp, Ốp lưng...' },
      ]);
    } finally {
      setIsCategoriesLoading(false);
    }
  };

  // ✅ Fetch products - SỬA LẠI ĐÂY
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsProductsLoading(true);
        const res = await fetch(`${API_URL}/api/products`);
        const responseData = await res.json();
        
        console.log('📦 API Response:', responseData);
        
        // ✅ SỬA: API trả về { success: true, data: [...] }
        if (responseData.success && responseData.data) {
          const products = responseData.data;
          console.log('✅ Total products loaded:', products.length);
          setAllProducts(products);
          setFeaturedProducts(products);
        } else {
          console.error('❌ Invalid API response format');
          setAllProducts([]);
          setFeaturedProducts([]);
        }
      } catch (error) {
        console.error('❌ Error fetching products:', error);
        setAllProducts([]);
        setFeaturedProducts([]);
      } finally {
        setIsProductsLoading(false);
      }
    };
    fetchData();
  }, []);

  // Lọc sản phẩm theo filter
  useEffect(() => {
    let filtered = [...allProducts];
    
    console.log('🔍 Filtering:', activeFilter, 'Total products:', allProducts.length);
    
    switch(activeFilter) {
      case 'bestseller':
        filtered = filtered
          .filter(p => p.soldCount && p.soldCount > 0)
          .sort((a, b) => (b.soldCount || 0) - (a.soldCount || 0));
        console.log('📊 Bestseller filtered:', filtered.length);
        break;
      case 'promotion':
        filtered = filtered.filter(p => p.originalPrice > p.price || p.hasPromotion);
        console.log('🎁 Promotion filtered:', filtered.length);
        break;
      case 'new':
        const newProducts = filtered.filter(p => p.isNew);
        if (newProducts.length > 0) {
          filtered = newProducts;
        } else {
          // Fallback: sắp xếp theo ID giảm dần (sản phẩm mới nhất)
          filtered = filtered.sort((a, b) => b.id - a.id);
        }
        console.log('✨ New filtered:', filtered.length);
        break;
      case 'all':
      default:
        console.log('📋 All products:', filtered.length);
        break;
    }
    
    setFeaturedProducts(filtered);
    setVisibleCount(8); // ✅ SỬA: Reset về 8 sản phẩm khi đổi filter
  }, [activeFilter, allProducts]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { 
      style: 'currency', 
      currency: 'VND' 
    }).format(amount);
  };

  // Sản phẩm hiển thị
  const displayProducts = featuredProducts.slice(0, visibleCount);
  const hasMoreProducts = visibleCount < featuredProducts.length;

  // ✅ Xử lý "Xem Thêm" - Load thêm 12 sản phẩm
  const handleLoadMore = () => {
    setVisibleCount(prev => Math.min(prev + 12, featuredProducts.length));
  };

  if (isProductsLoading) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="animate-pulse space-y-8">
          <div className="h-12 bg-gray-200 rounded w-1/2"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-200 h-80 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Hero Section - Full Width */}
      <HeroCarousel/>

      {/* Banner Section - Contained */}
      <section className="bg-white">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-8 text-white relative overflow-hidden">
              <div className="relative z-10">
                <h3 className="text-3xl font-bold mb-2">Giảm giá 50%</h3>
                <p className="text-lg mb-4">Cho tất cả iPhone 15 Series</p>
                <button 
                  onClick={() => router.push('/products/iphone-15-pro-max-256gb')}
                  className="bg-white text-purple-600 px-6 py-2 rounded-lg font-semibold hover:shadow-lg transition"
                >
                  Mua ngay
                </button>
              </div>
              <div className="absolute right-0 top-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
            </div>
            <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl p-8 text-white relative overflow-hidden">
              <div className="relative z-10">
                <h3 className="text-3xl font-bold mb-2">MacBook M3 Pro</h3>
                <p className="text-lg mb-4">Trả góp 0% - Quà tặng 10 triệu</p>
                <button 
                  onClick={() => router.push('/products/macbook-pro-14-m3-pro-18gb-512gb')}
                  className="bg-white text-blue-600 px-6 py-2 rounded-lg font-semibold hover:shadow-lg transition"
                >
                  Xem ngay
                </button>
              </div>
              <div className="absolute right-0 bottom-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mb-32"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="bg-white py-16">
        <div className="container mx-auto px-4 max-w-7xl">
          <h2 className="text-3xl font-bold mb-8 text-center">Danh mục sản phẩm</h2>
          
          {isCategoriesLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={`cat-skeleton-${i}`} className="bg-gray-200 h-40 rounded-xl animate-pulse"></div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {categories.length > 0 ? (
                categories.map((cat) => (
                  <div
                    key={cat._id}
                    onClick={() => router.push(`/products?category=${cat.slug}`)}
                    className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition-all text-center cursor-pointer group"
                  >
                    <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">
                      {cat.icon || '📦'}
                    </div>
                    <h3 className="font-semibold text-gray-800 mb-2">{cat.name}</h3>
                    {cat.description && (
                      <p className="text-sm text-gray-500">{cat.description}</p>
                    )}
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center text-gray-500 py-12">
                  Không có danh mục nào
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="bg-gray-50 py-16">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <h2 className="text-3xl font-bold">Sản Phẩm Dành Cho Bạn</h2>
            <div className="flex items-center gap-4 w-full md:w-auto">
              <div className="flex gap-2 flex-wrap flex-1 md:flex-initial">
                <button 
                  onClick={() => setActiveFilter('all')}
                  className={`px-4 py-2 rounded-lg transition ${
                    activeFilter === 'all' 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-white text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Tất Cả
                </button>
                <button 
                  onClick={() => setActiveFilter('bestseller')}
                  className={`px-4 py-2 rounded-lg transition ${
                    activeFilter === 'bestseller' 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-white text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Bán Chạy
                </button>
                <button 
                  onClick={() => setActiveFilter('promotion')}
                  className={`px-4 py-2 rounded-lg transition ${
                    activeFilter === 'promotion' 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-white text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Khuyến Mãi
                </button>
                <button 
                  onClick={() => setActiveFilter('new')}
                  className={`px-4 py-2 rounded-lg transition ${
                    activeFilter === 'new' 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-white text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Sản Phẩm Mới
                </button>
              </div>
              <button
                onClick={() => router.push('/products')}
                className="text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1 transition hover:gap-2 whitespace-nowrap"
              >
                Xem tất cả <ChevronRight size={20} />
              </button>
            </div>
          </div>

          {/* Debug Info - Xóa sau khi test xong */}
          {/* <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6 text-sm">
            <span className="font-semibold">Debug:</span> Tổng {allProducts.length} sản phẩm | 
            Lọc: {featuredProducts.length} | 
            Hiển thị: {displayProducts.length} | 
            Filter: {activeFilter}
          </div> */}

          {displayProducts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">
                {allProducts.length === 0 
                  ? '⚠️ Chưa có sản phẩm nào trong database' 
                  : '🔍 Không có sản phẩm nào phù hợp với bộ lọc này'
                }
              </p>
              {allProducts.length === 0 && (
                <p className="text-gray-400 text-sm mt-2">
                  Hãy thêm sản phẩm qua Admin Dashboard
                </p>
              )}
            </div>
          ) : (
            <>
              {/* Grid hiển thị sản phẩm */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {displayProducts.map(product => (
                  <div 
                    key={product._id || product.id}
                    onClick={() => router.push(`/products/${product.slug}`)}
                    className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition cursor-pointer group h-full"
                  >
                    <div className="relative h-64 overflow-hidden bg-gray-50 p-6">
                      <img 
                        src={product.image} 
                        alt={product.name}
                        className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500"
                      />
                      {product.originalPrice > product.price && (
                        <span className="absolute top-3 right-3 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                          {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%
                        </span>
                      )}
                      
                      {product.soldCount && activeFilter === 'bestseller' && (
                        <span className="absolute top-3 left-3 bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                          Đã bán {product.soldCount}
                        </span>
                      )}
                      {product.isNew && activeFilter === 'new' && (
                        <span className="absolute top-3 left-3 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                          Mới
                        </span>
                      )}
                    </div>
                    <div className="p-5">
                      <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded-md uppercase">
                        {product.brand}
                      </span>
                      <h3 className="font-bold text-gray-900 mt-2 mb-3 line-clamp-2 min-h-[3rem]">
                        {product.name}
                      </h3>
                      <div className="flex items-baseline gap-2">
                        <span className="text-xl font-bold text-red-600">
                          {formatCurrency(product.price)}
                        </span>
                        {product.originalPrice > product.price && (
                          <span className="text-sm text-gray-400 line-through">
                            {formatCurrency(product.originalPrice)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Nút "Xem Thêm" - Chỉ hiện khi còn sản phẩm */}
              {hasMoreProducts && (
                <div className="flex justify-center mt-8">
                  <button
                    onClick={handleLoadMore}
                    className="bg-blue-500 text-white px-10 py-3 rounded-lg font-semibold hover:bg-blue-600 transition shadow-md flex items-center gap-2"
                  >
                    Xem Thêm ({featuredProducts.length - visibleCount} sản phẩm)
                    <ChevronRight size={20} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Voucher Section */}
      <section className="bg-white py-16">
        <div className="container mx-auto px-4 max-w-7xl">
          <h2 className="text-3xl font-bold text-center mb-12">Ưu đãi đặc biệt</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-red-500 to-pink-500 rounded-xl p-6 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
              <div className="relative z-10">
                <div className="text-4xl font-bold mb-2">500K</div>
                <div className="text-sm mb-4">Giảm giá cho đơn hàng từ 10 triệu</div>
                <div className="text-xs bg-white/20 inline-block px-3 py-1 rounded">
                  Mã: TECH500K
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl p-6 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
              <div className="relative z-10">
                <div className="text-4xl font-bold mb-2">300K</div>
                <div className="text-sm mb-4">Giảm giá cho đơn hàng từ 5 triệu</div>
                <div className="text-xs bg-white/20 inline-block px-3 py-1 rounded">
                  Mã: TECH300K
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-green-500 to-teal-500 rounded-xl p-6 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
              <div className="relative z-10">
                <div className="text-4xl font-bold mb-2">100K</div>
                <div className="text-sm mb-4">Giảm giá cho đơn hàng từ 2 triệu</div>
                <div className="text-xs bg-white/20 inline-block px-3 py-1 rounded">
                  Mã: TECH100K
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Blog Section */}
      <section className="bg-gray-50 py-16">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="flex justify-between items-center mb-12">
            <h2 className="text-3xl font-bold">Tin tức công nghệ</h2>
            <button
              onClick={() => router.push('/blog')}
              className="text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1 transition hover:gap-2"
            >
              Xem tất cả <ChevronRight size={20} />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div 
              className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition cursor-pointer"
              onClick={() => router.push('/blog')}
            >
              <div className="h-48 bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                <span className="text-white text-6xl">📱</span>
              </div>
              <div className="p-6">
                <div className="text-sm text-gray-500 mb-2">15/11/2024</div>
                <h3 className="font-bold text-lg mb-2">iPhone 16 Pro Max - Đánh giá chi tiết</h3>
                <p className="text-gray-600 text-sm">
                  Khám phá những tính năng đột phá của iPhone 16 Pro Max với chip A18 Pro và camera 48MP...
                </p>
              </div>
            </div>
            <div 
              className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition cursor-pointer"
              onClick={() => router.push('/blog')}
            >
              <div className="h-48 bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center">
                <span className="text-white text-6xl">💻</span>
              </div>
              <div className="p-6">
                <div className="text-sm text-gray-500 mb-2">12/11/2024</div>
                <h3 className="font-bold text-lg mb-2">MacBook M3 Pro - Sức mạnh vượt trội</h3>
                <p className="text-gray-600 text-sm">
                  So sánh hiệu năng giữa MacBook M3 Pro và các dòng máy cũ, liệu có đáng để nâng cấp...
                </p>
              </div>
            </div>
            <div 
              className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition cursor-pointer"
              onClick={() => router.push('/blog')}
            >
              <div className="h-48 bg-gradient-to-br from-pink-400 to-pink-600 flex items-center justify-center">
                <span className="text-white text-6xl">⭐</span>
              </div>
              <div className="p-6">
                <div className="text-sm text-gray-500 mb-2">10/11/2024</div>
                <h3 className="font-bold text-lg mb-2">Top 5 smartphone tốt nhất 2024</h3>
                <p className="text-gray-600 text-sm">
                  Tổng hợp những chiếc điện thoại đáng mua nhất trong năm với tính năng vượt trội...
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white py-16">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-8 bg-blue-50 rounded-xl">
              <div className="bg-blue-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Box className="text-white" size={32} />
              </div>
              <h3 className="font-bold text-xl mb-2">Giao hàng miễn phí</h3>
              <p className="text-gray-600">Miễn phí vận chuyển cho đơn hàng trên 1 triệu</p>
            </div>
            <div className="text-center p-8 bg-purple-50 rounded-xl">
              <div className="bg-purple-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="text-white" size={32} />
              </div>
              <h3 className="font-bold text-xl mb-2">Bảo hành chính hãng</h3>
              <p className="text-gray-600">Bảo hành 12-24 tháng cho mọi sản phẩm</p>
            </div>
            <div className="text-center p-8 bg-pink-50 rounded-xl">
              <div className="bg-pink-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Phone className="text-white" size={32} />
              </div>
              <h3 className="font-bold text-xl mb-2">Hỗ trợ 24/7</h3>
              <p className="text-gray-600">Đội ngũ tư vấn nhiệt tình, chuyên nghiệp</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
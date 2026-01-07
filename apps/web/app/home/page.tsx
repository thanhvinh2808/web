"use client";
import { useState, useEffect } from "react";
import { ChevronRight, Box, Star, Phone } from "lucide-react";
import { ProductCard } from "../../components/ProductCard";

// --- TYPES ---
type PageType = 
  | 'home' 
  | 'products' 
  | 'product-detail' 
  | 'cart' 
  | 'about' 
  | 'contact' 
  | 'blog' 
  | 'blog-detail' 
  | 'faq' 
  | 'login' 
  | 'register';

interface Product {
  id: number;
  name: string;
  brand: string;
  price: number;
  originalPrice: number;
  rating: number;
  image: string;
  description: string;
  category?: string;
}

interface Category {
  id: number;
  name: string;
  description: string;
  icon: string;
}

interface HomeData {
  title?: string;
  subtitle?: string;
  featured?: Product[];
}

interface HomePageProps {
  setCurrentPage: (page: PageType) => void;
  setSelectedProduct: (product: Product) => void;
  addToCart: (product: Product) => void;
}

// --- API URL ---
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// --- HOME PAGE COMPONENT ---
export const HomePage = ({ setCurrentPage, setSelectedProduct, addToCart }: HomePageProps) => {
  const [homeData, setHomeData] = useState<HomeData>({
    title: 'Chào mừng đến TechStore',
    subtitle: 'Cửa hàng công nghệ hàng đầu',
    featured: []
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Fetch home data
        try {
          const homeResponse = await fetch(`${API_URL}/home`);
          if (homeResponse.ok) {
            const homeDataResult = await homeResponse.json();
            setHomeData({
              title: homeDataResult.title || 'Chào mừng đến TechStore',
              subtitle: homeDataResult.subtitle || 'Cửa hàng công nghệ hàng đầu',
              featured: Array.isArray(homeDataResult.featured) ? homeDataResult.featured : []
            });
          }
        } catch (err) {
          console.error('Error fetching home data:', err);
        }

        // Fetch categories
        try {
          const categoriesResponse = await fetch(`${API_URL}/categories`);
          if (categoriesResponse.ok) {
            const categoriesResult = await categoriesResponse.json();
            setCategories(Array.isArray(categoriesResult) ? categoriesResult : []);
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

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 animate-fade-in">
              {homeData.title}
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100">
              {homeData.subtitle}
            </p>
            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => setCurrentPage('products')}
                className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold hover:shadow-2xl transform hover:-translate-y-1 transition-all"
              >
                Khám phá ngay
              </button>
              <button
                onClick={() => setCurrentPage('about')}
                className="bg-white/10 backdrop-blur-sm border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white/20 transition"
              >
                Tìm hiểu thêm
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Error Message */}
      {error && (
        <div className="container mx-auto px-4 py-4">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        </div>
      )}

      {/* Categories Section */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Danh mục sản phẩm</h2>
        {isLoading ? (
          <div className="text-center text-gray-500">Đang tải...</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {categories.length > 0 ? (
              categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setCurrentPage('products')}
                  className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition-all text-center group"
                >
                  <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">
                    {cat.icon}
                  </div>
                  <h3 className="font-semibold text-gray-800 mb-2">{cat.name}</h3>
                  <p className="text-sm text-gray-500">{cat.description}</p>
                </button>
              ))
            ) : (
              <div className="col-span-full text-center text-gray-500">
                Không có danh mục nào
              </div>
            )}
          </div>
        )}
      </section>

      {/* Featured Products Section */}
      <section className="bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-12">
            <h2 className="text-3xl font-bold">Sản phẩm nổi bật</h2>
            <button
              onClick={() => setCurrentPage('products')}
              className="text-blue-600 hover:text-blue-700 font-semibold flex items-center"
            >
              Xem tất cả <ChevronRight size={20} />
            </button>
          </div>
          {isLoading ? (
            <div className="text-center text-gray-500">Đang tải sản phẩm...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {homeData.featured && homeData.featured.length > 0 ? (
                homeData.featured.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    setCurrentPage={setCurrentPage}
                    setSelectedProduct={setSelectedProduct}
                    addToCart={addToCart}
                  />
                ))
              ) : (
                <div className="col-span-full text-center text-gray-500">
                  Không có sản phẩm nổi bật
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
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
      </section>
    </div>
  );
};
export default HomePage;

// app/products/[slug]/page.tsx
"use client";
import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Star, Heart, ShoppingCart, ChevronLeft, Truck, Shield, RefreshCw, Package, ChevronRight } from "lucide-react";
import { useCart } from "../../contexts/CartContext";

interface VariantOption {
  name: string;
  price: number; // Giá tuyệt đối cho option này
  stock: number;
  sku: string;
  image: string;
}

interface Variant {
  name: string;
  options: VariantOption[];
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
  category?: string;
  specs?: Record<string, string>;
  stock?: number;
  slug?: string;
  categorySlug?: string;
  variants?: Variant[];
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function ProductDetailPage({ params }: { params: { slug: string } }) {
  const { slug } = params;

  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isFlying, setIsFlying] = useState(false);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});

  const router = useRouter();
  const { addToCart } = useCart();

  useEffect(() => {
    if (!slug) return;

    const fetchProduct = async () => {
      try {
        setIsLoading(true);
        const res = await fetch(`${API_URL}/api/products/${slug}`);
        if (!res.ok) {
          throw new Error('Không tìm thấy sản phẩm');
        }
        const data = await res.json();
        setProduct(data);
      } catch (err: any) {
        setError(err.message || 'Đã xảy ra lỗi');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProduct();
  }, [slug]);

  useEffect(() => {
    if (!product) return;

    const fetchRelatedProducts = async () => {
      try {
        let sameCategoryProducts: Product[] = [];
        let allProducts: Product[] = [];
        
        const allUrl = `${API_URL}/api/products`;
        
        try {
          const res = await fetch(allUrl);
          
          if (res.ok) {
            const responseData = await res.json();
            
            if (Array.isArray(responseData)) {
              allProducts = responseData;
            } else if (responseData.products && Array.isArray(responseData.products)) {
              allProducts = responseData.products;
            } else if (responseData.data && Array.isArray(responseData.data)) {
              allProducts = responseData.data;
            }
          }
        } catch (err) {
          console.error('All products fetch error:', err);
        }
        
        if (product.categorySlug && allProducts.length > 0) {
          sameCategoryProducts = allProducts.filter((p: Product) => {
            const isSameCategory = p.categorySlug === product.categorySlug;
            const isDifferentId = p.slug !== product.slug;
            const isDifferentSlug = !product.slug || !p.slug || p.slug !== product.slug;
            return isSameCategory && isDifferentId && isDifferentSlug;
          });
        }
        
        let finalProducts: Product[] = [];
        
        if (sameCategoryProducts.length >= 5) {
          finalProducts = sameCategoryProducts.slice(0, 5);
        } else if (sameCategoryProducts.length > 0) {
          finalProducts = [...sameCategoryProducts];
          
          const otherCategoryProducts = allProducts.filter((p: Product) => {
            const isDifferentCategory = p.category !== product.categorySlug;
            const isDifferentId = p.slug !== product.slug;
            const isDifferentSlug = !product.slug || !p.slug || p.slug !== product.slug;
            return isDifferentCategory && isDifferentId && isDifferentSlug;
          });
          
          const needed = 5 - sameCategoryProducts.length;
          finalProducts = [...finalProducts, ...otherCategoryProducts.slice(0, needed)];
        } else {
          finalProducts = allProducts.filter((p: Product) => {
            const isDifferentId = p.slug !== product.slug;
            const isDifferentSlug = !product.slug || !p.slug || p.slug !== product.slug;
            return isDifferentId && isDifferentSlug;
          }).slice(0, 5);
        }
        
        setRelatedProducts(finalProducts);
      } catch (err) {
        console.error('Error in fetchRelatedProducts:', err);
        setRelatedProducts([]);
      }
    };

    const timer = setTimeout(() => {
      fetchRelatedProducts();
    }, 300);

    return () => clearTimeout(timer);
  }, [product]);

  // ✅ LẤY TẤT CẢ VARIANT OPTIONS ĐÃ CHỌN
  const getSelectedVariantOptions = (): VariantOption[] => {
    if (!product?.variants || product.variants.length === 0) return [];
    
    const selectedOptions: VariantOption[] = [];
    
    for (const variant of product.variants) {
      const selectedOptionName = selectedVariants[variant.name];
      if (selectedOptionName) {
        const option = variant.options.find(opt => opt.name === selectedOptionName);
        if (option) {
          selectedOptions.push(option);
        }
      }
    }
    
    return selectedOptions;
  };

  // ✅ LẤY GIÁ CỦA VARIANT OPTION HIỆN TẠI
  const getCurrentPrice = (): number => {
    if (!product) return 0;
    
    const selectedOptions = getSelectedVariantOptions();
    
    // Nếu không có variants, trả về giá gốc
    if (!product.variants || product.variants.length === 0) {
      return product.price;
    }
    
    // Nếu chưa chọn đủ variants, trả về giá gốc
    if (selectedOptions.length !== product.variants.length) {
      return product.price;
    }
    
    // ✅ LẤY GIÁ CỦA VARIANT CUỐI CÙNG (thường là variant có ảnh/màu sắc)
    // Hoặc có thể lấy giá cao nhất, tùy logic nghiệp vụ
    const lastVariantOption = selectedOptions[selectedOptions.length - 1];
    return lastVariantOption.price;
  };

  // ✅ LẤY STOCK THẤP NHẤT TỪ CÁC VARIANTS ĐÃ CHỌN
  const getCurrentStock = (): number => {
    if (!product) return 0;
    
    const selectedOptions = getSelectedVariantOptions();
    
    // Nếu không có variants hoặc chưa chọn đủ
    if (!product.variants || product.variants.length === 0 || selectedOptions.length === 0) {
      return product.stock ?? 99;
    }
    
    // Trả về stock thấp nhất trong các variants đã chọn
    return Math.min(...selectedOptions.map(opt => opt.stock));
  };

  // ✅ LẤY SKU KẾT HỢP TỪ CÁC VARIANTS
  const getCurrentSKU = (): string | null => {
    const selectedOptions = getSelectedVariantOptions();
    
    if (selectedOptions.length === 0) return null;
    
    // Kết hợp SKU của tất cả variants
    return selectedOptions.map(opt => opt.sku).join('-');
  };

  // ✅ LẤY HÌNH ẢNH (ƯU TIÊN VARIANT ĐẦU TIÊN CÓ HÌNH)
  const getCurrentImage = (): string => {
    if (!product) return '';
    
    const selectedOptions = getSelectedVariantOptions();
    
    // Tìm variant đầu tiên có hình ảnh
    const optionWithImage = selectedOptions.find(opt => opt.image);
    
    return optionWithImage?.image || product.image;
  };

  const handleAddToCart = () => {
    if (!product) return;
    
    const selectedOptions = getSelectedVariantOptions();
    
    // Kiểm tra nếu có variants nhưng chưa chọn đủ
    if (product.variants && product.variants.length > 0 && selectedOptions.length !== product.variants.length) {
      alert('Vui lòng chọn đầy đủ các biến thể!');
      return;
    }
    
    // Thêm vào giỏ với thông tin variants
    for (let i = 0; i < quantity; i++) {
      // Nếu có nhiều variants, truyền option đầu tiên (hoặc bạn có thể custom logic này)
      addToCart(product, selectedOptions[0] || undefined);
    }
    
    setIsFlying(true);
    
    const productImage = document.getElementById('product-main-image');
    const cartIcon = document.getElementById('cart-icon');
    
    if (productImage && cartIcon) {
      const clone = productImage.cloneNode(true) as HTMLElement;
      const productRect = productImage.getBoundingClientRect();
      const cartRect = cartIcon.getBoundingClientRect();
      
      clone.style.position = 'fixed';
      clone.style.top = `${productRect.top}px`;
      clone.style.left = `${productRect.left}px`;
      clone.style.width = `${productRect.width}px`;
      clone.style.height = `${productRect.height}px`;
      clone.style.zIndex = '9999';
      clone.style.transition = 'all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
      clone.style.pointerEvents = 'none';
      
      document.body.appendChild(clone);
      
      setTimeout(() => {
        clone.style.top = `${cartRect.top}px`;
        clone.style.left = `${cartRect.left}px`;
        clone.style.width = '40px';
        clone.style.height = '40px';
        clone.style.opacity = '0';
      }, 10);
      
      setTimeout(() => {
        clone.remove();
        setIsFlying(false);
      }, 900);
    }
  };

  const handleBuyNow = () => {
    handleAddToCart();
    setTimeout(() => router.push('/cart'), 1000);
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-32 mb-8"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="h-[500px] bg-gray-200 rounded-2xl"></div>
            <div className="space-y-4">
              <div className="h-8 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-12 bg-gray-200 rounded w-1/3"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-12 max-w-md mx-auto">
          <div className="text-6xl mb-4">😞</div>
          <p className="text-red-600 text-lg font-semibold mb-6">
            {error || 'Không tìm thấy sản phẩm'}
          </p>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-medium"
          >
            <ChevronLeft size={20} />
            Quay lại danh sách sản phẩm
          </Link>
        </div>
      </div>
    );
  }

  const currentPrice = getCurrentPrice();
  const currentStock = getCurrentStock();
  const currentImage = getCurrentImage();
  const currentSKU = getCurrentSKU();
  const selectedOptions = getSelectedVariantOptions();
  
  const discount = product.originalPrice > currentPrice
    ? Math.round(((product.originalPrice - currentPrice) / product.originalPrice) * 100)
    : 0;

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Link
            href="/products"
            className="text-blue-600 hover:text-blue-700 flex items-center font-medium group"
          >
            <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            Quay lại danh sách sản phẩm
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          
          <div className="lg:sticky lg:top-4 lg:self-start">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl bg-white p-8">
              <img
                id="product-main-image"
                src={currentImage}
                alt={product.name}
                className="w-full h-[500px] object-contain transition-all duration-300"
              />
              {discount > 0 && (
                <div className="absolute top-4 right-4 bg-gradient-to-r from-red-500 to-pink-500 text-white px-4 py-2 rounded-full text-lg font-bold shadow-lg">
                  -{discount}%
                </div>
              )}
              <button
                onClick={() => setIsFavorite(!isFavorite)}
                className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm p-3 rounded-full shadow-lg hover:scale-110 transition-transform"
              >
                <Heart
                  size={24}
                  className={isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-600'}
                />
              </button>
            </div>
          </div>

          <div className="space-y-6">
            
            <div className="bg-white rounded-xl p-6 shadow-md">
              <div className="flex items-center justify-between mb-4">
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-semibold">
                  {product.brand}
                </span>
                <div className="flex items-center gap-2 bg-yellow-50 px-3 py-2 rounded-full">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={18}
                        className={i < product.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
                      />
                    ))}
                  </div>
                  <span className="text-gray-700 font-semibold">{product.rating}/5</span>
                </div>
              </div>

              <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 leading-tight">
                {product.name}
              </h1>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 shadow-md border-2 border-blue-100">
              <div className="flex items-baseline gap-4 mb-2">
                <span className="text-4xl lg:text-5xl font-bold text-blue-600">
                  {currentPrice.toLocaleString('vi-VN')}₫
                </span>
                {discount > 0 && (
                  <span className="text-xl text-gray-400 line-through">
                    {product.originalPrice.toLocaleString('vi-VN')}₫
                  </span>
                )}
              </div>
              
              {/* ✅ HIỂN THỊ CHI TIẾT VARIANTS ĐÃ CHỌN */}
              {/* {selectedOptions.length > 0 && (
                <div className="mt-3 pt-3 border-t border-blue-200">
                  <p className="text-sm text-gray-600 font-medium mb-2">Cấu hình đã chọn:</p>
                  {selectedOptions.map((option, idx) => (
                    <div key={idx} className="flex justify-between text-sm text-gray-700 mb-1">
                      <span>• {option.name}</span>
                      <span className="font-semibold">{option.price.toLocaleString('vi-VN')}₫</span>
                    </div>
                  ))}
                </div>
              )} */}
              
              {discount > 0 && (
                <p className="text-green-600 font-medium mt-2">
                  Tiết kiệm {(product.originalPrice - currentPrice).toLocaleString('vi-VN')}₫
                </p>
              )}
              {currentSKU && (
                <p className="text-xs text-gray-500 mt-2">SKU: {currentSKU}</p>
              )}
            </div>

            {product.variants && product.variants.length > 0 && (
              <div className="bg-white rounded-xl p-6 shadow-md space-y-4">
                <h3 className="font-bold text-lg text-gray-800">Chọn biến thể</h3>
                
                {product.variants.map((variant) => (
                  <div key={variant.name} className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">
                      {variant.name}:
                      {selectedVariants[variant.name] && (
                        <span className="ml-2 text-blue-600">{selectedVariants[variant.name]}</span>
                      )}
                    </label>
                    
                    <div className="grid grid-cols-3 gap-2">
                      {variant.options.map((option) => {
                        const isSelected = selectedVariants[variant.name] === option.name;
                        const isOutOfStock = option.stock <= 0;
                        
                        return (
                          <button
                            key={option.name}
                            onClick={() => {
                              if (!isOutOfStock) {
                                setSelectedVariants(prev => ({
                                  ...prev,
                                  [variant.name]: option.name
                                }));
                              }
                            }}
                            disabled={isOutOfStock}
                            className={`
                              relative px-3 py-3 rounded-lg border-2 transition-all text-sm font-medium
                              ${isSelected 
                                ? 'border-blue-600 bg-blue-50 text-blue-600 shadow-md' 
                                : isOutOfStock
                                ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                              }
                            `}
                          >
                            <div className="text-center">
                              <div className="font-semibold">{option.name}</div>
                              {!isOutOfStock && (
                                <div className="text-xs mt-1 text-gray-600">
                                  {option.price > 0 ? `${option.price.toLocaleString('vi-VN')}₫` : ''}
                                  
                                </div>
                              )}
                            </div>
                            {isOutOfStock && (
                              <span className="absolute inset-0 flex items-center justify-center bg-white/80 text-xs text-red-600 font-semibold">
                                Hết hàng
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
                
                {product.variants.some(v => !selectedVariants[v.name]) && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
                    ⚠️ Vui lòng chọn đầy đủ các biến thể
                  </div>
                )}
              </div>
            )}

            <div className="bg-white rounded-xl p-6 shadow-md">
              <h3 className="font-bold text-lg mb-3 text-gray-800">Mô tả sản phẩm</h3>
              <p className="text-gray-600 leading-relaxed">{product.description}</p>
            </div>

            {product.specs && Object.keys(product.specs).length > 0 && (
              <div className="bg-white rounded-xl p-6 shadow-md">
                <h3 className="font-bold text-lg mb-4 text-gray-800">Thông số kỹ thuật</h3>
                <div className="space-y-3">
                  {Object.entries(product.specs).map(([key, value], index) => (
                    <div
                      key={key}
                      className={`flex justify-between py-3 ${
                        index !== Object.keys(product.specs!).length - 1 ? 'border-b border-gray-100' : ''
                      }`}
                    >
                      <span className="text-gray-600 font-medium capitalize">{key}</span>
                      <span className="font-semibold text-gray-900">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
              
            {currentStock !== undefined && (
              <div
                className={`rounded-xl p-4 shadow-md flex items-center gap-3 ${
                  currentStock > 0 ? 'bg-green-50 border-2 border-green-200' : 'bg-red-50 border-2 border-red-200'
                }`}
              >
                <Package
                  size={24}
                  className={currentStock > 0 ? 'text-green-600' : 'text-red-600'}
                />
                <p className={`font-semibold ${currentStock > 0 ? 'text-green-700' : 'text-red-700'}`}>
                  {currentStock > 0 ? `Còn ${currentStock} sản phẩm trong kho` : 'Hết hàng'}
                </p>
              </div>
            )}

            <div className="bg-white rounded-xl p-6 shadow-md space-y-4">
              <div className="flex items-center gap-4">
                <span className="font-semibold text-gray-700">Số lượng:</span>
                <div className="flex items-center border-2 border-gray-300 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-5 py-3 hover:bg-gray-100 transition font-bold text-gray-700 text-xl"
                  >
                    -
                  </button>
                  <span className="px-8 py-3 font-bold text-lg min-w-[80px] text-center bg-gray-50">
                    {quantity}
                  </span>
                  <button
                    onClick={() => {
                      const maxStock = currentStock;
                      setQuantity(prev => prev < maxStock ? prev + 1 : prev);
                    }}
                    className="px-5 py-3 hover:bg-gray-100 transition font-bold text-gray-700 text-xl"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleAddToCart}
                  disabled={
                    isFlying || 
                    currentStock <= 0 || 
                    (product.variants && product.variants.length > 0 && selectedOptions.length !== product.variants.length)
                  }
                  className="flex items-center justify-center gap-2 bg-white border-2 border-blue-600 text-blue-600 py-4 rounded-lg font-semibold hover:bg-blue-50 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  <ShoppingCart size={20} />
                  Thêm vào giỏ
                </button>
                <button
                  onClick={handleBuyNow}
                  disabled={
                    isFlying || 
                    currentStock <= 0 || 
                    (product.variants && product.variants.length > 0 && selectedOptions.length !== product.variants.length)
                  }
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-lg font-semibold hover:shadow-xl transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  Mua ngay
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-md">
              <h3 className="font-bold text-lg mb-4 text-gray-800">Ưu đãi & Dịch vụ</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-gray-700">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <Truck size={20} className="text-blue-600" />
                  </div>
                  <span>Miễn phí vận chuyển cho đơn hàng trên 1 triệu</span>
                </div>
                <div className="flex items-center gap-3 text-gray-700">
                  <div className="bg-green-100 p-2 rounded-lg">
                    <Shield size={20} className="text-green-600" />
                  </div>
                  <span>Bảo hành chính hãng 12-24 tháng</span>
                </div>
                <div className="flex items-center gap-3 text-gray-700">
                  <div className="bg-purple-100 p-2 rounded-lg">
                    <RefreshCw size={20} className="text-purple-600" />
                  </div>
                  <span>Đổi trả miễn phí trong vòng 7 ngày</span>
                </div>
              </div>
            </div>

          </div>
        </div>

        {relatedProducts.length > 0 && (
          <div className="mt-16 pt-12 border-t-2 border-gray-200">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold text-gray-900">Sản phẩm tương tự</h2>
              <Link
                href={`/products?category=${product.categorySlug || ''}`}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold group"
              >
                Xem thêm
                <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
              {relatedProducts.map((relProduct) => {
                const relDiscount = relProduct.originalPrice > relProduct.price
                  ? Math.round(((relProduct.originalPrice - relProduct.price) / relProduct.originalPrice) * 100)
                  : 0;

                return (
                  <Link
                    key={relProduct.slug}
                    href={`/products/${relProduct.slug || relProduct.slug}`}
                    className="group bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all transform hover:scale-105"
                  >
                    <div className="relative overflow-hidden bg-gray-100 h-48">
                      <img
                        src={relProduct.image}
                        alt={relProduct.name}
                        className="w-full h-full object-contain p-4 group-hover:scale-110 transition-transform"
                      />
                      {relDiscount > 0 && (
                        <div className="absolute top-2 right-2 bg-gradient-to-r from-red-500 to-pink-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                          -{relDiscount}%
                        </div>
                      )}
                    </div>

                    <div className="p-4">
                      <p className="text-xs text-gray-500 mb-1">{relProduct.brand}</p>
                      <h3 className="text-sm font-semibold text-gray-800 line-clamp-2 mb-2 group-hover:text-blue-600 truncate">
                        {relProduct.name}
                      </h3>

                      <div className="flex items-center gap-1 mb-3">
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              size={14}
                              className={i < relProduct.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
                            />
                          ))}
                        </div>
                        <span className="text-xs text-gray-600">({relProduct.rating})</span>
                      </div>

                      <div className="flex items-baseline gap-2 mb-3">
                        <span className="text-lg font-bold text-blue-600">
                          {relProduct.price.toLocaleString('vi-VN')}₫
                        </span>
                        {relDiscount > 0 && (
                          <span className="text-xs text-gray-400 line-through">
                            {relProduct.originalPrice.toLocaleString('vi-VN')}₫
                          </span>
                        )}
                      </div>

                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          addToCart(relProduct);
                        }}
                        className="w-full bg-blue-600 text-white text-sm py-2 rounded-lg hover:bg-blue-700 transition font-semibold"
                      >
                        Thêm vào giỏ
                      </button>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
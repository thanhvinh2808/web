'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Heart, 
  ChevronRight, 
  ShieldCheck, 
  RotateCcw, 
  Minus, 
  Plus,
  Check,
  XCircle
} from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import { useWishlist } from '../../contexts/WishlistContext';
import ProductCard from '../../../components/ProductCard';

// --- TYPES ---
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
  id: string;
  name: string;
  brand: string;
  price: number;
  originalPrice: number;
  rating: number;
  image: string;
  images: string[];
  description: string;
  categorySlug?: string;
  slug: string;
  specs?: {
    condition?: string;
    accessories?: string;
    styleCode?: string;
    material?: string;
  };
  stock: number;
  variants?: Variant[];
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// --- SUB COMPONENTS ---

const AccordionItem = ({ title, children, isOpen, onClick }: { title: string, children: React.ReactNode, isOpen: boolean, onClick: () => void }) => {
  return (
    <div className="border-t border-gray-100 last:border-b">
      <button 
        onClick={onClick}
        className="flex justify-between items-center w-full py-4 text-left group"
      >
        <span className="font-bold text-sm uppercase tracking-wide group-hover:text-gray-600 transition">{title}</span>
        {isOpen ? <Minus size={16}/> : <Plus size={16}/>}
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-96 pb-4' : 'max-h-0'}`}>
        <div className="text-sm text-gray-600 leading-relaxed">
          {children}
        </div>
      </div>
    </div>
  );
};

const RelatedCarousel = ({ products }: { products: Product[] }) => {
   const scrollRef = React.useRef<HTMLDivElement>(null);

   const scroll = (direction: 'left' | 'right') => {
      if (scrollRef.current) {
         const { current } = scrollRef;
         const scrollAmount = 320; // Khoảng cách cuộn khớp với chiều rộng card + gap
         if (direction === 'left') {
            current.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
         } else {
            current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
         }
      }
   };

   return (
      <div className="relative group w-full">
         <button 
            onClick={() => scroll('left')}
            className="absolute left-[-20px] top-1/2 -translate-y-1/2 z-20 bg-white border border-gray-100 p-2 rounded-none shadow-xl opacity-0 group-hover:opacity-100 transition disabled:opacity-0 hidden lg:block hover:bg-black hover:text-white"
         >
            <ChevronRight size={20} className="rotate-180"/>
         </button>
         
         <div 
            ref={scrollRef} 
            className="flex gap-4 md:gap-6 overflow-x-auto scrollbar-hide pb-8 snap-x snap-mandatory touch-pan-x"
            style={{ scrollBehavior: 'smooth' }}
         >
            {products.map(p => (
               <div key={p.id || (p as any)._id} className="w-[260px] md:w-[300px] flex-shrink-0 snap-start">
                  <ProductCard product={p} />
               </div>
            ))}
         </div>

         <button 
            onClick={() => scroll('right')}
            className="absolute right-[-20px] top-1/2 -translate-y-1/2 z-20 bg-white border border-gray-100 p-2 rounded-none shadow-xl opacity-0 group-hover:opacity-100 transition hidden lg:block hover:bg-black hover:text-white"
         >
            <ChevronRight size={20}/>
         </button>
      </div>
   );
};

// --- MAIN COMPONENT ---

export default function ProductDetailPage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const router = useRouter();
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  // Data State
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Selection State
  const [selectedSize, setSelectedSize] = useState<VariantOption | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [openAccordion, setOpenAccordion] = useState<string | null>('desc');
  const [activeImage, setActiveImage] = useState<string>('');

  const productId = product?.id || (product as any)?._id || '';
  const isFavorite = isInWishlist(productId);

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    if (product) {
       // @ts-ignore
       toggleWishlist({ ...product, _id: productId });
    }
  };

  // ✅ Helper function để lấy URL ảnh đầy đủ
  const getImageUrl = (imgData: any): string => {
    if (!imgData) return '/placeholder-product.jpg';
    
    // Nếu là string
    let url = '';
    if (typeof imgData === 'string') {
      url = imgData;
    } else if (typeof imgData === 'object' && imgData !== null) {
      url = imgData.url || '';
    }
    
    if (!url || typeof url !== 'string' || url.includes('[object')) return '/placeholder-product.jpg';
    if (url.startsWith('http') || url.startsWith('data:')) return url;
    
    // Lấy domain từ API_URL (bỏ phần /api nếu có)
    const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000').replace('/api', '');
    return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  // --- FETCH DATA ---
  useEffect(() => {
    const fetchProduct = async () => {
      setIsLoading(true);
      try {
        // Khôi phục /api vì API_URL trong môi trường này có thể thiếu nó
        const res = await fetch(`${API_URL}/api/products/${slug}`);
        if (!res.ok) throw new Error('Không tìm thấy sản phẩm');
        
        const data = await res.json();
        const productData = data.data || data; // Handle response format
        setProduct(productData);
        
        // Trích xuất danh sách ảnh (chuẩn hóa về mảng string URL)
        const rawImages = productData.images && productData.images.length > 0 
           ? productData.images 
           : (productData.image ? [productData.image] : []);
        
        const processedImages = rawImages.map((img: any) => getImageUrl(img));
        
        // Set initial active image
        if (processedImages.length > 0) {
           setActiveImage(processedImages[0]);
        }

        // Fetch Related (Cùng Category)
        if (productData.categorySlug) {
           const relRes = await fetch(`${API_URL}/api/products`);
           const relData = await relRes.json();
           const allProds = Array.isArray(relData) ? relData : relData.data || [];
           
           const related = allProds
              .filter((p: Product) => 
                 p.categorySlug === productData.categorySlug && 
                 p.slug !== productData.slug
              )
              .slice(0, 8); // Lấy 8 sản phẩm để scroll
           setRelatedProducts(related);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    if (slug) fetchProduct();
  }, [slug]);

  // --- LOGIC ---
  const toggleAccordion = (id: string) => {
     setOpenAccordion(openAccordion === id ? null : id);
  };
  
  // Flatten Variants thành list Size
  const sizeOptions = React.useMemo(() => {
    if (!product?.variants) return [];
    const sizeVar = product.variants.find(v => v.name.toLowerCase().includes('size')) || product.variants[0];
    return sizeVar?.options || [];
  }, [product]);

  const currentPrice = selectedSize ? selectedSize.price : (product?.price || 0);
  const currentStock = selectedSize ? selectedSize.stock : (product?.stock || 0);
  
  // Tự động chọn size đầu tiên còn hàng
  useEffect(() => {
     if (sizeOptions.length > 0 && !selectedSize) {
        const firstAvailable = sizeOptions.find(opt => opt.stock > 0);
        if (firstAvailable) setSelectedSize(firstAvailable);
     }
  }, [sizeOptions]);

  // Chuẩn hóa danh sách ảnh URL để hiển thị
  const displayImages = React.useMemo(() => {
     if (!product) return [];
     const rawImages = product.images && product.images.length > 0 
        ? product.images 
        : (product.image ? [product.image] : []);
     
     return rawImages.map(img => getImageUrl(img));
  }, [product]);

  // Sync active image khi list ảnh thay đổi
  useEffect(() => {
     if (displayImages.length > 0 && (!activeImage || typeof activeImage !== 'string' || activeImage.includes('[object'))) {
        setActiveImage(displayImages[0]);
     }
  }, [displayImages, activeImage]);

  const handleAddToCart = () => {
    if (!product) return;
    if (sizeOptions.length > 0 && !selectedSize) {
       alert('Vui lòng chọn Size!');
       return;
    }

    // @ts-ignore
    addToCart(product, quantity, selectedSize || undefined);
    
    // Feedback
    const btn = document.getElementById('add-to-cart-btn');
    if (btn) {
       const originalText = btn.innerText;
       btn.innerText = 'Đã thêm vào giỏ ✓';
       setTimeout(() => btn.innerText = originalText, 2000);
    }
  };

  const handleBuyNow = () => {
     handleAddToCart();
     router.push('/cart');
  };

  if (isLoading) return (
     <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
     </div>
  );

  if (error || !product) return (
     <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-center px-4">
        <h1 className="text-4xl font-black mb-4">404</h1>
        <p className="text-gray-500 mb-8">Không tìm thấy sản phẩm này.</p>
        <Link href="/products" className="bg-primary text-white px-8 py-3 rounded-none font-bold uppercase hover:bg-primary-dark">
           Quay lại cửa hàng
        </Link>
     </div>
  );

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900 pb-20">
      
      {/* BREADCRUMB */}
      <div className="container mx-auto px-4 py-4 text-xs font-bold uppercase tracking-wider text-gray-400">
         <Link href="/" className="hover:text-black">Home</Link>
         <ChevronRight size={12} className="inline mx-2"/>
         <Link href="/products" className="hover:text-black">Giày</Link>
         <ChevronRight size={12} className="inline mx-2"/>
         <span className="text-black">{product.name}</span>
      </div>

      <div className="container mx-auto px-4">
         <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            
            {/* LEFT COLUMN: IMAGES (60%) */}
            <div className="lg:col-span-7">
               {/* Main Image */}
               <div className="bg-gray-50 aspect-square overflow-hidden mb-4 border border-gray-100 group">
                  <img 
                     src={activeImage || (displayImages.length > 0 ? displayImages[0] : '')} 
                     alt={product.name} 
                     className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
               </div>
               
               {/* Thumbnails */}
               {displayImages.length > 1 && (
                  <div className="grid grid-cols-5 md:grid-cols-6 gap-3">
                     {displayImages.map((img, idx) => (
                        <button 
                           key={idx}
                           onClick={() => setActiveImage(img)}
                           className={`aspect-square border-2 transition-all overflow-hidden bg-gray-50 ${activeImage === img ? 'border-black opacity-100' : 'border-transparent opacity-60 hover:opacity-100'}`}
                        >
                           <img src={img} alt={`${product.name} ${idx}`} className="w-full h-full object-cover" />
                        </button>
                     ))}
                  </div>
               )}

               {/* Detailed Images Grid (Section for detailed view) */}
               <div className="mt-12 space-y-4">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-6 border-b pb-2">Hình ảnh chi tiết</h3>
                  <div className="grid grid-cols-1 gap-4">
                     {displayImages.map((img, idx) => (
                        <div key={idx} className="bg-gray-50 overflow-hidden border border-gray-100">
                           <img 
                              src={img} 
                              alt={`${product.name} detail ${idx}`} 
                              className="w-full h-auto object-cover"
                           />
                        </div>
                     ))}
                  </div>
               </div>
            </div>

            {/* RIGHT COLUMN: INFO (40%) - STICKY */}
            <div className="lg:col-span-5 lg:sticky lg:top-24 h-fit space-y-8">
               
               {/* Header Info */}
               <div>
                  <div className="flex justify-between items-start mb-2">
                     <h1 className="text-3xl lg:text-4xl font-black italic leading-none tracking-tight">{product.name}</h1>
                     <button onClick={handleWishlistToggle} className="p-2 hover:bg-gray-100 rounded-none transition">
                        <Heart className={isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-400'}/>
                     </button>
                  </div>
                  
                  <div className="flex items-center gap-4 mb-4">
                     <span className="text-sm font-bold text-gray-500 uppercase tracking-widest">{product.brand}</span>
                     {product.specs?.condition && (
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-none border uppercase ${
                           product.specs.condition === 'New' 
                              ? 'bg-black text-white border-black' 
                              : 'bg-white text-gray-600 border-gray-300'
                        }`}>
                           {product.specs.condition}
                        </span>
                     )}
                  </div>

                  <div className="flex items-baseline gap-3">
                     <span className="text-2xl font-bold">{currentPrice.toLocaleString()}₫</span>
                     {product.originalPrice > currentPrice && (
                        <span className="text-gray-400 line-through text-sm">{product.originalPrice.toLocaleString()}₫</span>
                     )}
                  </div>
                  
                  {/* 🚫 OUT OF STOCK ALERT */}
                  {product.stock <= 0 && (
                    <div className="mt-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700">
                       <p className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                          <XCircle size={16}/> Sản phẩm này hiện đã hết hàng
                       </p>
                    </div>
                  )}
               </div>

               {/* Size Selector */}
               {sizeOptions.length > 0 && (
                  <div>
                     <div className="flex justify-between items-center mb-3">
                        <span className="font-bold text-sm">Chọn Size</span>
                        <button className="text-xs text-gray-500 underline hover:text-primary">Hướng dẫn chọn size</button>
                     </div>
                     <div className="grid grid-cols-4 gap-2">
                        {sizeOptions.map((opt, idx) => {
                           const isAvailable = opt.stock > 0;
                           const isSelected = selectedSize?.name === opt.name;
                           
                           return (
                              <button
                                 key={idx}
                                 disabled={!isAvailable}
                                 onClick={() => setSelectedSize(opt)}
                                 className={`
                                    py-3 rounded-none border text-sm font-bold transition
                                    ${isSelected 
                                       ? 'border-primary bg-primary text-white' 
                                       : isAvailable 
                                          ? 'border-gray-200 hover:border-primary text-gray-900' 
                                          : 'border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed decoration-slice'
                                    }
                                 `}
                              >
                                 {opt.name}
                              </button>
                           )
                        })}
                     </div>
                     {selectedSize && (
                        <p className="text-xs text-primary font-bold mt-2 flex items-center gap-1">
                           <Check size={12}/> Còn {selectedSize.stock} sản phẩm
                        </p>
                     )}
                  </div>
               )}

               {/* Add to Cart Actions */}
               <div className="space-y-3 pt-4 border-t border-gray-100">
                  <button 
                     id="add-to-cart-btn"
                     onClick={handleAddToCart}
                     disabled={currentStock === 0}
                     className="w-full bg-primary text-white py-4 rounded-none font-bold uppercase tracking-wider hover:bg-primary-dark transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/30"
                  >
                     {currentStock > 0 ? 'Thêm vào giỏ hàng' : 'Hết hàng'}
                  </button>
                  <button 
                     onClick={handleBuyNow}
                     disabled={currentStock === 0}
                     className="w-full bg-white border-2 border-primary text-primary py-4 rounded-none font-bold uppercase tracking-wider hover:bg-primary hover:text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                     Mua ngay
                  </button>
               </div>

               {/* Description & Details Accordion */}
               <div className="pt-6">
                  <AccordionItem 
                     title="Mô tả sản phẩm" 
                     isOpen={openAccordion === 'desc'} 
                     onClick={() => toggleAccordion('desc')}
                  >
                     <p>{product.description}</p>
                     {product.specs && (
                        <div className="mt-4 bg-gray-50 p-3 rounded-none text-xs space-y-1">
                           {product.specs.styleCode && <p><span className="font-bold">Style Code:</span> {product.specs.styleCode}</p>}
                           {product.specs.material && <p><span className="font-bold">Chất liệu:</span> {product.specs.material}</p>}
                           {product.specs.accessories && <p><span className="font-bold">Phụ kiện:</span> {product.specs.accessories}</p>}
                        </div>
                     )}
                  </AccordionItem>
                  
                  <AccordionItem 
                     title="Vận chuyển & Đổi trả" 
                     isOpen={openAccordion === 'shipping'} 
                     onClick={() => toggleAccordion('shipping')}
                  >
                     <ul className="list-disc pl-4 space-y-1">
                        <li>Miễn phí vận chuyển cho đơn hàng từ 2.000.000đ.</li>
                        <li>Giao hàng hỏa tốc 2h trong nội thành TP.HCM.</li>
                        <li>Đổi trả miễn phí trong vòng 7 ngày (giày chưa qua sử dụng).</li>
                        <li>Bảo hành keo chỉ trọn đời.</li>
                     </ul>
                  </AccordionItem>

                  <AccordionItem 
                     title="Hướng dẫn bảo quản" 
                     isOpen={openAccordion === 'care'} 
                     onClick={() => toggleAccordion('care')}
                  >
                     <ul className="list-disc pl-4 space-y-1">
                        <li>Tránh ngâm giày trong nước quá lâu.</li>
                        <li>Sử dụng dung dịch vệ sinh chuyên dụng (Crep Protect, Jason Markk...).</li>
                        <li>Không phơi giày trực tiếp dưới ánh nắng gắt.</li>
                        <li>Nên dùng shoe tree để giữ form giày.</li>
                     </ul>
                  </AccordionItem>
               </div>
               
               {/* Cam kết ngắn gọn */}
               <div className="flex gap-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest pt-4">
                  <span className="flex items-center gap-1"><ShieldCheck size={14}/> Authentic 100%</span>
                  <span className="flex items-center gap-1"><RotateCcw size={14}/> 7 Days Return</span>
               </div>

            </div>
         </div>

         {/* RELATED PRODUCTS CAROUSEL */}
         {relatedProducts.length > 0 && (
            <div className="mt-24 border-t border-gray-100 pt-12">
               <div className="flex justify-between items-end mb-8">
                  <h3 className="text-2xl font-black italic uppercase">Có thể bạn thích</h3>
                  <Link href="/products" className="text-sm font-bold text-gray-500 hover:text-black underline">Xem tất cả</Link>
               </div>
               <div className="w-full overflow-hidden">
                  <RelatedCarousel products={relatedProducts} />
               </div>
            </div>
         )}
      </div>
    </div>
  );
}

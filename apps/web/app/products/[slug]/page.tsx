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
  XCircle,
  CheckCircle,
  Ruler // ✅ Import icon Ruler
} from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import { useWishlist } from '../../contexts/WishlistContext';
import { useAuth } from '../../contexts/AuthContext';
import ProductCard from '../../../components/ProductCard';
import SizeGuideModal from '../../../components/SizeGuideModal'; // ✅ Import Modal
import toast from 'react-hot-toast';
import { getImageUrl } from '../../../lib/imageHelper';

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
  // ✅ Thêm thông tin Brand object từ populate
  brandId?: {
     _id: string;
     name: string;
     slug: string;
     logo: string;
  };
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
            className="absolute left-[10px] top-1/2 -translate-y-1/2 z-20 bg-white border border-gray-100 p-2 rounded-none shadow-xl opacity-0 group-hover:opacity-100 transition disabled:opacity-0 hidden lg:block hover:bg-black hover:text-white"
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
            className="absolute right-[10px] top-1/2 -translate-y-1/2 z-20 bg-white border border-gray-100 p-2 rounded-none shadow-xl opacity-0 group-hover:opacity-100 transition hidden lg:block hover:bg-black hover:text-white"
         >
            <ChevronRight size={20}/>
         </button>
      </div>
   );
};

// --- REVIEW COMPONENT ---
const ProductReviews = ({ productId }: { productId: string }) => {
   const { user, isAuthenticated } = useAuth();
   const [reviews, setReviews] = useState<any[]>([]);
   const [canReview, setCanReview] = useState(false);
   const [isLoading, setIsLoading] = useState(true);
   const [isSubmitting, setIsSubmitting] = useState(false);
   
   // Form state
   const [rating, setRating] = useState(5);
   const [comment, setComment] = useState('');

   const fetchReviews = async () => {
      try {
         const res = await fetch(`${API_URL}/api/products/${productId}/reviews`);
         const data = await res.json();
         if (data.success) setReviews(data.reviews);
      } catch (e) { console.error(e); }
   };

   const checkCanReview = async () => {
      if (!isAuthenticated) return;
      try {
         const token = localStorage.getItem('token');
         const res = await fetch(`${API_URL}/api/products/${productId}/can-review`, {
            headers: { 'Authorization': `Bearer ${token}` }
         });
         const data = await res.json();
         setCanReview(data.canReview);
      } catch (e) { console.error(e); }
   };

   useEffect(() => {
      if (productId) {
         fetchReviews();
         checkCanReview();
         setIsLoading(false);
      }
   }, [productId, isAuthenticated]);

   const handleSubmitReview = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!comment.trim()) return;

      setIsSubmitting(true);
      try {
         const token = localStorage.getItem('token');
         const res = await fetch(`${API_URL}/api/products/${productId}/reviews`, {
            method: 'POST',
            headers: { 
               'Content-Type': 'application/json',
               'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ rating, comment })
         });
         const data = await res.json();
         if (data.success) {
            toast.success('Cảm ơn bạn đã đánh giá sản phẩm!');
            setComment('');
            setCanReview(false);
            fetchReviews();
         } else {
            toast.error(data.message);
         }
      } catch (e) {
         toast.error('Gửi đánh giá thất bại');
      } finally {
         setIsSubmitting(false);
      }
   };

   if (isLoading) return <div className="py-10 text-center text-gray-400">Đang tải đánh giá...</div>;

   return (
      <div id="review" className="mt-16 border-t border-gray-100 pt-12">
         <h3 className="text-2xl font-black italic uppercase mb-8 flex items-center gap-3">
            Đánh giá khách hàng <span className="text-gray-300 text-lg">({reviews.length})</span>
         </h3>

         <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            {/* Form Section */}
            <div className="lg:col-span-5">
               {canReview ? (
                  <div className="bg-gray-50 p-8 border border-gray-100 sticky top-24">
                     <h4 className="font-bold uppercase tracking-widest text-sm mb-6">Viết đánh giá của bạn</h4>
                     <form onSubmit={handleSubmitReview} className="space-y-6">
                        <div>
                           <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">Mức độ hài lòng</label>
                           <div className="flex gap-2">
                              {[1, 2, 3, 4, 5].map((star) => (
                                 <button 
                                    key={star}
                                    type="button"
                                    onClick={() => setRating(star)}
                                    className={`text-2xl transition ${star <= rating ? 'text-yellow-400' : 'text-gray-200'}`}
                                 >
                                    ★
                                 </button>
                              ))}
                           </div>
                        </div>

                        <div>
                           <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">Nội dung đánh giá</label>
                           <textarea 
                              value={comment}
                              onChange={(e) => setComment(e.target.value)}
                              placeholder="Chia sẻ trải nghiệm của bạn về đôi giày này..."
                              className="w-full bg-white border-none p-4 text-sm font-medium focus:ring-2 focus:ring-primary outline-none min-h-[120px] resize-none"
                              required
                           />
                        </div>

                        <button 
                           type="submit" 
                           disabled={isSubmitting}
                           className="w-full bg-black text-white py-4 font-black uppercase tracking-widest hover:bg-primary transition disabled:opacity-50"
                        >
                           {isSubmitting ? 'Đang gửi...' : 'Gửi đánh giá ngay'}
                        </button>
                     </form>
                  </div>
               ) : (
                  <div className="bg-blue-50/50 p-8 border border-blue-100 text-center sticky top-24">
                     <CheckCircle className="mx-auto mb-4 text-blue-600" size={32}/>
                     <h4 className="font-bold uppercase tracking-widest text-sm text-blue-900 mb-2">Đánh giá sản phẩm</h4>
                     <p className="text-xs text-blue-700 font-medium leading-relaxed">
                        {!isAuthenticated 
                           ? 'Vui lòng đăng nhập để thực hiện đánh giá' 
                           : 'Chỉ những khách hàng đã hoàn thành đơn hàng mới có thể gửi đánh giá cho sản phẩm này.'}
                     </p>
                  </div>
               )}
            </div>

            {/* List Section */}
            <div className="lg:col-span-7">
               {reviews.length === 0 ? (
                  <div className="text-center py-20 bg-gray-50 border border-dashed border-gray-200">
                     <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Chưa có đánh giá nào cho sản phẩm này</p>
                  </div>
               ) : (
                  <div className="space-y-8">
                     {reviews.map((rev) => (
                        <div key={rev._id} className="border-b border-gray-100 pb-8 last:border-0">
                           <div className="flex justify-between items-start mb-4">
                              <div className="flex items-center gap-3">
                                 <div className="w-10 h-10 bg-gray-200 rounded-none flex items-center justify-center font-black text-gray-400 uppercase">
                                    {rev.userId?.avatar ? <img src={rev.userId.avatar} className="w-full h-full object-cover" /> : rev.userId?.name?.charAt(0)}
                                 </div>
                                 <div>
                                    <div className="font-bold text-sm uppercase tracking-tight">{rev.userId?.name}</div>
                                    <div className="text-yellow-400 text-xs">{'★'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)}</div>
                                 </div>
                              </div>
                              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                 {new Date(rev.createdAt).toLocaleDateString()}
                              </span>
                           </div>
                           <p className="text-gray-600 text-sm leading-relaxed font-medium italic">"{rev.comment}"</p>
                           {rev.isPurchased && (
                              <div className="mt-3 flex items-center gap-1 text-green-600">
                                 <ShieldCheck size={12}/>
                                 <span className="text-[10px] font-black uppercase tracking-widest">Đã mua hàng tại FootMark</span>
                              </div>
                           )}
                           {rev.reply?.content && (
                              <div className="mt-4 ml-8 p-4 bg-gray-50 border-l-2 border-primary">
                                 <div className="font-black text-[10px] uppercase tracking-widest text-primary mb-1">FootMark Team phản hồi:</div>
                                 <p className="text-sm text-gray-500 font-medium">{rev.reply.content}</p>
                              </div>
                           )}
                        </div>
                     ))}
                  </div>
               )}
            </div>
         </div>
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
  const [isActionLoading, setIsActionLoading] = useState(false);
  
  // ✅ Size Guide State
  const [showSizeGuide, setShowSizeGuide] = useState(false);

  const productId = product?.id || (product as any)?._id || '';
  const isFavorite = isInWishlist(productId);

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    if (product) {
       // @ts-ignore
       toggleWishlist({ ...product, _id: productId });
    }
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

        // Fetch Related (Cùng Category) - ✅ OPTIMIZED
        if (productData.categorySlug) {
           const relRes = await fetch(`${API_URL}/api/products?category=${productData.categorySlug}&exclude=${productData.slug}&limit=8`);
           const relData = await relRes.json();
           let related = Array.isArray(relData) ? relData : relData.data || [];
           
           // ✅ FALLBACK: Nếu không có sản phẩm cùng danh mục, lấy sản phẩm mới nhất/khác
           if (related.length === 0) {
              const fallbackRes = await fetch(`${API_URL}/api/products?limit=8&exclude=${productData.slug}`);
              const fallbackData = await fallbackRes.json();
              related = Array.isArray(fallbackData) ? fallbackData : fallbackData.data || [];
           }

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

  // ✅ Auto scroll to review
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get('review') === 'true') {
      const el = document.getElementById('review');
      if (el) setTimeout(() => el.scrollIntoView({ behavior: 'smooth' }), 500);
    }
  }, [product]);

  // --- LOGIC ---
  const toggleAccordion = (id: string) => {
     setOpenAccordion(openAccordion === id ? null : id);
  };
  
  // Flatten Variants thành list Size và list Color
  const sizeOptions = React.useMemo(() => {
    if (!product?.variants) return [];
    // Ưu tiên tìm variant có chữ 'size', nếu không có thì lấy cái đầu tiên (thường là size)
    const sizeVar = product.variants.find(v => v.name.toLowerCase().includes('size')) || product.variants[0];
    return sizeVar?.options || [];
  }, [product]);

  const colorOptions = React.useMemo(() => {
    if (!product?.variants) return [];
    // Tìm variant có chữ 'color' hoặc 'màu'
    const colorVar = product.variants.find(v => 
       v.name.toLowerCase().includes('color') || 
       v.name.toLowerCase().includes('màu')
    );
    return colorVar?.options || [];
  }, [product]);

  const currentPrice = selectedSize ? selectedSize.price : (product?.price || 0);
  const currentStock = selectedSize ? selectedSize.stock : (product?.stock || 0);
  
  // State cho màu sắc
  const [selectedColor, setSelectedColor] = useState<string | null>(null);

  // Tự động chọn size/màu đầu tiên còn hàng
  useEffect(() => {
     if (sizeOptions.length > 0 && !selectedSize) {
        const firstAvailable = sizeOptions.find(opt => opt.stock > 0);
        if (firstAvailable) setSelectedSize(firstAvailable);
     }
     if (colorOptions.length > 0 && !selectedColor) {
        setSelectedColor(colorOptions[0].name);
     }
  }, [sizeOptions, colorOptions]);

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
    if (!product || isActionLoading) return;
    
    // Validate Size
    if (sizeOptions.length > 0 && !selectedSize) {
       toast.error('Vui lòng chọn Size!');
       return;
    }

    // Validate Color
    if (colorOptions.length > 0 && !selectedColor) {
       toast.error('Vui lòng chọn Màu sắc!');
       return;
    }

    setIsActionLoading(true);
    // @ts-ignore
    addToCart(product, quantity, selectedSize || undefined, selectedColor || undefined);
    
    // Feedback
    const btn = document.getElementById('add-to-cart-btn');
    if (btn) {
       const originalText = btn.innerText;
       btn.innerText = 'Đã thêm vào giỏ ✓';
       setTimeout(() => {
          if (btn) btn.innerText = originalText;
          setIsActionLoading(false);
       }, 1500);
    } else {
       setIsActionLoading(false);
    }
  };

  const handleBuyNow = (e: React.MouseEvent) => {
     e.preventDefault(); // Ngăn chặn mọi hành vi mặc định hoặc bubbling
     if (!product || isActionLoading) return;
     
     if (sizeOptions.length > 0 && !selectedSize) {
        toast.error('Vui lòng chọn Size!');
        return;
     }

     if (colorOptions.length > 0 && !selectedColor) {
        toast.error('Vui lòng chọn Màu sắc!');
        return;
     }

     setIsActionLoading(true);
     // @ts-ignore
     addToCart(product, quantity, selectedSize || undefined, selectedColor || undefined);
     
     // Chuyển trang sau một khoảng thời gian cực ngắn để state kịp commit
     setTimeout(() => {
        router.push('/cart');
     }, 100);
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
               <div className="bg-gray-50 aspect-square overflow-hidden mb-4 border border-gray-100 group relative">
                  <img 
                     src={activeImage || (displayImages.length > 0 ? displayImages[0] : 'https://placehold.co/600x600/f3f4f6/000000?text=No+Image')} 
                     alt={product.name} 
                     className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                     onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.onerror = null; 
                        target.src = 'https://placehold.co/600x600/f3f4f6/000000?text=No+Image';
                     }}
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
                           <img 
                              src={img} 
                              alt={`${product.name} ${idx}`} 
                              className="w-full h-full object-cover" 
                              onError={(e) => {
                                 const target = e.target as HTMLImageElement;
                                 target.onerror = null; 
                                 target.src = 'https://placehold.co/600x600/f3f4f6/000000?text=No+Image';
                              }}
                           />
                        </button>
                     ))}
                  </div>
               )}

               {/* Product Reviews Section */}
               <ProductReviews productId={productId} />
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
                     {/* ✅ Hiển thị Logo Brand nếu có */}
                     {product?.brandId?.logo ? (
                        <div className="h-8 w-auto flex items-center">
                           <img src={product.brandId.logo} alt={product.brand} className="h-full object-contain max-w-[100px]" />
                        </div>
                     ) : (
                        <span className="text-sm font-bold text-gray-500 uppercase tracking-widest">{product?.brand}</span>
                     )}

                     {product?.specs?.condition && (
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
                     {product && product.originalPrice > currentPrice && (
                        <span className="text-gray-400 line-through text-sm">{product.originalPrice.toLocaleString()}₫</span>
                     )}
                  </div>
                  
                  {/* ... (Giữ nguyên Out of Stock Alert) */}
               </div>

               {/* Size Selector */}
               {sizeOptions.length > 0 && (
                  <div>
                     <div className="flex justify-between items-center mb-3">
                        <span className="font-bold text-sm">Chọn Size</span>
                        
                        {/* ✅ Nút mở Size Guide Modal */}
                        <button 
                           onClick={() => setShowSizeGuide(true)}
                           className="text-xs text-gray-500 underline hover:text-primary flex items-center gap-1"
                        >
                           <Ruler size={14}/> Hướng dẫn chọn size
                        </button>
                     </div>
                     <div className="grid grid-cols-4 gap-2">
                        {sizeOptions.map((opt, idx) => {
                           const isAvailable = opt.stock > 0;
                           const isSelected = selectedSize?.name === opt.name;
                           
                           return (
                              <button
                                 key={idx}
                                 disabled={!isAvailable}
                                 onClick={() => {
                                    setSelectedSize(opt);
                                    if (quantity > opt.stock) setQuantity(opt.stock);
                                 }}
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
                        <div className="flex justify-between items-center mt-2">
                           <p className="text-xs text-primary font-bold flex items-center gap-1">
                              <Check size={12}/> Còn {selectedSize.stock} sản phẩm
                           </p>
                           {selectedSize.stock <= 5 && (
                              <span className="text-[10px] font-black text-red-500 uppercase animate-pulse">Sắp hết hàng!</span>
                           )}
                        </div>
                     )}
                  </div>
               )}

               {/* Color Selector (MỚI) */}
               {colorOptions.length > 0 && (
                  <div className="pt-2">
                     <div className="flex justify-between items-center mb-3">
                        <span className="font-bold text-sm">Chọn Màu Sắc</span>
                     </div>
                     <div className="flex flex-wrap gap-3">
                        {colorOptions.map((opt, idx) => {
                           const isSelected = selectedColor === opt.name;
                           
                           return (
                              <button
                                 key={idx}
                                 onClick={() => setSelectedColor(opt.name)}
                                 className={`
                                    px-4 py-2 rounded-none border text-sm font-bold transition flex items-center gap-2
                                    ${isSelected 
                                       ? 'border-primary bg-gray-900 text-white' 
                                       : 'border-gray-200 hover:border-primary text-gray-700 hover:text-black' 
                                    }
                                 `}
                              >
                                 {opt.name.startsWith('#') && (
                                    <span className="w-4 h-4 rounded-full border border-gray-200" style={{ backgroundColor: opt.name }}></span>
                                 )}
                                 {opt.name}
                              </button>
                           )
                        })}
                     </div>
                  </div>
               )}

               {/* Quantity Selector */}
               <div className="space-y-3">
                  <span className="font-bold text-sm">Số lượng</span>
                  <div className="flex items-center border border-gray-200 w-fit">
                     <button 
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="px-4 py-2 hover:bg-gray-50 border-r border-gray-200"
                     >
                        <Minus size={16}/>
                     </button>
                     <span className="px-6 font-bold">{quantity}</span>
                     <button 
                        onClick={() => {
                           const max = selectedSize ? selectedSize.stock : (product?.stock || 0);
                           if (quantity < max) setQuantity(quantity + 1);
                           else toast.error(`Xin lỗi, chỉ còn ${max} sản phẩm trong kho`);
                        }}
                        className="px-4 py-2 hover:bg-gray-50 border-l border-gray-200"
                     >
                        <Plus size={16}/>
                     </button>
                  </div>
               </div>

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
                     <p>{product?.description}</p>
                     {product?.specs && (
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

      {/* ✅ Modal Size Guide */}
      {product?.brandId && (
        <SizeGuideModal 
           brandId={product.brandId._id}
           brandName={product.brand}
           isOpen={showSizeGuide}
           onClose={() => setShowSizeGuide(false)}
        />
      )}
    </div>
  );
}
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Heart, 
  ChevronRight, 
  Minus, 
  Plus,
  TrendingUp,
  Ruler,
  AlertTriangle,
  Star,
  MessageSquare,
  CheckCircle2,
  ThumbsUp,
  ShieldCheck,
  RotateCcw
} from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import { useWishlist } from '../../contexts/WishlistContext';
import { useAuth } from '../../contexts/AuthContext';
import ProductCard from '../../../components/ProductCard';
import SizeGuideModal from '../../../components/SizeGuideModal';
import ReviewModal from '../../../components/ReviewModal';
import { getImageUrl } from '../../../lib/imageHelper';
import { CLEAN_API_URL } from '@lib/shared/constants';
import toast from 'react-hot-toast';

const API_URL = CLEAN_API_URL;

// --- TYPES ---
interface Review {
  _id: string;
  userId: {
    _id: string;
    fullName: string;
    avatar?: string;
  };
  rating: number;
  comment: string;
  createdAt: string;
  isPurchased?: boolean;
  isAnonymous?: boolean;
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
  _id: string;
  id?: string;
  name: string;
  brand: string;
  brandId?: any;
  price: number;
  originalPrice?: number;
  image: string;
  images: any[];
  description: string;
  categorySlug?: string;
  slug: string;
  specs?: {
    condition?: string;
    accessories?: string;
    styleCode?: string;
    material?: string;
    colorway?: string;
  };
  stock: number;
  soldCount?: number;
  variants?: Variant[];
}

export default function ProductDetailPage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const router = useRouter();
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();

  // Data State
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeImage, setActiveImage] = useState<string>('');
  
  // Selection State
  const [selectedSize, setSelectedSize] = useState<VariantOption | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Review State
  const [reviews, setReviews] = useState<Review[]>([]);
  const [canReview, setCanReview] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [fetchReviewsTrigger, setFetchReviewsTrigger] = useState(0);

  const productId = product?._id || product?.id || '';
  const isFavorite = isInWishlist(productId);

  // --- LOGIC ẨN DANH & TÍNH SAO ---
  const averageRating = useMemo(() => {
    if (reviews.length === 0) return 0;
    const total = reviews.reduce((acc, rev) => acc + rev.rating, 0);
    return total / reviews.length;
  }, [reviews]);

  const maskName = (name?: string) => {
    if (!name) return "n*****g";
    const parts = name.split(' ');
    const lastPart = parts[parts.length - 1];
    if (lastPart.length < 2) return lastPart + "*****";
    return lastPart.charAt(0) + "*****" + lastPart.charAt(lastPart.length - 1);
  };

  // ✅ RESET SỐ LƯỢNG KHI ĐỔI SIZE
  useEffect(() => {
    if (selectedSize) {
      setQuantity(1);
    }
  }, [selectedSize]);

  // --- FETCH REVIEWS ---
  useEffect(() => {
    const fetchReviewsData = async () => {
      if (!productId || productId === 'undefined' || productId === '') return;
      
      try {
        const res = await fetch(`${API_URL}/api/products/${productId}/reviews`);
        const data = await res.json();
        if (data.success) setReviews(data.reviews);

        // Check can review
        const token = localStorage.getItem('token');
        if (token) {
          const canRes = await fetch(`${API_URL}/api/products/${productId}/can-review`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const canData = await canRes.json();
          setCanReview(!!canData.canReview);
        }
      } catch (err) {
        console.error('Lỗi tải đánh giá:', err);
      }
    };
    fetchReviewsData();
  }, [productId, fetchReviewsTrigger]);

  // --- FETCH DATA ---
  useEffect(() => {
    const fetchProduct = async () => {
      if (!slug || slug === 'undefined') {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const res = await fetch(`${API_URL}/api/products/${slug}`);
        if (!res.ok) throw new Error('Không tìm thấy sản phẩm');
        const result = await res.json();
        const data = result.data || result;
        setProduct(data);
        
        if (data.image) setActiveImage(getImageUrl(data.image));
        else if (data.images?.length > 0) setActiveImage(getImageUrl(data.images[0]));

        // ✅ LOGIC GỢI Ý THÔNG MINH
        let related: Product[] = [];
        const brandRes = await fetch(`${API_URL}/api/products?brand=${encodeURIComponent(data.brand)}&exclude=${data.slug}&limit=4`);
        const brandData = await brandRes.json();
        related = brandData.data || [];

        if (related.length < 4 && data.categorySlug) {
           const catRes = await fetch(`${API_URL}/api/products?category=${data.categorySlug}&exclude=${data.slug}&limit=4`);
           const catData = await catRes.json();
           const catProducts = (catData.data || []).filter((p: Product) => !related.find(r => r._id === p._id));
           related = [...related, ...catProducts].slice(0, 4);
        }

        if (related.length < 4) {
           const newRes = await fetch(`${API_URL}/api/products?sort=createdAt&exclude=${data.slug}&limit=4`);
           const newData = await newRes.json();
           const newProducts = (newData.data || []).filter((p: Product) => !related.find(r => r._id === p._id));
           related = [...related, ...newProducts].slice(0, 4);
        }

        setRelatedProducts(related);

      } catch (err) {
        console.error('Lỗi tải sản phẩm:', err);
        setProduct(null);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProduct();
  }, [slug]);

  // --- LOGIC TÍNH TOÁN ---
  
  const sizeVariant = useMemo(() => 
    product?.variants?.find(v => v.name.toLowerCase().includes('size')) || null, 
  [product]);

  const colorVariant = useMemo(() => 
    product?.variants?.find(v => v.name.toLowerCase().includes('màu') || v.name.toLowerCase().includes('color')) || null, 
  [product]);

  const displayPrice = useMemo(() => {
    if (!product) return 0;
    const base = product.price || 0;
    const surcharge = selectedSize ? (selectedSize.price || 0) : 0;
    return base + surcharge;
  }, [product, selectedSize]);

  const isOutOfStock = useMemo(() => {
    if (!product) return true;
    if (product.variants?.length) {
      return !product.variants.some(v => v.options.some(opt => opt.stock > 0));
    }
    return !(product.stock > 0);
  }, [product]);

  const isLowStock = useMemo(() => {
    if (!product || isOutOfStock) return false;
    if (selectedSize) return selectedSize.stock === 1;
    if (!sizeVariant) return product.stock === 1;
    return false;
  }, [product, selectedSize, isOutOfStock, sizeVariant]);

  // --- ACTIONS ---
  const handleAddToCart = () => {
    if (!product) return;
    if (sizeVariant && !selectedSize) { toast.error('Vui lòng chọn Size'); return; }
    if (colorVariant && !selectedColor) { toast.error('Vui lòng chọn Màu sắc'); return; }

    setIsActionLoading(true);
    // @ts-ignore
    addToCart({ ...product, _id: productId }, quantity, selectedSize, selectedColor);
    setTimeout(() => setIsActionLoading(false), 500);
  };

  const handleBuyNow = () => {
    if (!product) return;
    if (sizeVariant && !selectedSize) { toast.error('Vui lòng chọn Size'); return; }
    if (colorVariant && !selectedColor) { toast.error('Vui lòng chọn Màu sắc'); return; }
    
    // @ts-ignore
    addToCart({ ...product, _id: productId }, quantity, selectedSize, selectedColor);
    router.push('/cart');
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center">Đang tải...</div>;
  if (!product) return <div className="min-h-screen flex items-center justify-center">Không tìm thấy sản phẩm</div>;

  const formatCurrency = (val: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

  return (
    <div className="min-h-screen bg-white pb-20">
      <div className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          
          {/* HÌNH ẢNH */}
          <div className="space-y-4">
            <div className="aspect-square bg-gray-50 border border-gray-100 overflow-hidden">
              <img src={activeImage} alt={product.name} className="w-full h-full object-cover" />
            </div>
            {product.images?.length > 1 && (
              <div className="grid grid-cols-5 gap-2">
                {product.images.map((img: any, idx: number) => (
                  <button 
                    key={idx} 
                    onClick={() => setActiveImage(getImageUrl(img))}
                    className={`aspect-square border-2 ${activeImage === getImageUrl(img) ? 'border-black' : 'border-transparent'}`}
                  >
                    <img src={getImageUrl(img)} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* THÔNG TIN */}
          <div className="flex flex-col">
            <div className="mb-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{product.brand}</p>
                  <h1 className="text-3xl font-black italic uppercase tracking-tight mb-2">{product.name}</h1>
                </div>
                <button onClick={() => toggleWishlist({ ...product, _id: productId } as any)} className="p-2 border border-gray-100 hover:bg-gray-50">
                  <Heart className={isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-400'} />
                </button>
              </div>

              <div className="flex items-center gap-4 mt-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-black text-black italic">{formatCurrency(displayPrice)}</span>
                  {product.originalPrice !== undefined && product.originalPrice > displayPrice && (
                    <span className="text-sm text-gray-400 line-through">{formatCurrency(product.originalPrice)}</span>
                  )}
                </div>
                <div className="flex items-center gap-1 border-l border-gray-200 pl-4">
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star 
                        key={s} 
                        size={14} 
                        className={s <= Math.round(averageRating) ? "fill-yellow-400 text-yellow-400" : "text-gray-200"} 
                      />
                    ))}
                  </div>
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-0.5">
                    ({reviews.length} đánh giá)
                  </span>
                </div>
                {Number(product.soldCount) > 0 ? (
                  <span className="text-[10px] font-bold bg-blue-50 text-primary px-2 py-1 uppercase flex items-center gap-1 ml-auto">
                    <TrendingUp size={12}/> Đã bán {product.soldCount}
                  </span>
                ) : null}
              </div>
            </div>

            {/* CHỌN BIẾN THỂ */}
            <div className="space-y-6 border-t border-dashed border-gray-100 pt-6">
              
              {/* SIZE */}
              {sizeVariant && (
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-black uppercase tracking-widest">Kích thước</span>
                    <button onClick={() => setShowSizeGuide(true)} className="text-[10px] font-bold text-gray-400 underline flex items-center gap-1 hover:text-black">
                      <Ruler size={12}/> Bảng size
                    </button>
                  </div>
                  <div className="grid grid-cols-5 gap-2">
                    {sizeVariant.options.map((opt, idx) => (
                      <button
                        key={idx}
                        disabled={opt.stock === 0}
                        onClick={() => setSelectedSize(opt)}
                        className={`py-3 text-xs font-bold border transition ${
                          opt.stock === 0 ? 'bg-gray-50 text-gray-300 cursor-not-allowed border-gray-100' :
                          selectedSize?.name === opt.name ? 'bg-black text-white border-black' : 'hover:border-black border-gray-200'
                        }`}
                      >
                        {opt.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* MÀU SẮC */}
              {colorVariant && (
                <div>
                  <span className="text-xs font-black uppercase tracking-widest block mb-3">Màu sắc</span>
                  <div className="flex flex-wrap gap-2">
                    {colorVariant.options.map((opt, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedColor(opt.name)}
                        className={`px-4 py-2 text-xs font-bold border transition ${
                          selectedColor === opt.name ? 'bg-black text-white border-black' : 'hover:border-black border-gray-200'
                        }`}
                      >
                        {opt.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* SỐ LƯỢNG VÀ CẢNH BÁO */}
              <div className="space-y-3">
                <div className="flex items-center gap-4 pt-4">
                  <span className="text-xs font-black uppercase tracking-widest">Số lượng</span>
                  <div className="flex items-center border border-gray-200">
                    <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-2 hover:bg-gray-50"><Minus size={16}/></button>
                    <span className="w-12 text-center font-bold">{quantity}</span>
                    <button 
                      onClick={() => {
                        const max = selectedSize ? selectedSize.stock : (product.stock || 0);
                        if (quantity < max) setQuantity(quantity + 1);
                      }} 
                      className="p-2 hover:bg-gray-50"
                    >
                      <Plus size={16}/>
                    </button>
                  </div>
                  {selectedSize && <span className="text-[10px] font-bold text-gray-400 uppercase italic">Kho: {selectedSize.stock}</span>}
                </div>

                {isLowStock && (
                  <p className="text-red-600 text-xs font-bold italic flex items-center gap-1 animate-pulse">
                    <AlertTriangle size={14} /> 🔥 Kho chỉ còn lại 1 sản phẩm cuối cùng!
                  </p>
                )}
              </div>

              {/* NÚT MUA */}
              <div className="grid grid-cols-2 gap-4 pt-6">
                <button 
                  onClick={handleAddToCart}
                  disabled={isOutOfStock || isActionLoading}
                  className="bg-black text-white py-4 font-black uppercase tracking-widest hover:bg-gray-900 transition disabled:opacity-30"
                >
                  {isOutOfStock ? 'Hết hàng' : 'Thêm vào giỏ'}
                </button>
                <button 
                  onClick={handleBuyNow}
                  disabled={isOutOfStock || isActionLoading}
                  className="border-2 border-black text-black py-4 font-black uppercase tracking-widest hover:bg-black hover:text-white transition disabled:opacity-30"
                >
                  Mua ngay
                </button>
              </div>
            </div>

            {/* SPECS */}
            <div className="mt-10 border-t border-gray-100 pt-8 space-y-4">
              <h4 className="text-sm font-black uppercase italic tracking-widest">Thông tin chi tiết</h4>
              <div className="grid grid-cols-2 gap-y-3 text-xs">
                <div className="flex justify-between pr-4 border-r border-gray-100">
                  <span className="text-gray-400">Tình trạng</span>
                  <span className="font-bold">{product.specs?.condition || 'Mới 100%'}</span>
                </div>
                <div className="flex justify-between pl-4">
                  <span className="text-gray-400">Mã sản phẩm</span>
                  <span className="font-bold uppercase">{product.specs?.styleCode || 'N/A'}</span>
                </div>
                <div className="flex justify-between pr-4 border-r border-gray-100">
                  <span className="text-gray-400">Phụ kiện</span>
                  <span className="font-bold">{product.specs?.accessories || 'Fullbox'}</span>
                </div>
                <div className="flex justify-between pl-4">
                  <span className="text-gray-400">Chất liệu</span>
                  <span className="font-bold">{product.specs?.material || 'Da/Lưới'}</span>
                </div>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed pt-4 border-t border-dashed border-gray-100">
                {product.description}
              </p>
            </div>
            
            <div className="flex gap-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest pt-8">
               <span className="flex items-center gap-1"><ShieldCheck size={14}/> Authentic 100%</span>
               <span className="flex items-center gap-1"><RotateCcw size={14}/> 7 Days Return</span>
            </div>
          </div>
        </div>

        {/* RELATED */}
        {relatedProducts.length > 0 && (
          <div className="mt-24">
            <h3 className="text-xl font-black italic uppercase mb-8 border-b-2 border-black w-fit pb-2">Sản phẩm tương tự</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {relatedProducts.map(p => <ProductCard key={p._id || p.id} product={p} />)}
            </div>
          </div>
        )}

        {/* REVIEWS SECTION */}
        <div className="mt-24 border-t border-gray-100 pt-16" id="review">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
            <div>
              <h3 className="text-3xl font-black italic uppercase tracking-tighter mb-2">Đánh giá từ khách hàng</h3>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star 
                      key={s} 
                      size={18} 
                      className={s <= Math.round(averageRating) ? "fill-yellow-400 text-yellow-400" : "text-gray-200"} 
                    />
                  ))}
                </div>
                <span className="text-sm font-bold text-gray-500 uppercase tracking-widest">
                  {averageRating.toFixed(1)} / 5 ({reviews.length} đánh giá)
                </span>
              </div>
            </div>
            
            {canReview && (
              <button 
                onClick={() => setIsReviewModalOpen(true)}
                className="bg-primary text-white px-8 py-4 font-black uppercase text-xs tracking-[0.2em] hover:bg-primary-dark transition shadow-xl shadow-primary/20 flex items-center gap-2"
              >
                <MessageSquare size={16} /> Viết đánh giá của bạn
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {reviews.length > 0 ? (
              reviews.map((rev) => (
                <div key={rev._id} className="bg-gray-50 p-8 border border-gray-100 hover:bg-white hover:shadow-xl transition-all duration-300">
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-black text-white flex items-center justify-center font-black italic uppercase text-lg">
                        {rev.isAnonymous ? 'A' : (rev.userId?.fullName || 'U').charAt(0)}
                      </div>
                      <div>
                        <p className="font-black uppercase italic tracking-tighter text-sm leading-none mb-1">
                          {rev.isAnonymous ? maskName(rev.userId?.fullName || 'Người dùng') : (rev.userId?.fullName || 'Người dùng FootMark')}
                        </p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                          {new Date(rev.createdAt).toLocaleDateString('vi-VN')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} size={12} className={s <= rev.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'} />
                      ))}
                    </div>
                  </div>
                  
                  {rev.isPurchased && (
                    <div className="inline-flex items-center gap-1 text-[9px] font-black text-green-600 mb-4 bg-green-50 px-2 py-0.5 uppercase tracking-widest">
                      <CheckCircle2 size={10} /> Đã mua hàng tại FootMark
                    </div>
                  )}
                  
                  <p className="text-gray-600 text-sm italic font-medium leading-relaxed mb-6">"{rev.comment}"</p>
                  
                  <div className="flex items-center gap-4 pt-4 border-t border-gray-200/50">
                    <button className="flex items-center gap-1.5 text-[10px] font-black text-gray-400 hover:text-primary transition uppercase tracking-widest">
                      <ThumbsUp size={12} /> Hữu ích
                    </button>
                    <button className="text-[10px] font-black text-gray-400 hover:text-black transition uppercase tracking-widest">Phản hồi</button>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full py-20 text-center bg-gray-50 border border-dashed border-gray-200">
                <MessageSquare size={48} className="mx-auto text-gray-200 mb-4" />
                <p className="text-gray-400 font-bold uppercase tracking-widest text-sm italic">Chưa có đánh giá nào cho sản phẩm này</p>
                {canReview && (
                  <button 
                    onClick={() => setIsReviewModalOpen(true)}
                    className="mt-4 text-primary font-black uppercase text-xs tracking-widest hover:underline"
                  >
                    Hãy là người đầu tiên đánh giá
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {showSizeGuide && (
        <SizeGuideModal 
          brandName={product.brand || 'FootMark'}
          isOpen={showSizeGuide}
          onClose={() => setShowSizeGuide(false)}
        />
      )}

      {isReviewModalOpen && product && (
        <ReviewModal 
          isOpen={isReviewModalOpen}
          onClose={() => setIsReviewModalOpen(false)}
          product={{
            id: productId,
            name: product.name,
            image: getImageUrl(product.image || product.images?.[0])
          }}
          onSuccess={() => {
            setFetchReviewsTrigger(prev => prev + 1);
          }}
        />
      )}
    </div>
  );
}

'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
  TrendingUp,
  Ruler
} from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import { useWishlist } from '../../contexts/WishlistContext';
import { useAuth } from '../../contexts/AuthContext';
import ProductCard from '../../../components/ProductCard';
import SizeGuideModal from '../../../components/SizeGuideModal';
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
  _id: string;
  id?: string;
  name: string;
  brand: string;
  brandId?: {
     _id: string;
     name: string;
     logo: string;
  };
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
  minPrice?: number;
  maxPrice?: number;
}

import { CLEAN_API_URL } from '@lib/shared/constants';
const API_URL = CLEAN_API_URL;

export default function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = React.use(params);
  const router = useRouter();
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

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

  // ✅ RESET SỐ LƯỢNG KHI ĐỔI SIZE
  useEffect(() => {
    if (selectedSize) {
      setQuantity(1);
    }
  }, [selectedSize]);

  const productId = product?._id || product?.id || '';
  const isFavorite = isInWishlist(productId);

  // --- FETCH DATA ---
  useEffect(() => {
    const fetchProduct = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`${API_URL}/api/products/${slug}`);
        const result = await res.json();
        const data = result.data || result;
        setProduct(data);
        
        if (data.image) setActiveImage(getImageUrl(data.image));
        else if (data.images?.length > 0) setActiveImage(getImageUrl(data.images[0]));

        // Fetch Related
        if (data.categorySlug) {
           const relRes = await fetch(`${API_URL}/api/products?category=${data.categorySlug}&exclude=${data.slug}&limit=4`);
           const relData = await relRes.json();
           setRelatedProducts(relData.data || []);
        }
      } catch (err) {
        console.error('Lỗi tải sản phẩm:', err);
      } finally {
        setIsLoading(false);
      }
    };
    if (slug) fetchProduct();
  }, [slug]);

  // --- LOGIC TÍNH TOÁN ---
  
  // Phân loại variant Size và Color
  const sizeVariant = useMemo(() => 
    product?.variants?.find(v => v.name.toLowerCase().includes('size')) || null, 
  [product]);

  const colorVariant = useMemo(() => 
    product?.variants?.find(v => v.name.toLowerCase().includes('màu') || v.name.toLowerCase().includes('color')) || null, 
  [product]);

  // Giá hiển thị động
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

  // --- ACTIONS ---
  const handleAddToCart = () => {
    if (!product) return;
    if (sizeVariant && !selectedSize) { toast.error('Vui lòng chọn Size'); return; }
    if (colorVariant && !selectedColor) { toast.error('Vui lòng chọn Màu sắc'); return; }

    setIsActionLoading(true);
    // @ts-ignore
    addToCart({ ...product, _id: productId }, quantity, selectedSize, selectedColor);
    toast.success('Đã thêm vào giỏ hàng!');
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
                <button onClick={() => toggleWishlist({ ...product, _id: productId } as any)} className="p-2 border border-gray-100">
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
                {/* Sửa lỗi dư số 0 bằng cách kiểm tra > 0 trực tiếp */}
                {Number(product.soldCount) > 0 ? (
                  <span className="text-[10px] font-bold bg-blue-50 text-primary px-2 py-1 uppercase flex items-center gap-1">
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

              {/* SỐ LƯỢNG */}
              <div className="flex items-center gap-4 pt-4">
                <span className="text-xs font-black uppercase tracking-widest">Số lượng</span>
                <div className="flex items-center border border-gray-200">
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-2 hover:bg-gray-50"><Minus size={16}/></button>
                  <span className="w-12 text-center font-bold">{quantity}</span>
                  <button 
                    onClick={() => {
                      const max = selectedSize ? selectedSize.stock : (product.stock || 0);
                      if (quantity < max) setQuantity(quantity + 1);
                      else toast.error('Vượt quá số lượng có sẵn');
                    }} 
                    className="p-2 hover:bg-gray-50"
                  >
                    <Plus size={16}/>
                  </button>
                </div>
                {selectedSize && <span className="text-[10px] font-bold text-gray-400 uppercase italic">Kho: {selectedSize.stock}</span>}
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
          </div>
        </div>

        {/* RELATED */}
        {relatedProducts.length > 0 && (
          <div className="mt-24">
            <h3 className="text-xl font-black italic uppercase mb-8 border-b-2 border-black w-fit pb-2">Sản phẩm tương tự</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {relatedProducts.map(p => <ProductCard key={p._id} product={p} />)}
            </div>
          </div>
        )}
      </div>

      {showSizeGuide && product.brandId && (
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

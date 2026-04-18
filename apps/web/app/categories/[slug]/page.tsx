"use client";
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { CLEAN_API_URL } from '@lib/shared/constants';
import { getImageUrl } from '../../../lib/imageHelper';

const API_URL = CLEAN_API_URL;

interface Product {
  _id?: string;
  id?: string;
  name: string;
  brand: string;
  price: number;
  originalPrice: number;
  rating: number;
  image: string;
  images?: string[];
  description: string;
  categorySlug?: string;
  slug?: string;
}

interface Category {
  id?: string;
  _id?: string;
  name: string;
  slug: string;
  description: string;
}

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
        
        const categoryRes = await fetch(`${API_URL}/api/categories/${categorySlug}`);
        if (!categoryRes.ok) throw new Error('Không tìm thấy danh mục');
        const categoryData = await categoryRes.json();
        setCategory(categoryData.data || categoryData);
        
        const productsRes = await fetch(`${API_URL}/api/products?category=${categorySlug}`);
        if (!productsRes.ok) throw new Error('Không thể kết nối đến server');
        const productsData = await productsRes.json();
        setProducts(productsData.data || productsData);
        
      } catch (err) {
        console.error(`Error:`, err);
        setError(err instanceof Error ? err.message : 'Lỗi tải dữ liệu');
      } finally {
        setIsLoading(false);
      }
    };

    if (categorySlug) fetchCategoryAndProducts();
  }, [categorySlug]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  if (isLoading) return <div className="container mx-auto px-4 py-8 animate-pulse"><div className="h-10 bg-gray-100 w-64 mb-8"></div><div className="grid grid-cols-2 lg:grid-cols-4 gap-6">{[...Array(8)].map((_, i) => <div key={i} className="h-80 bg-gray-100 rounded-2xl"></div>)}</div></div>;

  if (error) return <div className="container mx-auto px-4 py-20 text-center"><div className="bg-red-50 text-red-600 p-8 rounded-2xl inline-block">Danh mục không tồn tại hoặc đã bị xóa.</div></div>;

  return (
    <div className="container mx-auto px-4 py-12 min-h-screen">
      {category && (
        <div className="mb-12 border-b border-gray-100 pb-8">
          <h1 className="text-4xl font-black italic uppercase tracking-tighter text-black mb-2">{category.name}</h1>
          <p className="text-gray-500 font-medium">{category.description}</p>
          <div className="mt-4 text-[10px] font-black uppercase tracking-widest text-gray-400">FOUND {products.length} ITEMS</div>
        </div>
      )}
      
      {products.length > 0 ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 xl:gap-10">
          {products.map(product => (
            <div 
              key={product._id || product.id} 
              onClick={() => router.push(`/products/${product.slug || product.id}`)}
              className="bg-white group cursor-pointer"
            >
              <div className="relative aspect-square overflow-hidden bg-gray-50 mb-4 rounded-xl">
                <img 
                  src={getImageUrl(product)} 
                  alt={product.name} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                {product.originalPrice > product.price && (
                  <span className="absolute top-3 left-3 bg-red-600 text-white text-[10px] font-black px-2 py-1 uppercase">SALE</span>
                )}
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{product.brand}</p>
                <h3 className="font-bold text-gray-900 mb-2 line-clamp-1 group-hover:text-primary transition uppercase italic">{product.name}</h3>
                <div className="flex items-center gap-3">
                  <span className="text-lg font-black text-black">{formatCurrency(product.price)}</span>
                  {product.originalPrice > product.price && (
                    <span className="text-xs text-gray-400 line-through">{formatCurrency(product.originalPrice)}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-32 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
          <p className="text-gray-400 font-bold uppercase tracking-widest">No products found in this category</p>
        </div>
      )}
    </div>
  );
}

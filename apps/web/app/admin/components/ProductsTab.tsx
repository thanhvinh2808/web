// app/admin/components/ProductsTab.tsx
'use client';
import React, { useState, useMemo, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { API_URL } from '../config/constants';
import ProductModal from './ProductModal';

// ✅ ĐỊNH NGHĨA TYPES CHUẨN - ĐỒNG BỘ VỚI BACKEND VIRTUALS
interface ProductSpecs {
  condition?: string;
  accessories?: string;
  material?: string;
  styleCode?: string;
}

interface VariantOption {
  name: string;
  price: number;
  stock: number;
  soldCount?: number; 
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
  tags?: string[];
  specs?: ProductSpecs;
  stock?: number;
  soldCount?: number;
  totalStock?: number;    
  totalSoldCount?: number; 
  createdAt?: string;      
  isNew?: boolean;
  hasPromotion?: boolean;
  variants?: Variant[];
}

interface Category {
  id?: string;
  _id?: string;
  name: string;
  slug: string;
}

interface ProductsTabProps {
  products: Product[];
  categories: Category[];
  token: string;
  onRefresh: () => void;
  showMessage: (msg: string) => void;
}

export default function ProductsTab({ 
  products, 
  categories, 
  token, 
  onRefresh, 
  showMessage 
}: ProductsTabProps) {
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ✅ Helper function để lấy URL ảnh
  const getImageUrl = (product: Product): string => {
    const BASE_URL = API_URL.replace(/\/api\/?$/, '') || API_URL;
    let rawUrl: any = '';

    if (product.images && Array.isArray(product.images) && product.images.length > 0) {
      rawUrl = product.images[0];
    } else if (product.image) {
      rawUrl = product.image;
    }
    
    const url = typeof rawUrl === 'string' ? rawUrl : (rawUrl?.url || '');

    if (!url || url.includes('[object')) {
      return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIzMiIgZmlsbD0iI2QxZDVkYiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPvCfk7c8L3RleHQ+PC9zdmc+';
    }

    if (url.startsWith('http') || url.startsWith('data:')) return url;
    return `${BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  // ✅ Lọc sản phẩm theo tìm kiếm và danh mục + SẮP XẾP MỚI NHẤT
  const filteredProducts = useMemo(() => {
    const filtered = products.filter(product => {
      const matchSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (product.brand || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (product.description || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchCategory = !selectedCategory || product.categorySlug === selectedCategory;
      return matchSearch && matchCategory;
    });

    return [...filtered].sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });
  }, [products, searchTerm, selectedCategory]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProducts = filteredProducts.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory, itemsPerPage]);

  const handleAdd = () => {
    setEditingProduct(null);
    setShowProductModal(true);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setShowProductModal(true);
  };

  const generateSlug = (name: string, isEdit: boolean = false): string => {
    const baseSlug = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[đĐ]/g, 'd').replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim();
    if (!isEdit) return `${baseSlug}-${Date.now()}`;
    return baseSlug;
  };

  const handleProductSubmit = async (formData: Partial<Product>) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const hasVariants = formData.variants && formData.variants.length > 0;
      const productData = {
        ...formData,
        price: Number(formData.price),
        originalPrice: formData.originalPrice ? Number(formData.originalPrice) : 0,
        stock: hasVariants ? undefined : Number(formData.stock || 0),
        soldCount: hasVariants ? undefined : Number(formData.soldCount || 0),
        slug: editingProduct ? editingProduct.slug : generateSlug(formData.name || '', false),
      };
      const url = editingProduct ? `${API_URL}/api/admin/products/${editingProduct.slug}` : `${API_URL}/api/admin/products`;
      const res = await fetch(url, {
        method: editingProduct ? 'PUT' : 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(productData)
      });
      const data = await res.json();
      if (data.success) {
        showMessage(editingProduct ? '✅ Cập nhật thành công!' : '✅ Thêm mới thành công!');
        setShowProductModal(false);
        onRefresh();
      } else {
        showMessage(`❌ ${data.message}`);
      }
    } catch (error) {
      showMessage('❌ Lỗi kết nối server');
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteProduct = async (productSlug: string) => {
    if (!window.confirm('⚠️ Xác nhận xóa sản phẩm này?')) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/products/${productSlug}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) { showMessage('✅ Đã xóa'); onRefresh(); }
    } catch (error) { showMessage('❌ Lỗi xóa'); }
  };

  const renderProductInfo = (product: Product) => {
    return (
      <div className="mt-1 space-y-1">
        <div className="flex flex-wrap gap-2 text-xs">
          {product.specs?.condition && (
            <span className={`px-2 py-0.5 rounded border ${product.specs.condition === 'New' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-gray-50 border-gray-200 text-gray-700'}`}>
              {product.specs.condition}
            </span>
          )}
          {product.specs?.accessories && (
            <span className="px-2 py-0.5 rounded bg-gray-50 border border-gray-200 text-gray-600">
              {product.specs.accessories}
            </span>
          )}
        </div>
        {product.variants && product.variants.length > 0 && (
          <div className="text-xs text-purple-600 font-medium">
            {product.variants.map((v) => v.name).join(', ')} ({product.variants.reduce((acc, v) => acc + v.options.length, 0)} options)
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-black italic tracking-tighter text-black">🛍️ Quản lý Sản Phẩm</h2>
        <button
          onClick={handleAdd}
          className="px-6 py-2 bg-black text-white rounded-lg font-bold uppercase tracking-wider hover:bg-stone-800 transition shadow-lg"
        >
          ➕ Thêm mới
        </button>
      </div>

      {/* Thanh tìm kiếm và bộ lọc */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6 border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">🔍 Tìm kiếm</label>
            <input
              type="text"
              placeholder="Tìm theo tên, thương hiệu, mã giày..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 bg-gray-50 border-none rounded-lg focus:ring-2 focus:ring-black outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">📁 Danh mục</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-4 py-2 bg-gray-50 border-none rounded-lg focus:ring-2 focus:ring-black outline-none"
            >
              <option value="">Tất cả</option>
              {categories.map((cat) => (
                <option key={cat.id || cat._id} value={cat.slug}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <p className="text-sm text-gray-600">
            Hiển thị <span className="font-bold">{filteredProducts.length}</span> sản phẩm
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 rounded font-bold text-xs uppercase transition ${viewMode === 'list' ? 'bg-black text-white' : 'bg-gray-100 text-gray-500'}`}
            >
              List
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1 rounded font-bold text-xs uppercase transition ${viewMode === 'grid' ? 'bg-black text-white' : 'bg-gray-100 text-gray-500'}`}
            >
              Grid
            </button>
          </div>
        </div>
      </div>

      {/* Hiển thị sản phẩm */}
      {viewMode === 'list' ? (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-100">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Hình ảnh</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Thông tin</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Thương hiệu</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Giá bán</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Tồn kho</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Tags</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {currentProducts.map((product) => {
                  const currentStock = product.totalStock ?? product.stock ?? 0;
                  return (
                    <tr key={product.id || product._id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3">
                        <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                          <img
                            src={getImageUrl(product)}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-bold text-gray-900">{product.name}</div>
                        {renderProductInfo(product)}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-600">{product.brand || '-'}</td>
                      <td className="px-4 py-3">
                        <div className="font-bold text-black">
                          {Number(product.price).toLocaleString()}₫
                        </div>
                        {product.originalPrice && product.originalPrice > product.price && (
                          <div className="text-xs text-gray-400 line-through">
                            {Number(product.originalPrice).toLocaleString()}₫
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-bold ${
                          currentStock > 10 ? 'bg-green-100 text-green-800' : 
                          currentStock > 0 ? 'bg-yellow-100 text-yellow-800' : 
                          'bg-red-100 text-red-800'
                        }`}>
                          {currentStock}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1 max-w-[150px]">
                          {product.tags?.map((tag, i) => (
                            <span key={i} className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-700 uppercase border border-gray-200">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2 justify-center">
                          <button
                            onClick={() => handleEdit(product)}
                            className="px-3 py-1 bg-gray-100 text-gray-600 rounded hover:bg-black hover:text-white text-xs font-bold uppercase transition"
                          >
                            Sửa
                          </button>
                          <button
                            onClick={() => deleteProduct(product.slug || '')}
                            className="px-3 py-1 bg-gray-100 text-red-500 rounded hover:bg-red-500 hover:text-white text-xs font-bold uppercase transition"
                          >
                            Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {currentProducts.map((product) => {
            const currentStock = product.totalStock ?? product.stock ?? 0;
            return (
              <div key={product.id || product._id} className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-xl transition group">
                <div className="relative aspect-square bg-gray-100">
                  <img 
                    src={getImageUrl(product)} 
                    alt={product.name} 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-gray-900 mb-1 line-clamp-1">{product.name}</h3>
                  <p className="text-xs text-gray-500 mb-3">{product.brand}</p>
                  <div className="flex justify-between items-end mb-4">
                     <div>
                        <span className="block text-lg font-black text-black">{Number(product.price).toLocaleString()}₫</span>
                        {product.originalPrice && product.originalPrice > product.price && (
                          <span className="text-xs text-gray-400 line-through">{Number(product.originalPrice).toLocaleString()}₫</span>
                        )}
                     </div>
                     <div className="text-right">
                        <span className="text-[10px] font-bold text-gray-400 uppercase block">Kho</span>
                        <span className="font-bold">{currentStock}</span>
                     </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(product)}
                      className="flex-1 py-2 bg-gray-100 text-black rounded font-bold text-xs uppercase hover:bg-black hover:text-white transition"
                    >
                      Sửa
                    </button>
                    <button
                      onClick={() => deleteProduct(product.slug || '')}
                      className="flex-1 py-2 bg-red-50 text-red-600 rounded font-bold text-xs uppercase hover:bg-red-600 hover:text-white transition"
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Phân trang */}
      {totalPages > 1 && (
        <div className="mt-8 flex justify-center items-center gap-2">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className={`w-10 h-10 flex items-center justify-center rounded-lg font-bold transition ${
              currentPage === 1 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : 'bg-white border border-gray-200 text-black hover:bg-black hover:text-white'
            }`}
          >
            <ChevronLeft size={20} />
          </button>
          
          <div className="flex gap-2">
            {[...Array(totalPages)].map((_, i) => {
              const pageNum = i + 1;
              const isFirst = pageNum === 1;
              const isLast = pageNum === totalPages;
              const isNear = Math.abs(pageNum - currentPage) <= 1;
              const isEllipsis = pageNum === currentPage - 2 || pageNum === currentPage + 2;

              if (isFirst || isLast || isNear) {
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-10 h-10 rounded-lg font-bold text-xs transition ${
                      currentPage === pageNum
                        ? 'bg-black text-white shadow-lg scale-110'
                        : 'bg-white border border-gray-200 text-black hover:bg-gray-100'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              } else if (isEllipsis) {
                return <span key={pageNum} className="w-10 h-10 flex items-center justify-center text-gray-400 font-bold">...</span>;
              }
              return null;
            })}
          </div>

          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className={`w-10 h-10 flex items-center justify-center rounded-lg font-bold transition ${
              currentPage === totalPages 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : 'bg-white border border-gray-200 text-black hover:bg-black hover:text-white'
            }`}
          >
            <ChevronRight size={20} />
          </button>
        </div>
      )}

      <ProductModal
        isOpen={showProductModal}
        onClose={() => {
          setShowProductModal(false);
          setEditingProduct(null);
        }}
        onSubmit={handleProductSubmit}
        product={editingProduct}
        categories={categories}
        isLoading={isSubmitting}
        token={token}
      />
    </div>
  );
}

// app/admin/components/ProductsTab.tsx
'use client';
import React, { useState, useMemo, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { API_URL } from '../config/constants';
import ProductModal from './ProductModal';

// ✅ ĐỊNH NGHĨA TYPES CHUẨN - ĐỒNG BỘ VỚI ProductModal (FootMark)
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
    const BASE_URL = (API_URL || `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}`).replace('/api', '');
    
    // Ưu tiên images array
    if (product.images && Array.isArray(product.images) && product.images.length > 0) {
      const firstImage = product.images[0];
      if (typeof firstImage === 'string') {
        if (firstImage.startsWith('http')) return firstImage;
        return `${BASE_URL}${firstImage.startsWith('/') ? '' : '/'}${firstImage}`;
      }
    }
    // Fallback về image (string)
    if (product.image && typeof product.image === 'string') {
      if (product.image.startsWith('http')) return product.image;
      return `${BASE_URL}${product.image.startsWith('/') ? '' : '/'}${product.image}`;
    }
    
    // Default placeholder
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIzMiIgZmlsbD0iI2QxZDVkYiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPvCfk7c8L3RleHQ+PC9zdmc+';
  };


  // ✅ Lọc sản phẩm theo tìm kiếm và danh mục
  const filteredProducts = useMemo(() => {
    const filtered = products.filter(product => {
      const matchSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (product.brand || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (product.description || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchCategory = !selectedCategory || product.categorySlug === selectedCategory;
      return matchSearch && matchCategory;
    });

    // ✅ Sắp xếp sản phẩm mới nhất lên đầu
    return [...filtered].sort((a, b) => {
      // 1. So sánh theo createdAt (Nếu không có, giả định là cực mới)
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : Date.now() + 10000;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : Date.now() + 10000;
      
      if (dateB !== dateA) return dateB - dateA;
      
      // 2. Dự phòng: So sánh theo _id (MongoDB _id contains timestamp)
      const idA = a._id || '';
      const idB = b._id || '';
      return idB.localeCompare(idA);
    });
  }, [products, searchTerm, selectedCategory]);

  // ✅ Phân trang
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProducts = filteredProducts.slice(startIndex, endIndex);

  // Reset trang khi filter thay đổi
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory, itemsPerPage]);

  // ✅ MỞ MODAL THÊM MỚI
  const handleAdd = () => {
    setEditingProduct(null);
    setShowProductModal(true);
  };

  // ✅ MỞ MODAL CHỈNH SỬA
  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setShowProductModal(true);
  };

  // ✅ HÀM TẠO SLUG
  const generateSlug = (name: string, isEdit: boolean = false): string => {
    const baseSlug = name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[đĐ]/g, 'd')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
    
    // Chỉ thêm timestamp khi thêm mới (không phải edit)
    if (!isEdit) {
      const timestamp = Date.now();
      return `${baseSlug}-${timestamp}`;
    }
    
    return baseSlug;
  };

  // ✅ XỬ LÝ SUBMIT SẢN PHẨM
  const handleProductSubmit = async (formData: Partial<Product>) => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      // Validation
      if (!formData.name || !formData.price || !formData.categorySlug) {
        showMessage('❌ Vui lòng điền đầy đủ thông tin bắt buộc!');
        setIsSubmitting(false);
        return;
      }

      // Tạo slug
      const slug = editingProduct 
        ? editingProduct.slug 
        : generateSlug(formData.name, false);
      
      console.log('📝 Generated slug:', slug);
      
      // ✅ Xử lý images: lấy URL từ formData.images array
      const imageUrl = formData.images && formData.images.length > 0 
        ? formData.images[0] 
        : '';

      // ✅ Chuẩn bị dữ liệu gửi lên server
      const productData = {
        name: formData.name,
        brand: formData.brand || '',
        price: parseFloat(String(formData.price)),
        originalPrice: formData.originalPrice 
          ? parseFloat(String(formData.originalPrice)) 
          : parseFloat(String(formData.price)),
        rating: parseFloat(String(formData.rating || 5)),
        image: imageUrl, // Single image (backward compatible)
        images: formData.images || (imageUrl ? [imageUrl] : []), // Array images
        description: formData.description || '',
        categorySlug: formData.categorySlug,
        slug: slug,
        tags: formData.tags || [],
        // ✅ Cập nhật specs theo chuẩn FootMark
        specs: {
          condition: formData.specs?.condition || 'New',
          accessories: formData.specs?.accessories || 'Fullbox',
          material: formData.specs?.material || '',
          styleCode: formData.specs?.styleCode || ''
        },
        stock: parseInt(String(formData.stock || 0)),
        soldCount: parseInt(String(formData.soldCount || 0)),
        isNew: formData.isNew || false,
        hasPromotion: formData.hasPromotion || false,
        variants: formData.variants || []
      };
      
      console.log('📤 Sending product data:', productData);
      
      // ✅ Gọi API
      const url = editingProduct
        ? `${API_URL}/admin/products/${editingProduct.slug}`
        : `${API_URL}/admin/products`;
      
      const method = editingProduct ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(productData)
      });
      
      const data = await res.json();
      
      if (data.success) {
        showMessage(editingProduct 
          ? '✅ Cập nhật sản phẩm thành công!' 
          : '✅ Thêm sản phẩm thành công!');
        setShowProductModal(false);
        setEditingProduct(null);
        await onRefresh();
      } else {
        showMessage(`❌ ${data.message || 'Có lỗi xảy ra'}`);
      }
    } catch (error) {
      console.error('❌ Error submitting product:', error);
      showMessage('❌ Lỗi kết nối server');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ✅ XÓA SẢN PHẨM
  const deleteProduct = async (productSlug: string) => {
    if (!window.confirm('⚠️ Bạn có chắc muốn xóa sản phẩm này?')) return;
    
    try {
      const res = await fetch(`${API_URL}/admin/products/${productSlug}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const data = await res.json();
      
      if (data.success) {
        showMessage('✅ Xóa sản phẩm thành công!');
        onRefresh();
      } else {
        showMessage(`❌ ${data.message || 'Lỗi khi xóa sản phẩm'}`);
      }
    } catch (error) {
      console.error('❌ Error deleting product:', error);
      showMessage('❌ Lỗi khi xóa sản phẩm');
    }
  };

  // ✅ Helper: Hiển thị thông tin variants & specs
  const renderProductInfo = (product: Product) => {
    return (
      <div className="mt-1 space-y-1">
        {/* Specs FootMark */}
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
        
        {/* Variants */}
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
              📋 List
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1 rounded font-bold text-xs uppercase transition ${viewMode === 'grid' ? 'bg-black text-white' : 'bg-gray-100 text-gray-500'}`}
            >
              ⊞ Grid
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
                {currentProducts.map((product) => (
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
                        {parseInt(product.price.toString()).toLocaleString()}₫
                      </div>
                      {product.originalPrice && product.originalPrice > product.price && (
                        <div className="text-xs text-gray-400 line-through">
                          {parseInt(product.originalPrice.toString()).toLocaleString()}₫
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-bold ${
                        (product.stock || 0) > 10 ? 'bg-green-100 text-green-800' : 
                        (product.stock || 0) > 0 ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-red-100 text-red-800'
                      }`}>
                        {product.stock || 0}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1 max-w-[150px]">
                        {product.tags && product.tags.length > 0 ? (
                          product.tags.map((tag, i) => (
                            <span key={i} className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-700 uppercase border border-gray-200">
                              {tag}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-300 text-[10px] italic">None</span>
                        )}
                        {product.isNew && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 uppercase">
                            New
                          </span>
                        )}
                        {product.hasPromotion && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800 uppercase">
                            Sale
                          </span>
                        )}
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
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {currentProducts.map((product) => (
            <div key={product.id || product._id} className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-xl transition group">
              <div className="relative aspect-square bg-gray-100">
                <img 
                  src={getImageUrl(product)} 
                  alt={product.name} 
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 right-2 flex flex-col gap-1">
                  {product.specs?.condition && (
                    <span className="bg-black/80 text-white text-[10px] font-bold px-2 py-1 rounded backdrop-blur">
                      {product.specs.condition}
                    </span>
                  )}
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-bold text-gray-900 mb-1 line-clamp-1">{product.name}</h3>
                <p className="text-xs text-gray-500 mb-3">{product.brand}</p>
                <div className="flex justify-between items-end mb-4">
                   <div>
                      <span className="block text-lg font-black text-black">{parseInt(product.price.toString()).toLocaleString()}₫</span>
                      {product.originalPrice && product.originalPrice > product.price && (
                        <span className="text-xs text-gray-400 line-through">{parseInt(product.originalPrice.toString()).toLocaleString()}₫</span>
                      )}
                   </div>
                   <div className="text-right">
                      <span className="text-[10px] font-bold text-gray-400 uppercase block">Kho</span>
                      <span className="font-bold">{product.stock}</span>
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
          ))}
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

      {/* ✅ PRODUCT MODAL */}
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

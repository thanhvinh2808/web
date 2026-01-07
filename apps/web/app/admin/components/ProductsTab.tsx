// app/admin/components/ProductsTab.tsx
'use client';
import React, { useState, useMemo, useEffect } from 'react';
import { API_URL } from '../config/constants';
import ProductModal from './ProductModal';

// ✅ ĐỊNH NGHĨA TYPES CHUẨN - ĐỒNG BỘ VỚI ProductModal
interface ProductSpecs {
  screen?: string;
  chip?: string;
  ram?: string;
  storage?: string;
  camera?: string;
  battery?: string;
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
    // Ưu tiên images array
    if (product.images && Array.isArray(product.images) && product.images.length > 0) {
      const firstImage = product.images[0];
      if (typeof firstImage === 'string') {
        return firstImage;
      }
    }
    // Fallback về image (string)
    if (product.image && typeof product.image === 'string') {
      return product.image;
    }
    
    // Default placeholder
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIzMiIgZmlsbD0iI2QxZDVkYiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPvCfk7c8L3RleHQ+PC9zdmc+';
  };

  // ✅ Lọc sản phẩm theo tìm kiếm và danh mục
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (product.brand || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (product.description || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchCategory = !selectedCategory || product.categorySlug === selectedCategory;
      return matchSearch && matchCategory;
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

  // ✅ XỬ LÝ SUBMIT SẢN PHẨM - ĐỒNG BỘ VỚI ProductModal
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

      // ✅ Chuẩn bị dữ liệu gửi lên server - BAO GỒM VARIANTS
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
        specs: {
          screen: formData.specs?.screen || '',
          chip: formData.specs?.chip || '',
          ram: formData.specs?.ram || '',
          storage: formData.specs?.storage || '',
          camera: formData.specs?.camera || '',
          battery: formData.specs?.battery || ''
        },
        stock: parseInt(String(formData.stock || 0)),
        soldCount: parseInt(String(formData.soldCount || 0)),
        isNew: formData.isNew || false,
        hasPromotion: formData.hasPromotion || false,
        variants: formData.variants || [] // ✅ THÊM VARIANTS
      };
      
      console.log('📤 Sending product data:', productData);
      console.log('🎨 Variants:', productData.variants);
      
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
        
        // ✅ Refresh data để hiển thị sản phẩm mới
        await onRefresh();
        
        console.log('✅ Product saved and refreshed:', data.data);
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

  // ✅ Helper: Hiển thị thông tin variants
  const renderVariantsInfo = (product: Product) => {
    if (!product.variants || product.variants.length === 0) return null;
    
    return (
      <div className="mt-2 text-xs">
        <span className="font-medium text-purple-600">🎨 {product.variants.length} biến thể:</span>
        {product.variants.map((variant, idx) => (
          <span key={idx} className="ml-2 text-gray-600">
            {variant.name} ({variant.options.length})
          </span>
        ))}
      </div>
    );
  };

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">🛍️ Quản lý Products</h2>
        <button
          onClick={handleAdd}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          ➕ Thêm sản phẩm
        </button>
      </div>

      {/* Thanh tìm kiếm và bộ lọc */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-2">🔍 Tìm kiếm sản phẩm</label>
            <input
              type="text"
              placeholder="Tìm theo tên, thương hiệu, mô tả..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">📁 Lọc theo danh mục</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="">Tất cả danh mục</option>
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
            Hiển thị <span className="font-semibold">{startIndex + 1}-{Math.min(endIndex, filteredProducts.length)}</span> trong <span className="font-semibold">{filteredProducts.length}</span> sản phẩm
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 rounded transition ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
            >
              📋 Danh sách
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1 rounded transition ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
            >
              ⊞ Lưới
            </button>
          </div>
        </div>
      </div>

      {/* Hiển thị sản phẩm */}
      {viewMode === 'list' ? (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Hình ảnh</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Tên sản phẩm</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Thương hiệu</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Giá</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Tồn kho</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Đã bán</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Trạng thái</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {currentProducts.map((product) => (
                  <tr key={product.id || product._id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3">
                      <img
                        src={getImageUrl(product)}
                        alt={product.name}
                        className="w-16 h-16 object-cover rounded"
                        onError={(e: any) => {
                          e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIzMiIgZmlsbD0iI2QxZDVkYiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPvCfk7c8L3RleHQ+PC9zdmc+';
                        }}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{product.name}</div>
                      <div className="text-sm text-gray-500 line-clamp-1">{product.description}</div>
                      {renderVariantsInfo(product)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{product.brand || '-'}</td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-blue-600">
                        {parseInt(product.price.toString()).toLocaleString()}₫
                      </div>
                      {product.originalPrice && product.originalPrice > product.price && (
                        <div className="text-xs text-gray-400 line-through">
                          {parseInt(product.originalPrice.toString()).toLocaleString()}₫
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        (product.stock || 0) > 10 ? 'bg-green-100 text-green-800' : 
                        (product.stock || 0) > 0 ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-red-100 text-red-800'
                      }`}>
                        {product.stock || 0}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{product.soldCount || 0}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        {product.isNew && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            ✨ Mới
                          </span>
                        )}
                        {product.hasPromotion && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            🎁 KM
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2 justify-center">
                        <button
                          onClick={() => handleEdit(product)}
                          className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 text-sm transition"
                          title="Sửa"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => deleteProduct(product.slug || '')}
                          className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm transition"
                          title="Xóa"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredProducts.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg">📦 Không tìm thấy sản phẩm nào</p>
              <p className="text-sm mt-2">Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc</p>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {currentProducts.map((product) => (
            <div key={product.id || product._id} className="bg-white border rounded-lg overflow-hidden hover:shadow-lg transition">
              <img 
                src={getImageUrl(product)} 
                alt={product.name} 
                className="w-full h-48 object-cover"
                onError={(e: any) => {
                  e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2YzZjRmNiIvPjx0ZXh0IHg9IjUwJSIgeT0iNDUlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iNDgiIGZpbGw9IiNkMWQ1ZGIiIHRleHQtYW5jaG9yPSJtaWRkbGUiPvCfk7c8L3RleHQ+PHRleHQgeD0iNTAlIiB5PSI2MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iI2ExYTVhYiIgdGV4dC1hbmNob3I9Im1pZGRsZSI+RXJyb3I8L3RleHQ+PC9zdmc+';
                }}
              />
              <div className="p-4">
                <h3 className="font-semibold text-lg mb-2 line-clamp-1">{product.name}</h3>
                <p className="text-sm text-gray-600 mb-2 line-clamp-2">{product.description}</p>
                {renderVariantsInfo(product)}
                <div className="flex justify-between items-center mb-3 mt-3">
                  <span className="text-xl font-bold text-blue-600">{parseInt(product.price.toString()).toLocaleString()}₫</span>
                  <span className="text-sm text-gray-500">Kho: {product.stock || 0}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(product)}
                    className="flex-1 px-3 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 text-sm transition"
                  >
                    ✏️ Sửa
                  </button>
                  <button
                    onClick={() => deleteProduct(product.slug || '')}
                    className="flex-1 px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm transition"
                  >
                    🗑️ Xóa
                  </button>
                </div>
              </div>
            </div>
          ))}
          {filteredProducts.length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-500">
              <p className="text-lg">📦 Không tìm thấy sản phẩm nào</p>
              <p className="text-sm mt-2">Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc</p>
            </div>
          )}
        </div>
      )}

      {/* Phân trang */}
      {filteredProducts.length > itemsPerPage && (
        <div className="mt-6 flex justify-center items-center gap-2">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              currentPage === 1
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            ← Trước
          </button>

          <div className="flex gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
              if (
                page === 1 ||
                page === totalPages ||
                (page >= currentPage - 1 && page <= currentPage + 1)
              ) {
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-4 py-2 rounded-lg font-medium min-w-[40px] transition ${
                      currentPage === page
                        ? 'bg-blue-600 text-white'
                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                );
              } else if (page === currentPage - 2 || page === currentPage + 2) {
                return (
                  <span key={page} className="px-2 py-2 text-gray-400">
                    ...
                  </span>
                );
              }
              return null;
            })}
          </div>

          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              currentPage === totalPages
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            Sau →
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
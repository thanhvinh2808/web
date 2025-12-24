// app/admin/components/ProductModal.tsx
'use client';
import React, { useState, useEffect } from 'react';

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

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (productData: Partial<Product>) => Promise<void>;
  product?: Product | null;
  categories: Category[];
  isLoading?: boolean;
  token: string;
}

export default function ProductModal({
  isOpen,
  onClose,
  onSubmit,
  product,
  categories,
  isLoading = false,
  token
}: ProductModalProps) {
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    brand: '',
    description: '',
    price: 0,
    originalPrice: 0,
    rating: 5,
    categorySlug: '',
    stock: 0,
    soldCount: 0,
    isNew: false,
    hasPromotion: false,
    images: [],
    variants: [],
    specs: {
      screen: '',
      chip: '',
      ram: '',
      storage: '',
      camera: '',
      battery: ''
    }
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>('');
  
  // ✅ STATE CHO VARIANTS MỚI - HỖ TRỢ COMBO
  const [variants, setVariants] = useState<Variant[]>([]);
  const [editingVariantIndex, setEditingVariantIndex] = useState<number>(-1);
  
  // State cho form thêm/sửa variant
  const [variantFormData, setVariantFormData] = useState({
    name: '',
    options: [{ name: '', price: 0, stock: 0, sku: '', image: '' }]
  });

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        brand: product.brand || '',
        description: product.description || '',
        price: product.price || 0,
        originalPrice: product.originalPrice || 0,
        rating: product.rating || 5,
        categorySlug: product.categorySlug || '',
        stock: product.stock || 0,
        soldCount: product.soldCount || 0,
        isNew: product.isNew || false,
        hasPromotion: product.hasPromotion || false,
        images: product.images || (product.image ? [product.image] : []),
        variants: product.variants || [],
        specs: {
          screen: product.specs?.screen || '',
          chip: product.specs?.chip || '',
          ram: product.specs?.ram || '',
          storage: product.specs?.storage || '',
          camera: product.specs?.camera || '',
          battery: product.specs?.battery || ''
        }
      });
      
      if (product.variants && product.variants.length > 0) {
        setVariants(product.variants);
      }
      
      if (product.images && product.images.length > 0) {
        setImagePreview(product.images[0]);
      } else if (product.image) {
        setImagePreview(product.image);
      }
    } else {
      setFormData({
        name: '',
        brand: '',
        description: '',
        price: 0,
        originalPrice: 0,
        rating: 5,
        categorySlug: '',
        stock: 0,
        soldCount: 0,
        isNew: false,
        hasPromotion: false,
        images: [],
        variants: [],
        specs: {
          screen: '',
          chip: '',
          ram: '',
          storage: '',
          camera: '',
          battery: ''
        }
      });
      setImagePreview('');
      setVariants([]);
    }
    setErrors({});
    setEditingVariantIndex(-1);
    setVariantFormData({
      name: '',
      options: [{ name: '', price: 0, stock: 0, sku: '', image: '' }]
    });
  }, [product, isOpen]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name?.trim()) {
      newErrors.name = 'Tên sản phẩm không được để trống';
    }

    if (!formData.categorySlug) {
      newErrors.categorySlug = 'Vui lòng chọn danh mục';
    }

    if (!formData.price || formData.price <= 0) {
      newErrors.price = 'Giá phải lớn hơn 0';
    }

    if (formData.originalPrice && formData.originalPrice < (formData.price || 0)) {
      newErrors.originalPrice = 'Giá gốc phải lớn hơn hoặc bằng giá bán';
    }

    if (formData.stock && formData.stock < 0) {
      newErrors.stock = 'Số lượng không được âm';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      alert('Chỉ chấp nhận file ảnh (JPG, PNG, GIF, WEBP)');
      return;
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      alert('Kích thước file không được vượt quá 5MB');
      return;
    }

    setUploadingImage(true);

    try {
      const uploadFormData = new FormData();
      uploadFormData.append('image', file);

      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      
      const response = await fetch(`${API_URL}/upload/single`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: uploadFormData
      });

      const data = await response.json();

      if (data.success) {
        const imageUrl = `${API_URL}${data.data.url}`;
        
        setFormData(prev => ({
          ...prev,
          images: [imageUrl]
        }));
        
        setImagePreview(imageUrl);
        console.log('✅ Upload ảnh thành công:', imageUrl);
      } else {
        alert('Lỗi upload: ' + data.message);
      }
    } catch (error) {
      console.error('❌ Upload error:', error);
      alert('Không thể upload ảnh. Vui lòng thử lại.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRemoveImage = () => {
    setFormData(prev => ({
      ...prev,
      images: []
    }));
    setImagePreview('');
  };

  // ✅ XỬ LÝ VARIANT OPTIONS
  const addVariantOption = () => {
    setVariantFormData({
      ...variantFormData,
      options: [...variantFormData.options, { name: '', price: 0, stock: 0, sku: '', image: '' }]
    });
  };

  const updateVariantOption = (index: number, field: keyof VariantOption, value: string | number) => {
    const newOptions = [...variantFormData.options];
    newOptions[index] = { ...newOptions[index], [field]: value };
    setVariantFormData({ ...variantFormData, options: newOptions });
  };

  const removeVariantOption = (index: number) => {
    if (variantFormData.options.length > 1) {
      setVariantFormData({
        ...variantFormData,
        options: variantFormData.options.filter((_, i) => i !== index)
      });
    }
  };

  // ✅ UPLOAD ẢNH CHO VARIANT OPTION
  const handleVariantImageUpload = async (optionIndex: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      alert('Chỉ chấp nhận file ảnh (JPG, PNG, GIF, WEBP)');
      return;
    }

    try {
      const uploadFormData = new FormData();
      uploadFormData.append('image', file);

      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      
      const response = await fetch(`${API_URL}/upload/single`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: uploadFormData
      });

      const data = await response.json();

      if (data.success) {
        const imageUrl = `${API_URL}${data.data.url}`;
        updateVariantOption(optionIndex, 'image', imageUrl);
      } else {
        alert('Lỗi upload: ' + data.message);
      }
    } catch (error) {
      console.error('❌ Upload error:', error);
      alert('Không thể upload ảnh. Vui lòng thử lại.');
    }
  };

  const saveVariant = () => {
    if (!variantFormData.name.trim()) {
      alert('Vui lòng nhập tên biến thể (VD: Màu sắc, Dung lượng)');
      return;
    }

    const validOptions = variantFormData.options.filter(opt => opt.name.trim());
    if (validOptions.length === 0) {
      alert('Vui lòng thêm ít nhất 1 tùy chọn cho biến thể');
      return;
    }

    const newVariant = {
      ...variantFormData,
      options: validOptions
    };

    if (editingVariantIndex >= 0) {
      // Cập nhật variant đang sửa
      const updatedVariants = [...variants];
      updatedVariants[editingVariantIndex] = newVariant;
      setVariants(updatedVariants);
    } else {
      // Thêm variant mới
      setVariants([...variants, newVariant]);
    }

    // Reset form
    setVariantFormData({
      name: '',
      options: [{ name: '', price: 0, stock: 0, sku: '', image: '' }]
    });
    setEditingVariantIndex(-1);
  };

  const removeVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  const editVariant = (index: number) => {
    setVariantFormData(variants[index]);
    setEditingVariantIndex(index);
  };

  const cancelEditVariant = () => {
    setVariantFormData({
      name: '',
      options: [{ name: '', price: 0, stock: 0, sku: '', image: '' }]
    });
    setEditingVariantIndex(-1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const submitData = {
      ...formData,
      variants: variants
    };

    await onSubmit(submitData);
  };

  const handleChange = (field: keyof Product, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSpecsChange = (field: keyof ProductSpecs, value: string) => {
    setFormData(prev => ({
      ...prev,
      specs: {
        ...prev.specs,
        [field]: value
      }
    }));
  };

  const handleClose = () => {
    if (!isLoading && !uploadingImage) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-gray-900 bg-opacity-30 flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading && !uploadingImage) {
          handleClose();
        }
      }}
    >
      <div className="bg-white rounded-xl p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <h3 className="text-2xl font-semibold mb-6">
          {product ? '✏️ Sửa sản phẩm' : '➕ Thêm sản phẩm mới'}
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Tên sản phẩm */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Tên sản phẩm <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name || ''}
              onChange={(e) => handleChange('name', e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none ${
                errors.name ? 'border-red-500' : ''
              }`}
              placeholder="iPhone 15 Pro Max, MacBook Air M2..."
              disabled={isLoading || uploadingImage}
            />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Thương hiệu */}
            <div>
              <label className="block text-sm font-medium mb-2">Thương hiệu</label>
              <input
                type="text"
                value={formData.brand || ''}
                onChange={(e) => handleChange('brand', e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="Apple, Samsung, Dell..."
                disabled={isLoading || uploadingImage}
              />
            </div>

            {/* Danh mục */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Danh mục <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.categorySlug || ''}
                onChange={(e) => handleChange('categorySlug', e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none ${
                  errors.categorySlug ? 'border-red-500' : ''
                }`}
                disabled={isLoading || uploadingImage}
              >
                <option value="">-- Chọn danh mục --</option>
                {categories.map((cat) => (
                  <option key={cat.id || cat._id || cat.slug} value={cat.slug}>
                    {cat.name}
                  </option>
                ))}
              </select>
              {errors.categorySlug && <p className="text-red-500 text-sm mt-1">{errors.categorySlug}</p>}
            </div>
          </div>

          {/* Upload ảnh */}
          <div>
            <label className="block text-sm font-medium mb-2">Hình ảnh sản phẩm</label>
            {imagePreview ? (
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-64 object-cover rounded-lg border"
                  onError={(e: any) => e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2VlZSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTgiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5FcnJvcjwvdGV4dD48L3N2Zz4='}
                />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  disabled={isLoading || uploadingImage}
                  className="absolute top-2 right-2 bg-red-500 text-white px-3 py-1 rounded-lg hover:bg-red-600 disabled:opacity-50"
                >
                  🗑️ Xóa ảnh
                </button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={isLoading || uploadingImage}
                  className="hidden"
                  id="image-upload"
                />
                <label
                  htmlFor="image-upload"
                  className={`cursor-pointer inline-block px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 ${
                    (isLoading || uploadingImage) ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {uploadingImage ? '⏳ Đang upload...' : '📤 Chọn ảnh'}
                </label>
                <p className="text-sm text-gray-500 mt-2">JPG, PNG, GIF, WEBP (tối đa 5MB)</p>
              </div>
            )}
          </div>

          {/* Giá */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Giá bán (VNĐ) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.price || ''}
                onChange={(e) => handleChange('price', Number(e.target.value))}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none ${
                  errors.price ? 'border-red-500' : ''
                }`}
                placeholder="10000000"
                min="0"
                disabled={isLoading || uploadingImage}
              />
              {errors.price && <p className="text-red-500 text-sm mt-1">{errors.price}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Giá gốc (VNĐ)</label>
              <input
                type="number"
                value={formData.originalPrice || ''}
                onChange={(e) => handleChange('originalPrice', Number(e.target.value))}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none ${
                  errors.originalPrice ? 'border-red-500' : ''
                }`}
                placeholder="12000000"
                min="0"
                disabled={isLoading || uploadingImage}
              />
              {errors.originalPrice && <p className="text-red-500 text-sm mt-1">{errors.originalPrice}</p>}
            </div>
          </div>

          {/* Mô tả */}
          <div>
            <label className="block text-sm font-medium mb-2">Mô tả sản phẩm</label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => handleChange('description', e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
              rows={3}
              placeholder="Mô tả chi tiết về sản phẩm..."
              disabled={isLoading || uploadingImage}
            />
          </div>

          {/* ✅ PHẦN BIẾN THỂ - MA TRẬN COMBO */}
          <div className="border-t pt-4">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-lg font-semibold text-green-600">🎨 Biến thể sản phẩm</h4>
              <button
                type="button"
                onClick={() => {
                  if (editingVariantIndex === -1) {
                    setVariantFormData({
                      name: '',
                      options: [{ name: '', price: 0, stock: 0, sku: '', image: '' }]
                    });
                  }
                }}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 text-sm"
                disabled={isLoading || uploadingImage || editingVariantIndex >= 0}
              >
                ➕ Thêm biến thể
              </button>
            </div>

            {/* Danh sách variants đã thêm */}
            {variants.length > 0 && (
              <div className="mb-4 space-y-3">
                {variants.map((variant, vIndex) => (
                  <div key={vIndex} className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex justify-between items-start mb-3">
                      <h5 className="font-semibold text-gray-700 text-lg">📦 {variant.name}</h5>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => editVariant(vIndex)}
                          disabled={editingVariantIndex >= 0}
                          className="text-blue-500 hover:text-blue-700 text-sm disabled:opacity-50"
                        >
                          ✏️ Sửa
                        </button>
                        <button
                          type="button"
                          onClick={() => removeVariant(vIndex)}
                          disabled={editingVariantIndex >= 0}
                          className="text-red-500 hover:text-red-700 text-sm disabled:opacity-50"
                        >
                          🗑️ Xóa
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {variant.options.map((opt, oIndex) => (
                        <div key={oIndex} className="bg-white p-3 rounded-lg border shadow-sm">
                          {opt.image && (
                            <img src={opt.image} alt={opt.name} className="w-full h-24 object-cover rounded mb-2" />
                          )}
                          <div className="font-semibold text-gray-800">{opt.name}</div>
                          <div className="text-sm text-blue-600 font-medium mt-1">
                            {opt.price.toLocaleString()}₫
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
                            Tồn kho: {opt.stock}
                          </div>
                          {opt.sku && <div className="text-xs text-gray-500 mt-1">SKU: {opt.sku}</div>}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Form thêm/sửa variant */}
            {(editingVariantIndex >= 0 || variantFormData.name !== '' || variants.length === 0) && (
              <div className="border-2 border-green-200 rounded-lg p-4 bg-green-50 space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700">
                    Tên biến thể <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={variantFormData.name}
                    onChange={(e) => setVariantFormData({ ...variantFormData, name: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                    placeholder="VD: Phiên bản, Màu sắc, Dung lượng..."
                    disabled={isLoading || uploadingImage}
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-3">
                    <label className="block text-sm font-semibold text-gray-700">
                      Các tùy chọn (mỗi tùy chọn có giá riêng)
                    </label>
                    <button
                      type="button"
                      onClick={addVariantOption}
                      className="text-sm px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 font-medium"
                      disabled={isLoading || uploadingImage}
                    >
                      ➕ Thêm tùy chọn
                    </button>
                  </div>

                  <div className="space-y-3">
                    {variantFormData.options.map((option, index) => (
                      <div key={index} className="bg-white p-4 rounded-lg border-2 border-gray-200 shadow-sm">
                        <div className="grid grid-cols-12 gap-3">
                          {/* Tên option */}
                          <div className="col-span-3">
                            <label className="block text-xs font-medium text-gray-600 mb-1">Tên *</label>
                            <input
                              type="text"
                              value={option.name}
                              onChange={(e) => updateVariantOption(index, 'name', e.target.value)}
                              className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-green-500"
                              placeholder="VD: 1TB, 512GB"
                              disabled={isLoading || uploadingImage}
                            />
                          </div>

                          {/* Giá */}
                          <div className="col-span-3">
                            <label className="block text-xs font-medium text-gray-600 mb-1">Giá (VNĐ) *</label>
                            <input
                              type="number"
                              value={option.price}
                              onChange={(e) => updateVariantOption(index, 'price', Number(e.target.value))}
                              className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-green-500"
                              placeholder="47990000"
                              min="0"
                              disabled={isLoading || uploadingImage}
                            />
                          </div>

                          {/* Số lượng */}
                          <div className="col-span-2">
                            <label className="block text-xs font-medium text-gray-600 mb-1">Tồn kho</label>
                            <input
                              type="number"
                              value={option.stock}
                              onChange={(e) => updateVariantOption(index, 'stock', Number(e.target.value))}
                              className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-green-500"
                              placeholder="10"
                              min="0"
                              disabled={isLoading || uploadingImage}
                            />
                          </div>

                          {/* SKU */}
                          <div className="col-span-2">
                            <label className="block text-xs font-medium text-gray-600 mb-1">SKU</label>
                            <input
                              type="text"
                              value={option.sku}
                              onChange={(e) => updateVariantOption(index, 'sku', e.target.value)}
                              className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-green-500"
                              placeholder="1TB"
                              disabled={isLoading || uploadingImage}
                            />
                          </div>

                          {/* Xóa button */}
                          <div className="col-span-1 flex items-end justify-center pb-2">
                            {variantFormData.options.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeVariantOption(index)}
                                className="text-red-500 hover:text-red-700 font-bold"
                                disabled={isLoading || uploadingImage}
                              >
                                ❌
                              </button>
                            )}
                          </div>

                          {/* Upload ảnh cho option */}
                          <div className="col-span-11">
                            <label className="block text-xs font-medium text-gray-600 mb-1">Hình ảnh (tùy chọn)</label>
                            {option.image ? (
                              <div className="relative inline-block">
                                <img src={option.image} alt={option.name} className="w-20 h-20 object-cover rounded border" />
                                <button
                                  type="button"
                                  onClick={() => updateVariantOption(index, 'image', '')}
                                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 text-xs"
                                >
                                  ✕
                                </button>
                              </div>
                            ) : (
                              <div>
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => handleVariantImageUpload(index, e)}
                                  className="hidden"
                                  id={`variant-image-${index}`}
                                  disabled={isLoading || uploadingImage}
                                />
                                <label
                                  htmlFor={`variant-image-${index}`}
                                  className="cursor-pointer inline-block px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                                >
                                  📤 Tải ảnh
                                </label>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-3 border-t">
                  <button
                    type="button"
                    onClick={saveVariant}
                    className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 font-medium"
                    disabled={isLoading || uploadingImage}
                  >
                    ✅ {editingVariantIndex >= 0 ? 'Cập nhật' : 'Lưu'} biến thể
                  </button>
                  <button
                    type="button"
                    onClick={cancelEditVariant}
                    className="px-6 py-2 bg-gray-300 rounded-lg hover:bg-gray-400 font-medium"
                    disabled={isLoading || uploadingImage}
                  >
                    ❌ Hủy
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Thông số kỹ thuật */}
          <div className="border-t pt-4">
            <h4 className="text-lg font-semibold mb-4 text-purple-600">⚙️ Thông số kỹ thuật</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Màn hình</label>
                <input
                  type="text"
                  value={formData.specs?.screen || ''}
                  onChange={(e) => handleSpecsChange('screen', e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="16 inch, QHD 240Hz"
                  disabled={isLoading || uploadingImage}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Chip</label>
                <input
                  type="text"
                  value={formData.specs?.chip || ''}
                  onChange={(e) => handleSpecsChange('chip', e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="Intel Core i9-13980HX"
                  disabled={isLoading || uploadingImage}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">RAM</label>
                <input
                  type="text"
                  value={formData.specs?.ram || ''}
                  onChange={(e) => handleSpecsChange('ram', e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="32 GB DDR5"
                  disabled={isLoading || uploadingImage}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Storage</label>
                <input
                  type="text"
                  value={formData.specs?.storage || ''}
                  onChange={(e) => handleSpecsChange('storage', e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="1 TB SSD"
                  disabled={isLoading || uploadingImage}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Camera</label>
                <input
                  type="text"
                  value={formData.specs?.camera || ''}
                  onChange={(e) => handleSpecsChange('camera', e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="Webcam HD"
                  disabled={isLoading || uploadingImage}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Pin</label>
                <input
                  type="text"
                  value={formData.specs?.battery || ''}
                  onChange={(e) => handleSpecsChange('battery', e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="90 Wh"
                  disabled={isLoading || uploadingImage}
                />
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <button 
              type="submit"
              disabled={isLoading || uploadingImage}
              className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition font-medium"
            >
              {isLoading ? 'Đang xử lý...' : uploadingImage ? 'Đang upload ảnh...' : (product ? 'Cập nhật' : 'Thêm mới')}
            </button>
            <button 
              type="button"
              onClick={handleClose}
              disabled={isLoading || uploadingImage}
              className="flex-1 bg-gray-300 py-3 rounded-lg hover:bg-gray-400 disabled:bg-gray-200 disabled:cursor-not-allowed transition font-medium"
            >
              Hủy
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
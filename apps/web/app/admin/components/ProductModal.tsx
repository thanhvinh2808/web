// app/admin/components/ProductModal.tsx
'use client';
import React, { useState, useEffect } from 'react';



// ✅ Cập nhật Specs cho Giày
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
    tags: [],
    variants: [],
    specs: {
      condition: 'New',
      accessories: 'Fullbox',
      material: '',
      styleCode: ''
    }
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploadingImage, setUploadingImage] = useState(false);
  
  // State Variants
  const [variants, setVariants] = useState<Variant[]>([]);
  const [editingVariantIndex, setEditingVariantIndex] = useState<number>(-1);
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
        // Hợp nhất image và images
        images: product.images && product.images.length > 0 
          ? product.images 
          : (product.image ? [product.image] : []),
        tags: product.tags || [],
        variants: product.variants || [],
        specs: {
          condition: product.specs?.condition || 'New',
          accessories: product.specs?.accessories || 'Fullbox',
          material: product.specs?.material || '',
          styleCode: product.specs?.styleCode || ''
        }
      });
      
      if (product.variants && product.variants.length > 0) {
        setVariants(product.variants);
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
          condition: 'New',
          accessories: 'Fullbox',
          material: '',
          styleCode: ''
        }
      });
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
    if (!formData.name?.trim()) newErrors.name = 'Tên sản phẩm không được để trống';
    if (!formData.categorySlug) newErrors.categorySlug = 'Vui lòng chọn danh mục';
    if (!formData.price || formData.price <= 0) newErrors.price = 'Giá phải lớn hơn 0';
    if (formData.originalPrice && formData.originalPrice < (formData.price || 0)) {
      newErrors.originalPrice = 'Giá gốc phải lớn hơn hoặc bằng giá bán';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ✅ UPLOAD MULTIPLE IMAGES
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingImage(true);
    const newImages: string[] = [];

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      
      // Upload từng file một (hoặc dùng endpoint upload multiple nếu backend hỗ trợ)
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Validate type & size
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!validTypes.includes(file.type)) continue;
        if (file.size > 5 * 1024 * 1024) continue;

        const uploadFormData = new FormData();
        uploadFormData.append('image', file);

        const response = await fetch(`${API_URL}/upload/single`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: uploadFormData
        });

        const data = await response.json();
        if (data.success) {
          const imageUrl = getImageUrl(data.data.url); // ✅ Dùng đúng hàm
          newImages.push(imageUrl);
        }
      }

      if (newImages.length > 0) {
        setFormData(prev => ({
          ...prev,
          images: [...(prev.images || []), ...newImages]
        }));
      }
    } catch (error) {
      console.error('❌ Upload error:', error);
      alert('Có lỗi khi upload ảnh.');
    } finally {
      setUploadingImage(false);
      // Reset input value để cho phép chọn lại cùng file
      e.target.value = '';
    }
  };

  // ✅ XÓA ẢNH KHỎI GALLERY
  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images?.filter((_, i) => i !== index)
    }));
  };

  // ✅ SET ẢNH LÀM ĐẠI DIỆN (ĐƯA LÊN ĐẦU)
  const setMainImage = (index: number) => {
    if (!formData.images) return;
    const newImages = [...formData.images];
    const [selected] = newImages.splice(index, 1);
    newImages.unshift(selected);
    setFormData(prev => ({ ...prev, images: newImages }));
  };

  // --- Variant Handling (Giữ nguyên) ---
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
  const saveVariant = () => {
    if (!variantFormData.name.trim()) {
      alert('Vui lòng nhập tên biến thể (VD: Size)');
      return;
    }
    const validOptions = variantFormData.options.filter(opt => opt.name.trim());
    if (validOptions.length === 0) {
      alert('Vui lòng thêm ít nhất 1 tùy chọn');
      return;
    }
    const newVariant = { ...variantFormData, options: validOptions };
    
    if (editingVariantIndex >= 0) {
      const updatedVariants = [...variants];
      updatedVariants[editingVariantIndex] = newVariant;
      setVariants(updatedVariants);
    } else {
      setVariants([...variants, newVariant]);
    }
    setVariantFormData({ name: '', options: [{ name: '', price: 0, stock: 0, sku: '', image: '' }] });
    setEditingVariantIndex(-1);
  };
  const removeVariant = (index: number) => setVariants(variants.filter((_, i) => i !== index));
  const editVariant = (index: number) => {
    setVariantFormData(variants[index]);
    setEditingVariantIndex(index);
  };
  const cancelEditVariant = () => {
    setVariantFormData({ name: '', options: [{ name: '', price: 0, stock: 0, sku: '', image: '' }] });
    setEditingVariantIndex(-1);
  };

  // Variant Image Upload (Giữ nguyên)
  const handleVariantImageUpload = async (optionIndex: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const uploadFormData = new FormData();
      uploadFormData.append('image', file);
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const response = await fetch(`${API_URL}/upload/single`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: uploadFormData
      });
      const data = await response.json();
      if (data.success) {
        const imageUrl = getImageUrl(data.data.url);
        updateVariantOption(optionIndex, 'image', imageUrl);
      }
    } catch (error) { console.error(error); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    await onSubmit({ ...formData, variants: variants });
  };

  const handleChange = (field: keyof Product, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const handleSpecsChange = (field: keyof ProductSpecs, value: string) => {
    setFormData(prev => ({ ...prev, specs: { ...prev.specs, [field]: value } }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-sans">
      <div className="bg-white rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        {/* Header */}
        <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
          <div>
            <h3 className="text-2xl font-black italic tracking-tight uppercase text-black">
              {product ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}
            </h3>
            <p className="text-xs text-gray-500 font-bold tracking-widest uppercase mt-1">FootMark Management</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-black transition">✕</button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          
          {/* 1. Thông tin cơ bản */}
          <section>
            <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 border-b pb-2">Thông tin cơ bản</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Tên sản phẩm *</label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border-none rounded-lg focus:ring-2 focus:ring-black outline-none font-medium"
                  placeholder="VD: Nike Air Jordan 1 High Chicago..."
                />
                {errors.name && <p className="text-red-500 text-xs mt-1 font-bold">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Thương hiệu</label>
                <input
                  type="text"
                  value={formData.brand || ''}
                  onChange={(e) => handleChange('brand', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border-none rounded-lg focus:ring-2 focus:ring-black outline-none"
                  placeholder="Nike, Adidas, MLB..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Tags (Phân loại)</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {formData.tags?.map((tag, idx) => (
                    <span key={idx} className="bg-black text-white text-[10px] font-bold px-2 py-1 uppercase flex items-center gap-1">
                      {tag}
                      <button type="button" onClick={() => {
                        setFormData(prev => ({
                          ...prev,
                          tags: prev.tags?.filter((_, i) => i !== idx)
                        }));
                      }} className="hover:text-red-400">✕</button>
                    </span>
                  ))}
                </div>
                <input
                  type="text"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const value = (e.target as HTMLInputElement).value.trim();
                      if (value && !formData.tags?.includes(value)) {
                        setFormData(prev => ({
                          ...prev,
                          tags: [...(prev.tags || []), value]
                        }));
                        (e.target as HTMLInputElement).value = '';
                      }
                    }
                  }}
                  className="w-full px-4 py-3 bg-gray-50 border-none rounded-lg focus:ring-2 focus:ring-black outline-none"
                  placeholder="Nhấn Enter để thêm tag (VD: Limited, Hot Deal...)"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Danh mục *</label>
                <select
                  value={formData.categorySlug || ''}
                  onChange={(e) => handleChange('categorySlug', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border-none rounded-lg focus:ring-2 focus:ring-black outline-none"
                >
                  <option value="">-- Chọn danh mục --</option>
                  {categories.map((cat) => (
                    <option key={cat.slug} value={cat.slug}>{cat.name}</option>
                  ))}
                </select>
                {errors.categorySlug && <p className="text-red-500 text-xs mt-1 font-bold">{errors.categorySlug}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Giá bán (VNĐ) *</label>
                <input
                  type="number"
                  value={formData.price || ''}
                  onChange={(e) => handleChange('price', Number(e.target.value))}
                  className="w-full px-4 py-3 bg-gray-50 border-none rounded-lg focus:ring-2 focus:ring-black outline-none font-bold text-lg"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Giá gốc (VNĐ)</label>
                <input
                  type="number"
                  value={formData.originalPrice || ''}
                  onChange={(e) => handleChange('originalPrice', Number(e.target.value))}
                  className="w-full px-4 py-3 bg-gray-50 border-none rounded-lg focus:ring-2 focus:ring-black outline-none"
                  placeholder="0"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Mô tả</label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => handleChange('description', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border-none rounded-lg focus:ring-2 focus:ring-black outline-none h-32 resize-none"
                  placeholder="Mô tả chi tiết về sản phẩm..."
                />
              </div>
            </div>
          </section>

          {/* 2. Hình ảnh (Gallery) */}
          <section>
            <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 border-b pb-2">Hình ảnh (Gallery)</h4>
            
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {/* Upload Button */}
              <label className="cursor-pointer aspect-square bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center text-gray-400 hover:bg-gray-100 hover:border-black transition">
                <span className="text-2xl mb-1">{uploadingImage ? '⏳' : '📷'}</span>
                <span className="text-[10px] font-bold uppercase">{uploadingImage ? 'Uploading...' : 'Thêm Ảnh'}</span>
                <input 
                  type="file" 
                  multiple 
                  accept="image/*" 
                  onChange={handleImageUpload} 
                  disabled={uploadingImage} 
                  className="hidden" 
                />
              </label>

              {/* Image List */}
              {formData.images?.map((img, idx) => (
                <div key={idx} className="relative aspect-square rounded-xl overflow-hidden group border border-gray-200 bg-white">
                  <img src={img} alt={`Product ${idx}`} className="w-full h-full object-cover" />
                  
                  {/* Overlay Actions */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center gap-2 p-2">
                    {idx === 0 ? (
                      <span className="text-[10px] text-green-400 font-bold uppercase border border-green-400 px-2 py-0.5 rounded">Ảnh Chính</span>
                    ) : (
                      <button 
                        type="button" 
                        onClick={() => setMainImage(idx)}
                        className="text-[10px] text-white font-bold uppercase hover:underline"
                      >
                        Đặt làm chính
                      </button>
                    )}
                    <button 
                      type="button" 
                      onClick={() => removeImage(idx)}
                      className="text-red-500 hover:text-red-400 font-bold bg-white rounded-full p-1 w-6 h-6 flex items-center justify-center"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              * Ảnh đầu tiên sẽ là ảnh đại diện. Bạn có thể thêm nhiều ảnh.
            </p>
          </section>

          {/* 3. Chi tiết FootMark */}
          <section>
            <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 border-b pb-2">Thông tin chi tiết</h4>
            <div className="grid grid-cols-2 gap-6">
               <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Tình trạng</label>
                  <select 
                    value={formData.specs?.condition || 'New'}
                    onChange={(e) => handleSpecsChange('condition', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-lg focus:ring-2 focus:ring-black outline-none"
                  >
                    <option value="New">New (Mới 100%)</option>
                    <option value="Like New">Like New (99%)</option>
                    <option value="98%">Very Good (98%)</option>
                    <option value="95%">Good (95%)</option>
                    <option value="90%">Used (90%)</option>
                  </select>
               </div>
               <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Phụ kiện</label>
                  <select 
                    value={formData.specs?.accessories || 'Fullbox'}
                    onChange={(e) => handleSpecsChange('accessories', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-lg focus:ring-2 focus:ring-black outline-none"
                  >
                    <option value="Fullbox">Fullbox (Hộp gốc)</option>
                    <option value="No Box">No Box (Không hộp)</option>
                    <option value="Replacement Box">Replacement Box (Hộp thay thế)</option>
                  </select>
               </div>
               <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Mã giày</label>
                  <input
                    type="text"
                    value={formData.specs?.styleCode || ''}
                    onChange={(e) => handleSpecsChange('styleCode', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-lg focus:ring-2 focus:ring-black outline-none"
                    placeholder="VD: 555088-101"
                  />
               </div>
               <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Chất liệu</label>
                  <input
                    type="text"
                    value={formData.specs?.material || ''}
                    onChange={(e) => handleSpecsChange('material', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-lg focus:ring-2 focus:ring-black outline-none"
                    placeholder="VD: Da lộn, Vải Mesh..."
                  />
               </div>
            </div>
          </section>

          {/* 4. Variants (Size/Màu) - Logic Giữ nguyên */}
          <section>
            <div className="flex justify-between items-center mb-4 border-b pb-2">
               <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Phân loại hàng (Variants)</h4>
               <button 
                  type="button"
                  onClick={() => {
                    setEditingVariantIndex(-1);
                    setVariantFormData({ name: '', options: [{ name: '', price: 0, stock: 0, sku: '', image: '' }] });
                  }}
                  className="bg-black text-white text-xs font-bold uppercase px-4 py-2 rounded hover:bg-gray-800 transition"
               >
                  + Thêm Size/Màu
               </button>
            </div>

            {/* List Variants */}
            {variants.length > 0 && (
               <div className="grid gap-4 mb-6">
                  {variants.map((v, i) => (
                     <div key={i} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-center mb-3">
                           <span className="font-bold uppercase text-sm">{v.name}</span>
                           <div className="space-x-2">
                              <button type="button" onClick={() => editVariant(i)} className="text-blue-600 text-xs font-bold uppercase hover:underline">Sửa</button>
                              <button type="button" onClick={() => removeVariant(i)} className="text-red-600 text-xs font-bold uppercase hover:underline">Xóa</button>
                           </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                           {v.options.map((opt, j) => (
                              <div key={j} className="bg-gray-100 px-3 py-2 rounded text-xs">
                                 <span className="font-bold">{opt.name}</span> - {opt.price.toLocaleString()}đ (Kho: {opt.stock})
                              </div>
                           ))}
                        </div>
                     </div>
                  ))}
               </div>
            )}

            {/* Form Edit Variant */}
            {(editingVariantIndex >= 0 || variantFormData.name !== '' || variants.length === 0) && (
               <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                  <div className="mb-4">
                     <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Tên nhóm biến thể</label>
                     <input
                        type="text"
                        value={variantFormData.name}
                        onChange={(e) => setVariantFormData({...variantFormData, name: e.target.value})}
                        className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-black outline-none"
                        placeholder="VD: Size, Màu sắc..."
                     />
                  </div>
                  
                  <div className="space-y-3">
                     {variantFormData.options.map((opt, idx) => (
                        <div key={idx} className="flex gap-3 items-end">
                           <div className="flex-1">
                              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Tên (VD: 42, Đỏ)</label>
                              <input 
                                 type="text" 
                                 value={opt.name} 
                                 onChange={(e) => updateVariantOption(idx, 'name', e.target.value)}
                                 className="w-full px-3 py-2 bg-white border border-gray-200 rounded outline-none text-sm"
                              />
                           </div>
                           <div className="w-32">
                              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Giá thêm</label>
                              <input 
                                 type="number" 
                                 value={opt.price} 
                                 onChange={(e) => updateVariantOption(idx, 'price', Number(e.target.value))}
                                 className="w-full px-3 py-2 bg-white border border-gray-200 rounded outline-none text-sm"
                              />
                           </div>
                           <div className="w-24">
                              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Kho</label>
                              <input 
                                 type="number" 
                                 value={opt.stock} 
                                 onChange={(e) => updateVariantOption(idx, 'stock', Number(e.target.value))}
                                 className="w-full px-3 py-2 bg-white border border-gray-200 rounded outline-none text-sm"
                              />
                           </div>
                           <button type="button" onClick={() => removeVariantOption(idx)} className="pb-2 text-red-500 hover:text-red-700 font-bold">×</button>
                        </div>
                     ))}
                     <button type="button" onClick={addVariantOption} className="text-xs font-bold text-blue-600 uppercase hover:underline">+ Thêm tùy chọn</button>
                  </div>

                  <div className="mt-4 flex gap-3">
                     <button type="button" onClick={saveVariant} className="bg-black text-white px-6 py-2 rounded font-bold text-xs uppercase hover:bg-stone-800">Lưu Biến Thể</button>
                     <button type="button" onClick={cancelEditVariant} className="bg-white border border-gray-300 text-black px-6 py-2 rounded font-bold text-xs uppercase hover:bg-gray-100">Hủy</button>
                  </div>
               </div>
            )}
          </section>

          {/* Footer Actions */}
          <div className="sticky bottom-0 bg-white border-t pt-4 pb-0 flex justify-end gap-4 z-10">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-8 py-4 bg-gray-100 rounded-lg font-bold text-gray-600 uppercase tracking-wider hover:bg-gray-200 transition"
              disabled={isLoading || uploadingImage}
            >
              Hủy bỏ
            </button>
            <button 
              type="submit" 
              className="px-8 py-4 bg-black text-white rounded-lg font-bold uppercase tracking-wider hover:bg-stone-800 transition shadow-xl"
              disabled={isLoading || uploadingImage}
            >
              {isLoading ? 'Đang xử lý...' : (product ? 'Lưu thay đổi' : 'Tạo sản phẩm')}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}

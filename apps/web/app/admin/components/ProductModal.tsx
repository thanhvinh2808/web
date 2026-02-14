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

  // ✅ Hàm hỗ trợ lấy URL ảnh đầy đủ
  const getImageUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
  };

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

        const response = await fetch(`${API_URL}/api/upload/single`, {
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

  // --- Variant Handling ---
  const updateAllVariants = (newVariants: Variant[]) => {
    setVariants(newVariants);
    setFormData(prev => ({ ...prev, variants: newVariants }));
  };

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
    const variantName = variantFormData.name.trim();
    if (!variantName) {
      alert('Vui lòng nhập tên biến thể (VD: Size)');
      return;
    }

    const validOptions = variantFormData.options
      .filter(opt => opt.name && String(opt.name).trim() !== '')
      .map(opt => ({
        ...opt,
        price: Number(opt.price) || 0,
        stock: Number(opt.stock) || 0
      }));

    if (validOptions.length === 0) {
      alert('Vui lòng thêm ít nhất 1 tùy chọn có tên');
      return;
    }

    const newVariant = { name: variantName, options: validOptions };
    let updatedVariants: Variant[] = [];
    
    if (editingVariantIndex >= 0) {
      updatedVariants = [...variants];
      updatedVariants[editingVariantIndex] = newVariant;
    } else {
      updatedVariants = [...variants, newVariant];
    }
    
    updateAllVariants(updatedVariants);
    
    // Reset form
    setVariantFormData({ name: '', options: [{ name: '', price: 0, stock: 0, sku: '', image: '' }] });
    setEditingVariantIndex(-1);
  };

  const removeVariant = (index: number) => {
    const updated = variants.filter((_, i) => i !== index);
    updateAllVariants(updated);
  };

  const editVariant = (index: number) => {
    setVariantFormData(variants[index]);
    setEditingVariantIndex(index);
  };

  const cancelEditVariant = () => {
    setVariantFormData({ name: '', options: [{ name: '', price: 0, stock: 0, sku: '', image: '' }] });
    setEditingVariantIndex(-1);
  };

  // Variant Image Upload
  const handleVariantImageUpload = async (optionIndex: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const uploadFormData = new FormData();
      uploadFormData.append('image', file);
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const response = await fetch(`${API_URL}/api/upload/single`, {
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
    
    // Đảm bảo dữ liệu cuối cùng có variants chính xác
    const finalData = { ...formData, variants: variants };
    console.log('🚀 Final product data to submit:', finalData);
    
    await onSubmit(finalData);
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

          {/* 4. Quản lý Size & Giá bán */}
          <section>
            <div className="flex justify-between items-center mb-4 border-b pb-2">
               <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Quản lý Size & Kho hàng</h4>
               <button 
                  type="button"
                  onClick={() => {
                    const newSize = {
                      name: '',
                      price: formData.price || 0,
                      stock: 1,
                      sku: '',
                      image: ''
                    };
                    // Nếu chưa có variant nào, tạo mới nhóm "Size"
                    if (variants.length === 0) {
                      updateAllVariants([{ name: 'Size', options: [newSize] }]);
                    } else {
                      // Nếu đã có, thêm option vào nhóm đầu tiên
                      const updated = [...variants];
                      updated[0].options.push(newSize);
                      updateAllVariants(updated);
                    }
                  }}
                  className="bg-black text-white text-xs font-bold uppercase px-4 py-2 rounded hover:bg-stone-800 transition"
               >
                  + Thêm Size mới
               </button>
            </div>

            {variants.length > 0 ? (
               <div className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
                  <table className="w-full text-sm">
                     <thead className="bg-gray-100 border-b border-gray-200">
                        <tr>
                           <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 uppercase">Kích thước (Size)</th>
                           <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 uppercase">Giá bán (VNĐ)</th>
                           <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 uppercase">Tồn kho</th>
                           <th className="px-4 py-3 text-center text-[10px] font-bold text-gray-500 uppercase">Thao tác</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-200">
                        {variants[0].options.map((opt, idx) => (
                           <tr key={idx} className="bg-white hover:bg-gray-50 transition">
                              <td className="px-4 py-3">
                                 <input 
                                    type="text" 
                                    value={opt.name}
                                    onChange={(e) => {
                                       const updated = [...variants];
                                       updated[0].options[idx].name = e.target.value;
                                       updateAllVariants(updated);
                                    }}
                                    placeholder="VD: 42"
                                    className="w-full bg-transparent border-none focus:ring-0 font-bold"
                                 />
                              </td>
                              <td className="px-4 py-3">
                                 <input 
                                    type="number" 
                                    value={opt.price}
                                    onChange={(e) => {
                                       const updated = [...variants];
                                       updated[0].options[idx].price = Number(e.target.value);
                                       updateAllVariants(updated);
                                    }}
                                    className="w-full bg-transparent border-none focus:ring-0 font-medium"
                                 />
                              </td>
                              <td className="px-4 py-3">
                                 <input 
                                    type="number" 
                                    value={opt.stock}
                                    onChange={(e) => {
                                       const updated = [...variants];
                                       updated[0].options[idx].stock = Number(e.target.value);
                                       updateAllVariants(updated);
                                    }}
                                    className="w-full bg-transparent border-none focus:ring-0"
                                 />
                              </td>
                              <td className="px-4 py-3 text-center">
                                 <button 
                                    type="button"
                                    onClick={() => {
                                       const updated = [...variants];
                                       updated[0].options.splice(idx, 1);
                                       if (updated[0].options.length === 0) {
                                          updateAllVariants([]);
                                       } else {
                                          updateAllVariants(updated);
                                       }
                                    }}
                                    className="text-red-500 hover:text-red-700 p-2"
                                 >
                                    ✕
                                 </button>
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            ) : (
               <div className="text-center py-10 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                  <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Chưa có thông tin Size</p>
                  <button 
                     type="button"
                     onClick={() => updateAllVariants([{ name: 'Size', options: [{ name: '42', price: formData.price || 0, stock: 1, sku: '', image: '' }] }])}
                     className="mt-4 text-blue-600 text-xs font-bold uppercase hover:underline"
                  >
                     Tạo nhanh bảng Size
                  </button>
               </div>
            )}
            <p className="text-[10px] text-gray-400 mt-3 uppercase font-bold tracking-wider">
               * Lưu ý: Đối với hàng 2Hand, mỗi size thường chỉ có số lượng là 1.
            </p>
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

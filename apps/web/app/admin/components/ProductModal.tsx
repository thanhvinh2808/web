// app/admin/components/ProductModal.tsx
'use client';
import React, { useState, useEffect } from 'react';
import { CLEAN_API_URL } from '@lib/shared/constants';
import { Plus, Trash2, Edit, X, ImageIcon, Save } from 'lucide-react';

const baseUrl = CLEAN_API_URL;

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

interface Brand {
  _id: string;
  name: string;
  slug: string;
}

interface Product {
  id?: string;
  _id?: string;
  name: string;
  brand?: string;
  brandId?: string;
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
  const [brands, setBrands] = useState<Brand[]>([]);
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    brandId: '',
    description: '',
    price: 0,
    originalPrice: 0,
    categorySlug: '',
    stock: 0,
    images: [],
    variants: [],
    specs: { condition: 'New', accessories: 'Fullbox' }
  });

  const [uploadingImage, setUploadingImage] = useState(false);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [isAddingVariant, setIsAddingVariant] = useState(false);
  const [editingVariantIndex, setEditingVariantIndex] = useState<number>(-1);
  const [variantFormData, setVariantFormData] = useState<Variant>({
    name: '',
    options: [{ name: '', price: 0, stock: 0, sku: '', image: '' }]
  });

  // ✅ Helper: Định dạng hiển thị tiền tệ (VD: 10.000)
  const formatDisplayPrice = (val: number | undefined) => {
    if (!val && val !== 0) return '';
    return val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  // ✅ Helper: Chuyển chuỗi hiển thị về số để lưu (VD: "10.000" -> 10000)
  const parseRawPrice = (val: string) => {
    return Number(val.replace(/\./g, ''));
  };

  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const res = await fetch(`${baseUrl}/api/brands`);
        const data = await res.json();
        setBrands(data.brands || data || []);
      } catch (error) { console.error("Error fetching brands:", error); }
    };
    if (isOpen) fetchBrands();
  }, [isOpen]);

  useEffect(() => {
    if (product) {
      setFormData({
        ...product,
        brandId: (product as any).brandId?._id || (product as any).brandId || '',
        images: product.images || (product.image ? [product.image] : [])
      });
      setVariants(product.variants || []);
    } else {
      setFormData({
        name: '', brandId: '', description: '', price: 0, originalPrice: 0,
        categorySlug: '', stock: 0, images: [], variants: [],
        specs: { condition: 'New', accessories: 'Fullbox' }
      });
      setVariants([]);
    }
    setIsAddingVariant(false);
  }, [product, isOpen]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploadingImage(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const uploadFormData = new FormData();
        uploadFormData.append('image', file);
        const res = await fetch(`${baseUrl}/api/admin/upload-single`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: uploadFormData
        });
        const data = await res.json();
        if (data.success) {
          const url = data.data.url.startsWith('http') ? data.data.url : `${baseUrl}${data.data.url.startsWith('/') ? '' : '/'}${data.data.url}`;
          setFormData(prev => ({ ...prev, images: [...(prev.images || []), url] }));
        }
      }
    } catch (e) { console.error(e); } finally { setUploadingImage(false); e.target.value = ''; }
  };

  const saveVariant = () => {
    if (!variantFormData.name.trim()) return;
    const validOptions = variantFormData.options.filter(o => o.name.trim());
    if (editingVariantIndex >= 0) {
      const updated = [...variants];
      updated[editingVariantIndex] = { ...variantFormData, options: validOptions };
      setVariants(updated);
    } else {
      setVariants([...variants, { ...variantFormData, options: validOptions }]);
    }
    setIsAddingVariant(false);
    setEditingVariantIndex(-1);
    setVariantFormData({ name: '', options: [{ name: '', price: 0, stock: 0, sku: '', image: '' }] });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-5xl max-h-[90vh] overflow-hidden shadow-xl flex flex-col border border-slate-200">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 className="text-lg font-bold text-slate-800">{product ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition"><X size={20} /></button>
        </div>
        
        <div className="overflow-y-auto p-6 space-y-8">
          {/* Thông tin cơ bản */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Tên sản phẩm</label>
                <input type="text" value={formData.name || ''} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition" placeholder="VD: Nike Dunk Low..." />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Mô tả</label>
                <textarea value={formData.description || ''} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg outline-none focus:border-blue-500 h-24 resize-none" />
              </div>

              {/* 🛠️ CHI TIẾT KỸ THUẬT (Bổ sung Chất liệu & Mã SP) */}
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Mã sản phẩm (Style Code)</label>
                  <input 
                    type="text" 
                    value={formData.specs?.styleCode || ''} 
                    onChange={(e) => setFormData({
                      ...formData, 
                      specs: { ...formData.specs, styleCode: e.target.value }
                    })} 
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition font-mono text-sm" 
                    placeholder="VD: DD1391-100" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Chất liệu</label>
                  <input 
                    type="text" 
                    value={formData.specs?.material || ''} 
                    onChange={(e) => setFormData({
                      ...formData, 
                      specs: { ...formData.specs, material: e.target.value }
                    })} 
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition text-sm" 
                    placeholder="VD: Da Smooth, Suede..." 
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Thương hiệu</label>
                <select value={formData.brandId || ''} onChange={(e) => setFormData({...formData, brandId: e.target.value})} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg outline-none focus:border-blue-500 cursor-pointer">
                  <option value="">Chọn hãng</option>
                  {brands.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Danh mục</label>
                <select value={formData.categorySlug || ''} onChange={(e) => setFormData({...formData, categorySlug: e.target.value})} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg outline-none focus:border-blue-500 cursor-pointer">
                  <option value="">Chọn danh mục</option>
                  {categories.map(cat => <option key={cat.slug} value={cat.slug}>{cat.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Giá bán (VNĐ)</label>
                  <input 
                    type="text" 
                    value={formatDisplayPrice(formData.price as number)} 
                    onChange={(e) => setFormData({...formData, price: parseRawPrice(e.target.value)})} 
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg font-bold text-blue-600 outline-none focus:border-blue-500 transition" 
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Giá gốc</label>
                  <input 
                    type="text" 
                    value={formatDisplayPrice(formData.originalPrice as number)} 
                    onChange={(e) => setFormData({...formData, originalPrice: parseRawPrice(e.target.value)})} 
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-400 outline-none focus:border-blue-500 transition" 
                    placeholder="0"
                  />
                </div>
              </div>

              {/* 👟 ĐỘ MỚI & PHỤ KIỆN (Bổ sung lại) */}
              <div className="grid grid-cols-2 gap-3 p-4 bg-blue-50/50 rounded-xl border border-blue-100">
                <div>
                  <label className="block text-[10px] font-bold text-blue-600 uppercase mb-1.5">Độ mới (Condition)</label>
                  <select 
                    value={formData.specs?.condition || 'New'} 
                    onChange={(e) => setFormData({
                      ...formData, 
                      specs: { ...formData.specs, condition: e.target.value }
                    })}
                    className="w-full px-3 py-2 bg-white border border-blue-200 rounded-lg text-sm font-bold text-blue-700 outline-none focus:border-blue-500 transition cursor-pointer"
                  >
                    <option value="New">New (100%)</option>
                    <option value="99%">Like New (99%)</option>
                    <option value="95%">Good (95%)</option>
                    <option value="90%">Used (90%)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-blue-600 uppercase mb-1.5">Phụ kiện</label>
                  <select 
                    value={formData.specs?.accessories || 'Fullbox'} 
                    onChange={(e) => setFormData({
                      ...formData, 
                      specs: { ...formData.specs, accessories: e.target.value }
                    })}
                    className="w-full px-3 py-2 bg-white border border-blue-200 rounded-lg text-sm font-medium outline-none focus:border-blue-500 transition cursor-pointer"
                  >
                    <option value="Fullbox">Fullbox (Hộp gốc)</option>
                    <option value="Box Thay Thế">Box Thay Thế</option>
                    <option value="No Box">No Box (Chỉ có giày)</option>
                  </select>
                </div>
                <div className="col-span-2 mt-2">
                   <div className="flex flex-wrap gap-2">
                      {formData.tags?.map((tag, idx) => (
                        <span key={idx} className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${tag === 'new' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                          #{tag}
                        </span>
                      ))}
                      {!formData.tags?.length && (
                        <span className="text-[10px] text-slate-400 italic font-medium">* Hệ thống sẽ tự động gắn Tag New/2Hand dựa trên độ mới</span>
                      )}
                   </div>
                </div>
              </div>
            </div>
          </div>

          {/* Hình ảnh */}
          <div>
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase mb-3"><ImageIcon size={14} /> Hình ảnh sản phẩm</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
              <label className="cursor-pointer aspect-square bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-slate-400 hover:bg-slate-100 transition group">
                <Plus size={20} className={uploadingImage ? 'animate-spin' : ''} />
                <span className="text-[10px] mt-1 font-medium">{uploadingImage ? 'Đang tải...' : 'Thêm ảnh'}</span>
                <input type="file" multiple accept="image/*" onChange={handleImageUpload} className="hidden" />
              </label>
              {formData.images?.map((img, idx) => (
                <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-slate-100 group shadow-sm">
                  <img src={img} className="w-full h-full object-cover" />
                  <button type="button" onClick={() => setFormData(prev => ({...prev, images: prev.images?.filter((_, i) => i !== idx)}))} className="absolute top-1 right-1 bg-white/90 p-1 rounded-full text-red-500 opacity-0 group-hover:opacity-100 transition shadow-sm"><X size={14} /></button>
                  {idx === 0 && <span className="absolute bottom-0 left-0 right-0 bg-slate-800/60 text-white text-[9px] text-center py-0.5">Ảnh bìa</span>}
                </div>
              ))}
            </div>
          </div>

          {/* Biến thể */}
          <div className="bg-slate-50/50 rounded-xl p-5 border border-slate-100">
            <div className="flex justify-between items-center mb-4">
               <h4 className="text-sm font-bold text-slate-700">Phân loại hàng (Size/Màu sắc)</h4>
               {!isAddingVariant && (
                 <button type="button" onClick={() => setIsAddingVariant(true)} className="text-xs font-semibold text-blue-600 flex items-center gap-1 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition"><Plus size={14} /> Thêm nhóm phân loại</button>
               )}
            </div>

            {/* List existing variants */}
            <div className="space-y-3 mb-4">
               {variants.map((v, vIdx) => (
                 <div key={vIdx} className="bg-white p-4 rounded-lg border border-slate-200 flex justify-between items-center group">
                    <div>
                       <span className="text-xs font-bold text-slate-400 uppercase mr-2">{v.name}:</span>
                       <span className="text-sm font-medium">{v.options.map(o => o.name).join(', ')}</span>
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition">
                       <button type="button" onClick={() => { setVariantFormData(v); setEditingVariantIndex(vIdx); setIsAddingVariant(true); }} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded"><Edit size={16} /></button>
                       <button type="button" onClick={() => setVariants(variants.filter((_, i) => i !== vIdx))} className="p-1.5 text-red-500 hover:bg-red-50 rounded"><Trash2 size={16} /></button>
                    </div>
                 </div>
               ))}
            </div>

            {/* Form variant editing */}
            {isAddingVariant && (
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm animate-in fade-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center mb-4">
                  <input type="text" value={variantFormData.name} onChange={(e) => setVariantFormData({...variantFormData, name: e.target.value})} className="bg-slate-50 px-3 py-2 rounded-lg text-sm font-bold outline-none focus:ring-1 focus:ring-blue-400 w-48" placeholder="Tên nhóm (VD: Size)" />
                  <button type="button" onClick={() => setIsAddingVariant(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
                </div>
                
                <div className="space-y-3 mb-5">
                  {variantFormData.options.map((opt, oIdx) => (
                    <div key={oIdx} className="flex gap-3 items-center">
                      <input type="text" value={opt.name} onChange={(e) => {
                        const newOpts = [...variantFormData.options];
                        newOpts[oIdx].name = e.target.value;
                        setVariantFormData({...variantFormData, options: newOpts});
                      }} className="flex-1 px-3 py-2 bg-slate-50 rounded-lg text-sm outline-none" placeholder="Giá trị (VD: 42)" />
                      
                      <div className="relative w-32">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">+</span>
                        <input 
                          type="text" 
                          value={formatDisplayPrice(opt.price)} 
                          onChange={(e) => {
                            const newOpts = [...variantFormData.options];
                            newOpts[oIdx].price = parseRawPrice(e.target.value);
                            setVariantFormData({...variantFormData, options: newOpts});
                          }} 
                          className="w-full pl-6 pr-3 py-2 bg-slate-50 rounded-lg text-sm outline-none focus:ring-1 focus:ring-blue-400 transition" 
                          placeholder="Giá" 
                        />
                      </div>

                      <input type="number" value={opt.stock} onChange={(e) => {
                        const newOpts = [...variantFormData.options];
                        newOpts[oIdx].stock = Number(e.target.value);
                        setVariantFormData({...variantFormData, options: newOpts});
                      }} className="w-24 px-3 py-2 bg-slate-50 rounded-lg text-sm outline-none focus:ring-1 focus:ring-blue-400 transition" placeholder="Kho" />
                      
                      <button type="button" onClick={() => variantFormData.options.length > 1 && setVariantFormData({...variantFormData, options: variantFormData.options.filter((_, i) => i !== oIdx)})} className="text-slate-300 hover:text-red-400"><X size={16} /></button>
                    </div>
                  ))}
                  <button type="button" onClick={() => setVariantFormData({...variantFormData, options: [...variantFormData.options, {name: '', price: 0, stock: 0, sku: '', image: ''}]})} className="text-[10px] font-bold text-blue-500 hover:underline">+ Thêm tùy chọn</button>
                </div>

                <div className="flex gap-2">
                  <button type="button" onClick={saveVariant} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition">Lưu nhóm</button>
                  <button type="button" onClick={() => setIsAddingVariant(false)} className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-200 transition">Hủy</button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/50">
          <button type="button" onClick={onClose} className="px-6 py-2 text-slate-500 font-semibold text-sm hover:text-slate-700 transition">Hủy bỏ</button>
          <button onClick={() => {
            if (!formData.name || !formData.brandId || !formData.categorySlug || !formData.price) return alert('Vui lòng điền đủ các trường bắt buộc');
            onSubmit({...formData, variants});
          }} disabled={isLoading} className="px-8 py-2 bg-slate-900 text-white rounded-lg font-bold text-sm shadow-sm hover:bg-slate-800 transition flex items-center gap-2">
            {isLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={18} />}
            {product ? 'Lưu thay đổi' : 'Tạo sản phẩm'}
          </button>
        </div>
      </div>
    </div>
  );
}

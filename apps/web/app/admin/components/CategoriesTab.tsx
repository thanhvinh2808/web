// app/admin/components/CategoriesTab.tsx
'use client';
import React, { useState } from 'react';
import { API_URL } from '../config/constants';
import { Category } from '../types';
import { FolderTree, Plus, Pencil, Trash2, X, Image as ImageIcon } from 'lucide-react';

interface CategoriesTabProps {
  categories: Category[];
  token: string;
  onRefresh: () => void;
  showMessage: (msg: string) => void;
}

export default function CategoriesTab({ categories, token, onRefresh, showMessage }: CategoriesTabProps) {
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryForm, setCategoryForm] = useState({ name: '', description: '', icon: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [uploadingIcon, setUploadingIcon] = useState(false);

  const handleAdd = () => {
    setEditingCategory(null);
    setCategoryForm({ name: '', description: '', icon: '' });
    setShowCategoryModal(true);
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setCategoryForm({
      name: category.name || '',
      description: category.description || '',
      icon: category.icon || ''
    });
    setShowCategoryModal(true);
  };

  // ✅ XỬ LÝ UPLOAD ICON CHO DANH MỤC
  const handleIconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingIcon(true);
    try {
      const uploadFormData = new FormData();
      uploadFormData.append('image', file);
      
      const BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000').replace('/api', '');
      
      const res = await fetch(`${BASE_URL}/api/upload/single`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: uploadFormData
      });
      const data = await res.json();
      if (data.success) {
        // Trích xuất URL chuẩn xác từ object trả về
        const iconUrl = typeof data.data === 'string' ? data.data : (data.data.url || '');
        setCategoryForm(prev => ({ ...prev, icon: iconUrl }));
      }
    } catch (error) {
      console.error(error);
      showMessage('Lỗi upload ảnh');
    } finally {
      setUploadingIcon(false);
    }
  };

  const handleSubmit = async () => {
    if (!categoryForm.name.trim()) {
      showMessage('Vui lòng nhập tên danh mục');
      return;
    }

    setIsLoading(true);
    try {
      const slug = categoryForm.name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[đĐ]/g, 'd')
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '')
        .trim();

      const categoryData = {
        name: categoryForm.name.trim(),
        description: categoryForm.description?.trim() || '',
        icon: categoryForm.icon,
        slug
      };

      const url = editingCategory
        ? `${API_URL}/api/admin/categories/${editingCategory.slug}`
        : `${API_URL}/api/admin/categories`;
      
      const method = editingCategory ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(categoryData)
      });
      
      const data = await res.json();
      
      if (res.ok) {
        showMessage(editingCategory ? '✅ Đã cập nhật danh mục!' : '✅ Đã thêm danh mục mới!');
        setShowCategoryModal(false);
        onRefresh();
      } else {
        showMessage(`❌ ${data.message || 'Có lỗi xảy ra'}`);
      }
    } catch (error) {
      showMessage('Lỗi kết nối server');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteCategory = async (categorySlug: string) => {
    if (!window.confirm('⚠️ Bạn có chắc muốn xóa danh mục này?')) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/categories/${categorySlug}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        showMessage('✅ Đã xóa danh mục');
        onRefresh();
      }
    } catch (error) {
      showMessage('Lỗi khi xóa');
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-black italic tracking-tighter text-black uppercase flex items-center gap-2">
            <FolderTree /> Quản lý Danh mục
          </h2>
          <p className="text-gray-500 text-sm font-medium">Phân loại sản phẩm FootMark</p>
        </div>
        <button
          onClick={handleAdd}
          className="bg-black text-white px-6 py-2.5 rounded-lg font-bold uppercase text-xs tracking-wider hover:bg-stone-800 transition flex items-center gap-2 shadow-lg"
        >
          <Plus size={18}/> Thêm danh mục
        </button>
      </div>
      
      {categories.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
          <p className="text-gray-400 font-bold uppercase text-sm tracking-widest">Chưa có dữ liệu danh mục</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((category) => (
            <div key={category.id || category._id} className="bg-white border border-gray-100 rounded-2xl p-6 hover:shadow-xl transition group relative overflow-hidden">
              <div className="flex items-center gap-4 mb-4">
                 <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center border border-gray-100 overflow-hidden">
                    {category.icon ? (
                       <img src={category.icon} alt="" className="w-full h-full object-cover"/>
                    ) : (
                       <FolderTree className="text-gray-300" size={20}/>
                    )}
                 </div>
                 <div>
                    <h3 className="font-bold text-gray-900 leading-tight">{category.name}</h3>
                    <p className="text-[10px] text-gray-400 font-mono">/{category.slug}</p>
                 </div>
              </div>
              <p className="text-gray-500 text-xs line-clamp-2 mb-6 h-8">{category.description || 'Không có mô tả'}</p>
              
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleEdit(category)}
                  className="flex-1 bg-gray-100 text-gray-600 py-2 rounded-lg hover:bg-black hover:text-white transition font-bold text-[10px] uppercase"
                >
                  Sửa
                </button>
                <button
                  onClick={() => deleteCategory(category.slug)}
                  className="px-3 bg-red-50 text-red-500 py-2 rounded-lg hover:bg-red-500 hover:text-white transition font-bold"
                >
                  <Trash2 size={14}/>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CATEGORY MODAL */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-50 flex justify-between items-center">
               <h3 className="font-black italic text-xl uppercase tracking-tighter">
                 {editingCategory ? 'Chỉnh sửa danh mục' : 'Thêm danh mục mới'}
               </h3>
               <button onClick={() => setShowCategoryModal(false)} className="text-gray-400 hover:text-black transition"><X size={20}/></button>
            </div>

            <div className="p-6 space-y-5">
              {/* Icon Upload */}
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Ảnh đại diện / Logo</label>
                <div className="flex items-center gap-4">
                   <div className="w-16 h-16 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden relative group">
                      {categoryForm.icon ? (
                         <>
                            <img src={categoryForm.icon} alt="" className="w-full h-full object-cover"/>
                            <button onClick={() => setCategoryForm({...categoryForm, icon: ''})} className="absolute inset-0 bg-black/50 text-white opacity-0 group-hover:opacity-100 transition text-[8px] font-bold uppercase">Xóa</button>
                         </>
                      ) : (
                         <ImageIcon className="text-gray-300" size={24}/>
                      )}
                   </div>
                   <label className="cursor-pointer bg-gray-100 px-4 py-2 rounded-lg text-[10px] font-bold uppercase hover:bg-gray-200 transition">
                      {uploadingIcon ? 'Đang tải...' : 'Chọn ảnh'}
                      <input type="file" className="hidden" accept="image/*" onChange={handleIconUpload} disabled={uploadingIcon}/>
                   </label>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Tên danh mục *</label>
                <input
                  type="text"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-black outline-none font-bold"
                  placeholder="VD: Jordan, Lifestyle..."
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Mô tả</label>
                <textarea
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-black outline-none font-medium h-24 resize-none"
                  placeholder="Mô tả ngắn gọn về danh mục này..."
                  disabled={isLoading}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  onClick={handleSubmit}
                  disabled={isLoading || !categoryForm.name.trim()}
                  className="flex-1 bg-black text-white py-3 rounded-xl font-bold uppercase text-xs tracking-widest hover:bg-stone-800 disabled:bg-gray-200 transition shadow-lg"
                >
                  {isLoading ? 'Đang xử lý...' : (editingCategory ? 'Lưu thay đổi' : 'Tạo danh mục')}
                </button>
                <button 
                  onClick={() => setShowCategoryModal(false)}
                  className="px-6 bg-gray-100 text-gray-500 py-3 rounded-xl font-bold uppercase text-xs tracking-widest hover:bg-gray-200 transition"
                >
                  Hủy
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
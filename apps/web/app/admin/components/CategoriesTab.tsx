// app/admin/components/CategoriesTab.tsx
'use client';
import React, { useState } from 'react';
import { CLEAN_API_URL } from '@lib/shared/constants';
import { Category } from '../types';
import { FolderTree, Trash2, X } from 'lucide-react';

const BASE_URL = CLEAN_API_URL;

interface CategoriesTabProps {
  categories: Category[];
  token: string;
  onRefresh: () => void;
  showMessage: (msg: string) => void;
}

export default function CategoriesTab({ categories, token, onRefresh, showMessage }: CategoriesTabProps) {
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryForm, setCategoryForm] = useState({ name: '', description: '' });
  const [isLoading, setIsLoading] = useState(false);

  const handleAdd = () => {
    setEditingCategory(null);
    setCategoryForm({ name: '', description: '' });
    setShowCategoryModal(true);
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setCategoryForm({
      name: category.name || '',
      description: category.description || ''
    });
    setShowCategoryModal(true);
  };

  const handleSubmit = async () => {
    if (!categoryForm.name.trim()) return showMessage('Vui lòng nhập tên danh mục');
    setIsLoading(true);
    try {
      const categoryData = {
        ...categoryForm,
        icon: '', // Đảm bảo icon luôn trống
        slug: categoryForm.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[đĐ]/g, 'd').replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim()
      };
      const url = editingCategory ? `${BASE_URL}/api/admin/categories/${editingCategory.slug}` : `${BASE_URL}/api/admin/categories`;
      const res = await fetch(url, {
        method: editingCategory ? 'PUT' : 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(categoryData)
      });
      if (res.ok) { showMessage('✅ Thành công!'); setShowCategoryModal(false); onRefresh(); }
    } catch (error) { showMessage('Lỗi kết nối'); } finally { setIsLoading(false); }
  };

  const deleteCategory = async (slug: string) => {
    if (!window.confirm('⚠️ Xác nhận xóa?')) return;
    try {
      const res = await fetch(`${BASE_URL}/api/admin/categories/${slug}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) { showMessage('✅ Đã xóa'); onRefresh(); }
    } catch (error) { showMessage('Lỗi khi xóa'); }
  };

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-xl font-bold text-slate-800 uppercase tracking-tight">Quản lý Danh mục</h2>
          <p className="text-slate-500 text-xs font-medium">Phân loại sản phẩm FootMark</p>
        </div>
        <button onClick={handleAdd} className="px-5 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-blue-700 transition shadow-sm">Thêm mới</button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {categories.map((category) => (
          <div key={category._id} className="bg-white border border-slate-200 rounded-xl p-5 hover:border-blue-300 transition group relative">
            <div className="flex items-center gap-3 mb-3">
               <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center border border-slate-100">
                  <FolderTree className="text-slate-300" size={18}/>
               </div>
               <div>
                  <h3 className="font-bold text-slate-800 text-sm">{category.name}</h3>
                  <p className="text-[10px] text-slate-400 font-mono">/{category.slug}</p>
               </div>
            </div>
            <p className="text-slate-500 text-xs line-clamp-1 mb-4 h-4">{category.description || 'Không có mô tả'}</p>
            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => handleEdit(category)} className="flex-1 bg-slate-50 text-slate-600 py-1.5 rounded-lg hover:bg-slate-900 hover:text-white transition font-bold text-[10px] uppercase">Sửa</button>
              <button onClick={() => deleteCategory(category.slug)} className="px-3 bg-red-50 text-red-500 py-1.5 rounded-lg hover:bg-red-500 hover:text-white transition font-bold"><Trash2 size={14}/></button>
            </div>
          </div>
        ))}
      </div>

      {showCategoryModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md shadow-xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
               <h3 className="font-bold text-slate-800">{editingCategory ? 'Chỉnh sửa danh mục' : 'Thêm danh mục mới'}</h3>
               <button onClick={() => setShowCategoryModal(false)} className="text-slate-400 hover:text-slate-600 transition"><X size={20}/></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Tên danh mục *</label>
                <input
                  type="text"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none font-medium text-sm transition"
                  placeholder="VD: Giày Chạy Bộ..."
                  disabled={isLoading}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Mô tả</label>
                <textarea
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:border-blue-500 outline-none font-medium text-sm h-24 resize-none transition"
                  placeholder="Mô tả công dụng của danh mục..."
                  disabled={isLoading}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={handleSubmit} disabled={isLoading} className="flex-1 bg-slate-900 text-white py-2.5 rounded-lg font-bold uppercase text-xs hover:bg-slate-800 transition shadow-sm">Lưu lại</button>
                <button onClick={() => setShowCategoryModal(false)} className="px-6 bg-slate-100 text-slate-500 py-2.5 rounded-lg font-bold uppercase text-xs hover:bg-slate-200 transition">Hủy</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

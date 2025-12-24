// app/admin/components/CategoriesTab.tsx
'use client';
import React, { useState } from 'react';
import { API_URL } from '../config/constants';
import { Category } from '../types';

interface CategoriesTabProps {
  categories: Category[];
  token: string;
  onRefresh: () => void;
  showMessage: (msg: string) => void;
}

export default function CategoriesTab({ categories, token, onRefresh, showMessage }: CategoriesTabProps) {
  console.log('🎨 CategoriesTab rendered with', categories.length, 'categories');
  
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
    // Validate form
    if (!categoryForm.name.trim()) {
      showMessage('Vui lòng nhập tên danh mục');
      return;
    }

    console.log('=== CATEGORY SUBMIT ===');
    console.log('Token available:', !!token);
    console.log('Token length:', token?.length);
    console.log('Is editing:', !!editingCategory);

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

      // Đảm bảo description không undefined
      const categoryData = {
        name: categoryForm.name.trim(),
        description: categoryForm.description?.trim() || '',
        slug
      };

      console.log('Sending category data:', categoryData);

      const url = editingCategory
        ? `${API_URL}/admin/categories/${editingCategory.slug}`
        : `${API_URL}/admin/categories`;
      
      const method = editingCategory ? 'PUT' : 'POST';
      
      console.log('Request URL:', url);
      console.log('Request method:', method);
      console.log('Authorization header:', `Bearer ${token}`);
      
      const res = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(categoryData)
      });
      
      // Đọc response text trước để debug
      const responseText = await res.text();
      console.log('Response status:', res.status);
      console.log('Response body:', responseText);
      
      if (!res.ok) {
        // Thử parse JSON để lấy error message
        try {
          const errorData = JSON.parse(responseText);
          console.log('❌ Error from backend:', errorData);
          
          // Hiển thị error message chi tiết hơn
          if (errorData.message === 'Danh mục này đã tồn tại') {
            showMessage('⚠️ Danh mục này đã tồn tại! Vui lòng kiểm tra danh sách hoặc dùng tên khác.');
          } else {
            showMessage(errorData.message || `Lỗi ${res.status}: ${res.statusText}`);
          }
        } catch {
          showMessage(`Lỗi ${res.status}: ${responseText || res.statusText}`);
        }
        return;
      }
      
      const data = JSON.parse(responseText);
      
      if (data.success) {
        showMessage(editingCategory ? 'Cập nhật danh mục thành công!' : 'Thêm danh mục thành công!');
        setShowCategoryModal(false);
        setEditingCategory(null);
        setCategoryForm({ name: '', description: '' });
        
        console.log('✅ Category saved successfully, calling onRefresh...');
        onRefresh(); // ⭐ Gọi refresh
        
        // Force re-render sau 100ms để đảm bảo
        setTimeout(() => {
          console.log('🔄 Delayed refresh...');
          onRefresh();
        }, 100);
      } else {
        showMessage(data.message || 'Có lỗi xảy ra');
      }
    } catch (error) {
      console.error('Error submitting category:', error);
      showMessage('Lỗi kết nối server: ' + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteCategory = async (categorySlug: string) => {
    if (!categorySlug) {
      showMessage('Không tìm thấy slug của danh mục');
      return;
    }
    
    if (!window.confirm('Bạn có chắc muốn xóa danh mục này?')) return;
    
    try {
      const res = await fetch(`${API_URL}/admin/categories/${categorySlug}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      if (data.success) {
        showMessage('Xóa danh mục thành công!');
        onRefresh();
      } else {
        showMessage(data.message || 'Không thể xóa danh mục');
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      showMessage('Lỗi khi xóa danh mục');
    }
  };

  const handleCloseModal = () => {
    setShowCategoryModal(false);
    setEditingCategory(null);
    setCategoryForm({ name: '', description: '' });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">📁 Quản lý Categories</h2>
        <button
          onClick={handleAdd}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          ➕ Thêm danh mục
        </button>
      </div>
      
      {categories.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500">Chưa có danh mục nào. Hãy thêm danh mục đầu tiên!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => (
            <div key={category.id || category._id || category.slug} className="bg-white border rounded-lg p-6 hover:shadow-lg transition">
              <h3 className="font-semibold text-xl mb-2">{category.name}</h3>
              <p className="text-gray-600 mb-4 min-h-[3rem]">{category.description || 'Chưa có mô tả'}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(category)}
                  className="flex-1 px-3 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 text-sm transition"
                >
                  ✏️ Sửa
                </button>
                <button
                  onClick={() => deleteCategory(category.slug)}
                  className="flex-1 px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm transition"
                  disabled={!category.slug}
                >
                  🗑️ Xóa
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCategoryModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isLoading) {
              handleCloseModal();
            }
          }}
        >
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4">
              {editingCategory ? '✏️ Sửa danh mục' : '➕ Thêm danh mục mới'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Tên danh mục <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="Smartphone, Laptop, ..."
                  disabled={isLoading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Mô tả</label>
                <textarea
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                  rows={3}
                  placeholder="Mô tả danh mục..."
                  disabled={isLoading}
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button 
                  onClick={handleSubmit}
                  disabled={isLoading || !categoryForm.name.trim()}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
                >
                  {isLoading ? 'Đang xử lý...' : (editingCategory ? 'Cập nhật' : 'Thêm mới')}
                </button>
                <button 
                  onClick={handleCloseModal}
                  disabled={isLoading}
                  className="flex-1 bg-gray-300 py-2 rounded-lg hover:bg-gray-400 disabled:bg-gray-200 disabled:cursor-not-allowed transition"
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
// apps/web/app/admin/components/BrandsTab.tsx
'use client';
import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, X, Check, Search, Tag } from 'lucide-react';

interface Brand {
  _id: string;
  name: string;
  slug: string;
  logo?: string;
  description?: string;
}

interface BrandsTabProps {
  token: string;
  apiUrl: string;
}

export default function BrandsTab({ token, apiUrl }: BrandsTabProps) {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [searchTerm, setSearchKeyword] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    logo: '',
    description: ''
  });

  const fetchBrands = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`${apiUrl}/api/admin/brands`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setBrands(data.brands || data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchBrands(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingBrand 
        ? `${apiUrl}/api/admin/brands/${editingBrand._id}` 
        : `${apiUrl}/api/admin/brands`;
      
      const res = await fetch(url, {
        method: editingBrand ? 'PUT' : 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        setIsModalOpen(false);
        setEditingBrand(null);
        setFormData({ name: '', logo: '', description: '' });
        fetchBrands();
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa thương hiệu này?')) return;
    try {
      const res = await fetch(`${apiUrl}/api/admin/brands/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) fetchBrands();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const openEdit = (brand: Brand) => {
    setEditingBrand(brand);
    setFormData({
      name: brand.name,
      logo: brand.logo || '',
      description: brand.description || ''
    });
    setIsModalOpen(true);
  };

  const filteredBrands = brands.filter(b => 
    b.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black italic uppercase tracking-tighter">Quản Lý Thương Hiệu</h2>
          <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Tất cả hãng giày đang hợp tác</p>
        </div>
        <button 
          onClick={() => { setEditingBrand(null); setFormData({ name: '', logo: '', description: '' }); setIsModalOpen(true); }}
          className="bg-black text-white px-6 py-3 font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-stone-800 transition shadow-xl"
        >
          <Plus size={16} /> Thêm Thương Hiệu
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <input 
          type="text" 
          placeholder="Tìm kiếm thương hiệu..." 
          value={searchTerm}
          onChange={(e) => setSearchKeyword(e.target.value)}
          className="w-full bg-white border-none rounded-none py-4 pl-12 pr-4 text-xs font-bold uppercase tracking-widest focus:ring-2 focus:ring-black outline-none shadow-sm"
        />
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
      </div>

      <div className="bg-white shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Logo</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Tên Thương Hiệu</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Slug</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 text-right">Thao Tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {isLoading ? (
              <tr><td colSpan={4} className="px-6 py-8 text-center text-xs font-bold uppercase text-gray-400 animate-pulse">Đang tải dữ liệu...</td></tr>
            ) : filteredBrands.length === 0 ? (
              <tr><td colSpan={4} className="px-6 py-8 text-center text-xs font-bold uppercase text-gray-400">Không tìm thấy thương hiệu nào</td></tr>
            ) : (
              filteredBrands.map((brand) => (
                <tr key={brand._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="w-10 h-10 bg-gray-50 flex items-center justify-center font-black text-xs text-gray-300 overflow-hidden">
                      {brand.logo ? <img src={brand.logo} alt={brand.name} className="w-full h-full object-contain" /> : 'LOGO'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-xs font-black uppercase italic tracking-tighter">{brand.name}</p>
                  </td>
                  <td className="px-6 py-4">
                    <code className="text-[10px] bg-gray-100 px-2 py-1 text-gray-500 font-bold">{brand.slug}</code>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => openEdit(brand)} className="p-2 hover:bg-blue-50 text-blue-600 transition"><Edit size={16} /></button>
                      <button onClick={() => handleDelete(brand._id)} className="p-2 hover:bg-red-50 text-red-600 transition"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-xl font-black italic uppercase tracking-tighter">
                {editingBrand ? 'Chỉnh Sửa Thương Hiệu' : 'Thêm Thương Hiệu Mới'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-black transition"><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Tên Thương Hiệu</label>
                <input 
                  type="text" 
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-gray-50 border-none py-3 px-4 text-xs font-bold focus:ring-2 focus:ring-black outline-none"
                  placeholder="VD: Nike, Adidas..."
                />
              </div>
              
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">URL Logo (Tùy chọn)</label>
                <input 
                  type="text"
                  value={formData.logo}
                  onChange={(e) => setFormData({...formData, logo: e.target.value})}
                  className="w-full bg-gray-50 border-none py-3 px-4 text-xs font-bold focus:ring-2 focus:ring-black outline-none"
                  placeholder="https://..."
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Mô tả</label>
                <textarea 
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full bg-gray-50 border-none py-3 px-4 text-xs font-bold focus:ring-2 focus:ring-black outline-none h-24 resize-none"
                  placeholder="Mô tả ngắn về hãng giày..."
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button type="submit" className="flex-1 bg-black text-white py-4 font-black text-xs uppercase tracking-widest hover:bg-stone-800 transition">
                  {editingBrand ? 'Lưu Thay Đổi' : 'Tạo Thương Hiệu'}
                </button>
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-8 border-2 border-gray-200 font-black text-xs uppercase tracking-widest hover:bg-gray-50 transition">Hủy</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

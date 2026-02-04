"use client";

import { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Tag, Calendar, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface Voucher {
  _id: string;
  code: string;
  description: string;
  discountType: 'fixed' | 'percent';
  discountValue: number;
  maxDiscount?: number;
  minOrderValue?: number;
  startDate?: string;
  endDate: string;
  usageLimit: number;
  usedCount: number;
  isActive: boolean;
}

export default function AdminVouchersPage() {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState<Voucher | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discountType: 'fixed',
    discountValue: 0,
    maxDiscount: 0,
    minOrderValue: 0,
    startDate: '',
    endDate: '',
    usageLimit: 100,
    isActive: true
  });

  // Fetch Vouchers
  const fetchVouchers = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || '$ {process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}'}/api/admin/vouchers?search=${searchTerm}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setVouchers(data.data);
      }
    } catch (error) {
      console.error(error);
      toast.error('Lỗi tải danh sách voucher');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVouchers();
  }, [searchTerm]);

  // Handle Form Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    
    try {
      const url = editingVoucher 
        ? `${process.env.NEXT_PUBLIC_API_URL || '$ {process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}'}/api/admin/vouchers/${editingVoucher._id}`
        : `${process.env.NEXT_PUBLIC_API_URL || '$ {process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}'}/api/admin/vouchers`;
      
      const method = editingVoucher ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (data.success) {
        toast.success(editingVoucher ? 'Cập nhật thành công!' : 'Tạo voucher thành công!');
        fetchVouchers();
        setShowModal(false);
        resetForm();
      } else {
        toast.error(data.message || 'Có lỗi xảy ra');
      }
    } catch (error) {
      toast.error('Lỗi kết nối server');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa voucher này?')) return;
    
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || '$ {process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}'}/api/admin/vouchers/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        toast.success('Đã xóa voucher');
        fetchVouchers();
      } else {
        toast.error('Lỗi xóa voucher');
      }
    } catch (error) {
      console.error(error);
    }
  };

  const resetForm = () => {
    setEditingVoucher(null);
    setFormData({
      code: '',
      description: '',
      discountType: 'fixed',
      discountValue: 0,
      maxDiscount: 0,
      minOrderValue: 0,
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      usageLimit: 100,
      isActive: true
    });
  };

  const openEdit = (voucher: Voucher) => {
    setEditingVoucher(voucher);
    setFormData({
      code: voucher.code,
      description: voucher.description,
      discountType: voucher.discountType,
      discountValue: voucher.discountValue,
      maxDiscount: voucher.maxDiscount || 0,
      minOrderValue: voucher.minOrderValue || 0,
      startDate: voucher.startDate ? new Date(voucher.startDate).toISOString().split('T')[0] : '',
      endDate: new Date(voucher.endDate).toISOString().split('T')[0],
      usageLimit: voucher.usageLimit,
      isActive: voucher.isActive
    });
    setShowModal(true);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Quản Lý Mã Giảm Giá</h1>
        <button 
          onClick={() => { resetForm(); setShowModal(true); }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition shadow-sm"
        >
          <Plus size={20} /> Thêm Voucher
        </button>
      </div>

      {/* Search & Stats */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 mb-6 flex gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text"
            placeholder="Tìm kiếm theo mã voucher..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 font-semibold text-gray-700">Mã Voucher</th>
              <th className="px-6 py-4 font-semibold text-gray-700">Loại Giảm Giá</th>
              <th className="px-6 py-4 font-semibold text-gray-700">Giá Trị</th>
              <th className="px-6 py-4 font-semibold text-gray-700">Đơn Tối Thiểu</th>
              <th className="px-6 py-4 font-semibold text-gray-700">Hạn Dùng</th>
              <th className="px-6 py-4 font-semibold text-gray-700">Lượt Dùng</th>
              <th className="px-6 py-4 font-semibold text-gray-700">Trạng Thái</th>
              <th className="px-6 py-4 font-semibold text-gray-700 text-right">Hành Động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={8} className="text-center py-8">Đang tải...</td></tr>
            ) : vouchers.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-8 text-gray-500">Chưa có voucher nào.</td></tr>
            ) : (
              vouchers.map(v => (
                <tr key={v._id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4">
                    <div className="font-bold text-blue-600">{v.code}</div>
                    <div className="text-xs text-gray-500 truncate max-w-[200px]">{v.description}</div>
                  </td>
                  <td className="px-6 py-4">
                    {v.discountType === 'percent' ? (
                      <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs font-medium">Phần trăm</span>
                    ) : (
                      <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-medium">Tiền mặt</span>
                    )}
                  </td>
                  <td className="px-6 py-4 font-medium">
                    {v.discountType === 'percent' ? `${v.discountValue}%` : formatCurrency(v.discountValue)}
                  </td>
                  <td className="px-6 py-4 text-gray-600 text-sm">{formatCurrency(v.minOrderValue || 0)}</td>
                  <td className="px-6 py-4 text-sm">
                    {new Date(v.endDate).toLocaleDateString('vi-VN')}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {v.usedCount} / {v.usageLimit}
                  </td>
                  <td className="px-6 py-4">
                     <span className={`px-2 py-1 rounded-full text-xs font-semibold ${v.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {v.isActive ? 'Hoạt động' : 'Đã khóa'}
                     </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => openEdit(v)} className="text-blue-600 hover:bg-blue-50 p-2 rounded mr-1">
                      <Edit2 size={18} />
                    </button>
                    <button onClick={() => handleDelete(v._id)} className="text-red-600 hover:bg-red-50 p-2 rounded">
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800">
                {editingVoucher ? 'Cập nhật Voucher' : 'Tạo Voucher Mới'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <Trash2 className="hidden" /> {/* Dummy to keep imports clean if needed later */}
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mã Voucher *</label>
                  <input 
                    type="text" required
                    value={formData.code}
                    onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})}
                    disabled={!!editingVoucher}
                    className="w-full border rounded-lg px-3 py-2 uppercase font-bold tracking-wider focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100"
                    placeholder="SALE50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Loại giảm giá</label>
                  <select 
                    value={formData.discountType}
                    onChange={e => setFormData({...formData, discountType: e.target.value as any})}
                    className="w-full border rounded-lg px-3 py-2 outline-none"
                  >
                    <option value="fixed">Giảm theo tiền mặt (VNĐ)</option>
                    <option value="percent">Giảm theo phần trăm (%)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả *</label>
                <input 
                  type="text" required
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Giảm 50k cho đơn từ 200k..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">
                      Giá trị giảm {formData.discountType === 'percent' ? '(%)' : '(VNĐ)'} *
                   </label>
                   <input 
                    type="number" required min="0"
                    value={formData.discountValue}
                    onChange={e => setFormData({...formData, discountValue: Number(e.target.value)})}
                    className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                   />
                </div>
                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Đơn tối thiểu (VNĐ)</label>
                   <input 
                    type="number" min="0"
                    value={formData.minOrderValue}
                    onChange={e => setFormData({...formData, minOrderValue: Number(e.target.value)})}
                    className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                   />
                </div>
              </div>

              {formData.discountType === 'percent' && (
                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Giảm tối đa (VNĐ)</label>
                   <input 
                    type="number" min="0"
                    value={formData.maxDiscount}
                    onChange={e => setFormData({...formData, maxDiscount: Number(e.target.value)})}
                    className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Nhập 0 nếu không giới hạn"
                   />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Ngày bắt đầu</label>
                   <input 
                    type="date"
                    value={formData.startDate}
                    onChange={e => setFormData({...formData, startDate: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2 outline-none"
                   />
                </div>
                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Ngày kết thúc *</label>
                   <input 
                    type="date" required
                    value={formData.endDate}
                    onChange={e => setFormData({...formData, endDate: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2 outline-none"
                   />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                 <div className="w-1/2 pr-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Giới hạn lượt dùng</label>
                    <input 
                      type="number" min="1"
                      value={formData.usageLimit}
                      onChange={e => setFormData({...formData, usageLimit: Number(e.target.value)})}
                      className="w-full border rounded-lg px-3 py-2 outline-none"
                    />
                 </div>
                 <div className="w-1/2 pl-2 flex items-center pt-6">
                    <input 
                      type="checkbox" id="isActive"
                      checked={formData.isActive}
                      onChange={e => setFormData({...formData, isActive: e.target.checked})}
                      className="w-5 h-5 text-blue-600 rounded mr-2"
                    />
                    <label htmlFor="isActive" className="text-gray-700 font-medium cursor-pointer">Kích hoạt ngay</label>
                 </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                >
                  Hủy
                </button>
                <button 
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                >
                  {editingVoucher ? 'Cập nhật' : 'Tạo mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

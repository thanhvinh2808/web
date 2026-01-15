// app/admin/components/VouchersTab.tsx
'use client';
import { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Tag, Calendar, X, Check, Ticket, Percent, DollarSign } from 'lucide-react';
import { API_URL } from '../config/constants';

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

interface VouchersTabProps {
  token: string;
  showMessage: (msg: string) => void;
}

export default function VouchersTab({ token, showMessage }: VouchersTabProps) {
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

  const fetchVouchers = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/vouchers?search=${searchTerm}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setVouchers(data.data);
    } catch (error) {
      console.error(error);
      showMessage('Lỗi tải danh sách voucher');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchVouchers();
  }, [searchTerm, token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingVoucher 
        ? `${API_URL}/api/admin/vouchers/${editingVoucher._id}`
        : `${API_URL}/api/admin/vouchers`;
      const method = editingVoucher ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.success) {
        showMessage(editingVoucher ? '✅ Cập nhật thành công!' : '✅ Tạo voucher thành công!');
        fetchVouchers();
        setShowModal(false);
      } else {
        showMessage(`❌ ${data.message || 'Có lỗi xảy ra'}`);
      }
    } catch (error) {
      showMessage('Lỗi kết nối server');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('⚠️ Bạn có chắc muốn xóa voucher này?')) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/vouchers/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        showMessage('✅ Đã xóa voucher');
        fetchVouchers();
      }
    } catch (error) { console.error(error); }
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
      discountType: voucher.discountType as any,
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
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-black italic tracking-tighter text-black uppercase flex items-center gap-2">
            <Tag /> Quản Lý Voucher
          </h2>
          <p className="text-gray-500 text-sm font-medium">Chiến dịch khuyến mãi FootMark</p>
        </div>
        <button 
          onClick={() => { resetForm(); setShowModal(true); }}
          className="bg-black text-white px-6 py-2.5 rounded-lg font-bold uppercase text-xs tracking-wider hover:bg-stone-800 transition flex items-center gap-2 shadow-lg"
        >
          <Plus size={18} /> Thêm Voucher
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-8 flex gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text"
            placeholder="Tìm theo mã voucher..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-2.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-black outline-none font-medium transition-all"
          />
        </div>
      </div>

      {/* Voucher Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-20 text-center text-gray-400 font-bold uppercase tracking-widest">Đang tải dữ liệu...</div>
        ) : vouchers.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200 text-gray-400 font-bold uppercase tracking-widest">Không tìm thấy voucher</div>
        ) : (
          vouchers.map(v => (
            <div key={v._id} className="bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-xl transition-all group">
               {/* Top Part: Coupon Style */}
               <div className={`p-6 relative ${v.isActive ? 'bg-black text-white' : 'bg-gray-100 text-gray-400'}`}>
                  <div className="absolute -right-4 -top-4 w-12 h-12 bg-white rounded-full group-hover:scale-110 transition-transform"></div>
                  <div className="absolute -right-4 -bottom-4 w-12 h-12 bg-white rounded-full group-hover:scale-110 transition-transform"></div>
                  
                  <div className="flex justify-between items-start mb-4">
                     <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-tighter ${v.isActive ? 'bg-blue-600 text-white' : 'bg-gray-300 text-white'}`}>
                        {v.discountType === 'percent' ? 'Discount %' : 'Cash Off'}
                     </span>
                     <div className="flex gap-1">
                        <button onClick={() => openEdit(v)} className="p-1.5 hover:bg-white/20 rounded-lg transition"><Edit2 size={14}/></button>
                        <button onClick={() => handleDelete(v._id)} className="p-1.5 hover:bg-red-500/20 text-red-400 rounded-lg transition"><Trash2 size={14}/></button>
                     </div>
                  </div>
                  
                  <h3 className="text-3xl font-black italic tracking-tighter mb-1">{v.code}</h3>
                  <p className={`text-xs font-medium ${v.isActive ? 'text-gray-400' : 'text-gray-400'}`}>{v.description}</p>
               </div>

               {/* Bottom Part: Info */}
               <div className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                     <div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Giá trị</span>
                        <span className="font-black text-black">
                           {v.discountType === 'percent' ? `${v.discountValue}%` : formatCurrency(v.discountValue)}
                        </span>
                     </div>
                     <div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Đơn tối thiểu</span>
                        <span className="font-black text-black">{formatCurrency(v.minOrderValue || 0)}</span>
                     </div>
                  </div>

                  <div className="border-t border-dashed border-gray-100 pt-4 flex justify-between items-center">
                     <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-tighter">
                        <Calendar size={14}/>
                        Hết hạn: {new Date(v.endDate).toLocaleDateString('vi-VN')}
                     </div>
                     <div className="text-right">
                        <span className="text-[10px] font-bold text-gray-400 uppercase block">Đã dùng</span>
                        <span className="font-black text-black text-sm">{v.usedCount} / {v.usageLimit}</span>
                     </div>
                  </div>
               </div>
            </div>
          ))
        )}
      </div>

      {/* VOUCHER MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            <div className="px-8 py-6 border-b border-gray-50 flex justify-between items-center sticky top-0 bg-white z-10">
              <h2 className="text-2xl font-black italic tracking-tighter text-black uppercase">
                {editingVoucher ? 'Cập nhật Voucher' : 'Tạo Voucher Mới'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-black transition">
                <X size={24}/>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Mã Voucher *</label>
                  <input 
                    type="text" required
                    value={formData.code}
                    onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})}
                    disabled={!!editingVoucher}
                    className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 uppercase font-black tracking-widest focus:ring-2 focus:ring-black outline-none disabled:bg-gray-100"
                    placeholder="VD: FOOTMARK50"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Loại giảm giá</label>
                  <div className="flex bg-gray-50 rounded-xl p-1">
                     <button 
                        type="button"
                        onClick={() => setFormData({...formData, discountType: 'fixed'})}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg font-bold text-xs transition ${formData.discountType === 'fixed' ? 'bg-white shadow-sm text-black' : 'text-gray-400'}`}
                     >
                        <DollarSign size={14}/> Tiền mặt
                     </button>
                     <button 
                        type="button"
                        onClick={() => setFormData({...formData, discountType: 'percent'})}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg font-bold text-xs transition ${formData.discountType === 'percent' ? 'bg-white shadow-sm text-black' : 'text-gray-400'}`}
                     >
                        <Percent size={14}/> Phần trăm
                     </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Mô tả hiển thị *</label>
                <input 
                  type="text" required
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 font-medium outline-none focus:ring-2 focus:ring-black"
                  placeholder="Giảm 50k cho đôi giày thứ 2..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                   <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                      Giá trị giảm {formData.discountType === 'percent' ? '(%)' : '(VNĐ)'} *
                   </label>
                   <input 
                    type="number" required min="0"
                    value={formData.discountValue}
                    onChange={e => setFormData({...formData, discountValue: Number(e.target.value)})}
                    className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 font-black text-lg outline-none focus:ring-2 focus:ring-black"
                   />
                </div>
                <div>
                   <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Đơn tối thiểu (VNĐ)</label>
                   <input 
                    type="number" min="0"
                    value={formData.minOrderValue}
                    onChange={e => setFormData({...formData, minOrderValue: Number(e.target.value)})}
                    className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 font-black text-lg outline-none focus:ring-2 focus:ring-black"
                   />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                   <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Ngày bắt đầu</label>
                   <input 
                    type="date"
                    value={formData.startDate}
                    onChange={e => setFormData({...formData, startDate: e.target.value})}
                    className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 font-bold text-sm"
                   />
                </div>
                <div>
                   <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Ngày kết thúc *</label>
                   <input 
                    type="date" required
                    value={formData.endDate}
                    onChange={e => setFormData({...formData, endDate: e.target.value})}
                    className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 font-bold text-sm border-2 border-red-50"
                   />
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                 <div className="flex items-center gap-3">
                    <input 
                      type="checkbox" id="isActive"
                      checked={formData.isActive}
                      onChange={e => setFormData({...formData, isActive: e.target.checked})}
                      className="w-6 h-6 text-black rounded-lg border-none bg-gray-100 focus:ring-0 cursor-pointer"
                    />
                    <label htmlFor="isActive" className="text-sm font-black uppercase tracking-widest cursor-pointer">Hoạt động</label>
                 </div>
                 <div className="flex items-center gap-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Giới hạn:</label>
                    <input 
                      type="number" min="1"
                      value={formData.usageLimit}
                      onChange={e => setFormData({...formData, usageLimit: Number(e.target.value)})}
                      className="w-24 bg-gray-50 border-none rounded-lg px-3 py-1.5 font-bold text-center outline-none focus:ring-2 focus:ring-black"
                    />
                 </div>
              </div>

              <div className="flex justify-end gap-4 pt-6">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  className="px-8 bg-gray-100 text-gray-500 py-4 rounded-2xl font-bold uppercase text-xs tracking-widest hover:bg-gray-200 transition"
                >
                  Hủy bỏ
                </button>
                <button 
                  type="submit"
                  className="flex-1 bg-black text-white py-4 rounded-2xl font-bold uppercase text-xs tracking-widest hover:bg-stone-800 transition shadow-xl"
                >
                  {editingVoucher ? 'Lưu thay đổi' : 'Tạo chiến dịch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
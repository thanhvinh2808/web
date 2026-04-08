"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Plus, MapPin, Trash2, CheckCircle2, ChevronDown, X } from 'lucide-react';
import { CLEAN_API_URL as API_URL } from '@lib/shared/constants';

// --- Reusable Component: Autocomplete Select ---
function removeAccents(str: string) {
  return str.normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd').replace(/Đ/g, 'D')
    .toLowerCase();
}

const AutocompleteSelect = ({ value, options, onChange, placeholder, disabled }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');

  useEffect(() => {
    const selected = options.find((opt: any) => String(opt.code) === String(value));
    if (selected) setQuery(selected.name);
    else if (!value) setQuery('');
  }, [value, options]);

  const filtered = query === '' 
    ? options 
    : options.filter((opt: any) => removeAccents(opt.name).includes(removeAccents(query)));

  return (
    <div className="relative mb-3">
       <input
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setIsOpen(true); if(!e.target.value) onChange(''); }}
          onFocus={() => !disabled && setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 200)}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:border-gray-500 outline-none text-sm"
        />
        {isOpen && !disabled && (
           <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 shadow-lg max-h-48 overflow-auto">
             {filtered.map((opt: any) => (
               <div 
                 key={opt.code} 
                 onMouseDown={() => { onChange(String(opt.code)); setQuery(opt.name); setIsOpen(false); }}
                 className="px-4 py-2 text-sm hover:bg-gray-100 cursor-pointer"
               >
                 {opt.name}
               </div>
             ))}
           </div>
        )}
    </div>
  );
};

export default function AddressPage() {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  
  const [form, setForm] = useState({
    name: '',
    phone: '',
    city: '',
    district: '',
    ward: '',
    address: '',
    isDefault: false
  });

  const [provinces, setProvinces] = useState<any[]>([]);
  const [wards, setWards] = useState<any[]>([]);
  const [provinceCode, setProvinceCode] = useState('');
  const [wardCode, setWardCode] = useState('');

  const fetchAddresses = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch(`${API_URL}/api/user/addresses`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setAddresses(data.addresses);
          const u = JSON.parse(localStorage.getItem('user') || '{}');
          u.addresses = data.addresses;
          localStorage.setItem('user', JSON.stringify(u));
        }
      }
    } catch (err) {
      console.error('Error fetching addresses:', err);
    }
  };

  useEffect(() => {
    fetchAddresses();
    
    fetch('https://provinces.open-api.vn/api/p/')
      .then(res => res.json())
      .then(data => setProvinces(data));
  }, []);

  useEffect(() => {
    if (provinceCode) {
      fetch(`https://provinces.open-api.vn/api/p/${provinceCode}?depth=3`)
        .then(res => res.json())
        .then(data => {
            const allWards: any[] = [];
            if (data.districts) {
                data.districts.forEach((dist: any) => {
                    if (dist.wards) {
                        const w = dist.wards.map((ward: any) => ({
                            ...ward,
                            name: `${ward.name} (${dist.name})`
                        }));
                        allWards.push(...w);
                    }
                });
            }
            setWards(allWards);
        });
    } else {
      setWards([]);
    }
  }, [provinceCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.city || !form.ward) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/user/addresses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(form)
      });

      if (res.ok) {
        await fetchAddresses();
        setShowModal(false);
        resetForm();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const resetForm = () => {
    setForm({ name: '', phone: '', city: '', district: '', ward: '', address: '', isDefault: false });
    setProvinceCode('');
    setWardCode('');
  };

  const handleDelete = async (id: string) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}/api/user/addresses/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) await fetchAddresses();
  };

  const handleSetDefault = async (id: string) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}/api/user/addresses/${id}/default`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) await fetchAddresses();
  };

  return (
    <div>
      <div className="flex justify-between items-center border-b border-gray-100 pb-4 mb-6">
        <h1 className="text-xl font-black italic uppercase tracking-tighter text-black">Địa Chỉ Của Tôi</h1>
        <button 
          onClick={() => { resetForm(); setShowModal(true); }}
          className="border-2 border-blue-600 bg-white text-blue-600 px-6 py-2 rounded-none text-xs font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all shadow-sm"
        >
          <Plus size={14} className="inline mb-0.5 mr-1" /> Thêm Địa Chỉ Mới
        </button>
      </div>

      <div className="space-y-6">
        {addresses.length === 0 ? (
           <p className="text-center text-gray-400 py-10 font-bold uppercase text-xs tracking-widest">Bạn chưa có địa chỉ nào.</p>
        ) : (
            addresses.map((addr: any) => (
                <div key={addr._id} className="border border-gray-100 p-6 flex justify-between items-start bg-white shadow-sm">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="font-black text-lg italic uppercase tracking-tighter text-black">{addr.name}</span>
                            <span className="text-gray-300">|</span>
                            <span className="text-gray-500 font-bold">{addr.phone}</span>
                        </div>
                        <div className="text-sm text-gray-600 font-medium space-y-1">
                            <p className="flex items-start gap-2"><MapPin size={14} className="mt-1 text-gray-400"/> {addr.specificAddress || addr.address}</p>
                            <p className="pl-5">{addr.ward}, {addr.city}</p>
                        </div>
                        {addr.isDefault && (
                            <span className="mt-4 inline-block border-2 border-blue-600 text-blue-600 text-[10px] font-black px-2 py-0.5 uppercase tracking-widest">Mặc định</span>
                        )}
                    </div>
                    <div className="flex flex-col items-end gap-4">
                        {!addr.isDefault && (
                            <button onClick={() => handleDelete(addr._id)} className="text-gray-400 hover:text-red-600 font-bold text-xs uppercase tracking-widest underline transition-colors">Xóa</button>
                        )}
                        {!addr.isDefault && (
                             <button 
                                onClick={() => handleSetDefault(addr._id)}
                                className="border-2 border-blue-600 bg-white text-blue-600 px-4 py-2 rounded-none text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                             >
                                Thiết lập mặc định
                             </button>
                        )}
                    </div>
                </div>
            ))
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white w-full max-w-lg shadow-2xl overflow-hidden border border-gray-100">
                <div className="px-8 py-6 border-b border-gray-100 font-black text-xl italic uppercase tracking-tighter">Địa chỉ mới</div>
                <form onSubmit={handleSubmit} className="p-8 max-h-[80vh] overflow-y-auto space-y-4">
                    <div className="flex gap-4">
                        <div className="w-1/2">
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Họ và tên</label>
                            <input 
                                type="text" required
                                value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                                className="w-full border-2 border-gray-100 px-4 py-3 outline-none focus:border-black transition-colors font-bold text-sm"
                            />
                        </div>
                        <div className="w-1/2">
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Số điện thoại</label>
                            <input 
                                type="text" required
                                value={form.phone} onChange={e => setForm({...form, phone: e.target.value})}
                                className="w-full border-2 border-gray-100 px-4 py-3 outline-none focus:border-black transition-colors font-bold text-sm"
                            />
                        </div>
                    </div>
                    
                    <div>
                         <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Tỉnh / Thành phố</label>
                         <AutocompleteSelect
                            placeholder="Chọn tỉnh..."
                            value={provinceCode}
                            options={provinces.map(p => ({ code: p.code, name: p.name }))}
                            onChange={(code: string) => {
                                setProvinceCode(code);
                                const p = provinces.find(x => String(x.code) === code);
                                setForm(prev => ({ ...prev, city: p?.name || '', ward: '' }));
                                setWardCode('');
                            }}
                         />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Phường / Xã / Quận / Huyện</label>
                        <AutocompleteSelect
                            placeholder="Chọn phường/xã..."
                            value={wardCode}
                            options={wards.map(w => ({ code: w.code, name: w.name }))}
                            onChange={(code: string) => {
                                setWardCode(code);
                                const w = wards.find(x => String(x.code) === code);
                                setForm(prev => ({ ...prev, ward: w?.name || '' }));
                            }}
                            disabled={!provinceCode}
                        />
                    </div>
                    
                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Địa chỉ cụ thể</label>
                        <textarea 
                            required placeholder="Số nhà, tên đường..."
                            value={form.address} onChange={e => setForm({...form, address: e.target.value})}
                            className="w-full border-2 border-gray-100 px-4 py-3 outline-none focus:border-black transition-colors font-bold text-sm h-24 resize-none"
                        />
                    </div>

                    <div className="flex items-center gap-2 py-2">
                        <input 
                            type="checkbox" id="default"
                            checked={form.isDefault}
                            onChange={e => setForm({...form, isDefault: e.target.checked})}
                            className="w-4 h-4 accent-black"
                        />
                        <label htmlFor="default" className="text-xs font-bold text-gray-500 uppercase tracking-widest cursor-pointer">Đặt làm địa chỉ mặc định</label>
                    </div>

                    <div className="flex justify-end gap-4 pt-6">
                        <button type="button" onClick={() => setShowModal(false)} className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] hover:text-black transition-colors">Hủy bỏ</button>
                        <button type="submit" className="border-2 border-blue-600 bg-white text-blue-600 px-10 py-4 font-black text-xs uppercase tracking-[0.2em] hover:bg-blue-600 hover:text-white transition-all shadow-xl">Hoàn thành</button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
}

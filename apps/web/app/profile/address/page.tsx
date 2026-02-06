"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Plus, MapPin, Trash2, CheckCircle2, ChevronDown, X } from 'lucide-react';

// --- Reusable Component: Autocomplete Select (Copied from ProfilePage) ---
function removeAccents(str: string) {
  return str.normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd').replace(/Đ/g, 'D')
    .toLowerCase();
}

const AutocompleteSelect = ({ label, value, options, onChange, placeholder, disabled }: any) => {
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
  
  // Form State
  const [form, setForm] = useState({
    name: '',
    phone: '',
    city: '',
    district: '',
    ward: '',
    address: '',
    isDefault: false
  });

  // Location Data
  const [provinces, setProvinces] = useState<any[]>([]);
  const [wards, setWards] = useState<any[]>([]);
  const [provinceCode, setProvinceCode] = useState('');
  const [wardCode, setWardCode] = useState('');

  // 1. Initial Load
  useEffect(() => {
    const localUser = JSON.parse(localStorage.getItem('user') || '{}');
    if (localUser.addresses) {
      setAddresses(localUser.addresses);
    }
    
    // Fetch Provinces
    fetch('https://provinces.open-api.vn/api/p/')
      .then(res => res.json())
      .then(data => setProvinces(data));
  }, []);

  // 2. Fetch Wards when Province changes
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
    
    if (!form.city || !form.ward) {
        alert('Vui lòng chọn đầy đủ Tỉnh/Thành và Phường/Xã/Huyện');
        return;
    }

    try {
      const token = localStorage.getItem('token');
      const res = await fetch( `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/user/addresses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(form)
      });

      if (res.ok) {
        const data = await res.json();
        setAddresses(data.addresses);
        // Sync local storage
        const u = JSON.parse(localStorage.getItem('user') || '{}');
        u.addresses = data.addresses;
        localStorage.setItem('user', JSON.stringify(u));
        
        setShowModal(false);
        resetForm();
      } else {
        alert('Lỗi thêm địa chỉ');
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
    if(!confirm('Xóa địa chỉ này?')) return;
    const token = localStorage.getItem('token');
    const res = await fetch(`$ {process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/user/addresses/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
        const data = await res.json();
        setAddresses(data.addresses);
        const u = JSON.parse(localStorage.getItem('user') || '{}');
        u.addresses = data.addresses;
        localStorage.setItem('user', JSON.stringify(u));
    }
  };

  const handleSetDefault = async (id: string) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`$ {process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/user/addresses/${id}/default`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
        const data = await res.json();
        setAddresses(data.addresses);
        // Update Local Storage
        const u = JSON.parse(localStorage.getItem('user') || '{}');
        u.addresses = data.addresses;
        // Also update root fields for checkout compatibility
        const def = data.addresses.find((a:any) => a.isDefault);
        if(def) {
            u.name = def.name;
            u.phone = def.phone;
            u.address = def.address;
            u.city = def.city;
            u.ward = def.ward;
        }
        localStorage.setItem('user', JSON.stringify(u));
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center border-b border-gray-100 pb-4 mb-6">
        <h1 className="text-xl font-medium text-gray-800">Địa Chỉ Của Tôi</h1>
        <button 
          onClick={() => { resetForm(); setShowModal(true); }}
          className="bg-blue-600 text-white px-4 py-2 rounded-sm text-sm flex items-center gap-2 hover:bg-blue-700 transition shadow-sm"
        >
          <Plus size={16} /> Thêm Địa Chỉ Mới
        </button>
      </div>

      <div className="space-y-4">
        {addresses.length === 0 ? (
           <p className="text-center text-gray-500 py-10">Bạn chưa có địa chỉ nào.</p>
        ) : (
            addresses.map((addr: any) => (
                <div key={addr._id} className="border-b border-gray-100 py-4 flex justify-between items-start last:border-0">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-gray-800 border-r border-gray-300 pr-2 mr-2">{addr.name}</span>
                            <span className="text-gray-500">{addr.phone}</span>
                        </div>
                        <div className="text-sm text-gray-600">
                            <p>{addr.address}</p>
                            <p>{addr.ward}, {addr.city}</p>
                        </div>
                        {addr.isDefault && (
                            <span className="mt-2 inline-block border border-blue-600 text-blue-600 text-xs px-2 py-0.5 rounded-sm">Mặc định</span>
                        )}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                        <div className="flex gap-3 text-sm">
                            {/* Edit button could be added here later */}
                            {!addr.isDefault && (
                                <button onClick={() => handleDelete(addr._id)} className="text-blue-600 hover:underline">Xóa</button>
                            )}
                        </div>
                        {!addr.isDefault && (
                             <button 
                                onClick={() => handleSetDefault(addr._id)}
                                className="border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 bg-white"
                             >
                                Thiết lập mặc định
                             </button>
                        )}
                       
                    </div>
                </div>
            ))
        )}
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white w-full max-w-lg rounded-sm shadow-xl overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 font-medium text-lg">Địa chỉ mới</div>
                <form onSubmit={handleSubmit} className="p-6 max-h-[80vh] overflow-y-auto">
                    <div className="flex gap-4 mb-4">
                        <input 
                            type="text" required placeholder="Họ và tên"
                            value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                            className="w-1/2 border border-gray-300 px-3 py-2 outline-none focus:border-gray-500 rounded-sm"
                        />
                         <input 
                            type="text" required placeholder="Số điện thoại"
                            value={form.phone} onChange={e => setForm({...form, phone: e.target.value})}
                            className="w-1/2 border border-gray-300 px-3 py-2 outline-none focus:border-gray-500 rounded-sm"
                        />
                    </div>
                    
                    <div className="mb-4">
                         <AutocompleteSelect
                            placeholder="Tỉnh/Thành phố"
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
                    <div className="mb-4">
                        <AutocompleteSelect
                            placeholder="Phường/Xã/Quận/Huyện"
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
                    
                    <div className="mb-4">
                        <textarea 
                            required placeholder="Địa chỉ cụ thể (Số nhà, Tên đường...)"
                            value={form.address} onChange={e => setForm({...form, address: e.target.value})}
                            className="w-full border border-gray-300 px-3 py-2 outline-none focus:border-gray-500 rounded-sm h-24 resize-none"
                        />
                    </div>

                    <div className="mb-6 flex items-center">
                        <input 
                            type="checkbox" id="default"
                            checked={form.isDefault}
                            onChange={e => setForm({...form, isDefault: e.target.checked})}
                            className="mr-2"
                        />
                        <label htmlFor="default" className="text-sm text-gray-500">Đặt làm địa chỉ mặc định</label>
                    </div>

                    <div className="flex justify-end gap-2">
                        <button type="button" onClick={() => setShowModal(false)} className="px-6 py-2 hover:bg-gray-100 text-gray-600 rounded-sm">Trở lại</button>
                        <button type="submit" className="px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-sm">Hoàn thành</button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
}

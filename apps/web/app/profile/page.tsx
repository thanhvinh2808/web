"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    gender: 'other',
    dateOfBirth: '',
    avatar: ''
  });

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/user/me`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const userData = await res.json();
          setFormData({
            name: userData.name || '',
            email: userData.email || '',
            phone: userData.phone || '',
            gender: userData.gender || 'other',
            dateOfBirth: userData.dateOfBirth || '',
            avatar: userData.avatar || ''
          });
          localStorage.setItem('user', JSON.stringify(userData));
        }
      } catch (error) {
        console.error("Lỗi tải hồ sơ:", error);
      }
    };

    fetchProfile();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleGenderChange = (value: string) => {
    setFormData(prev => ({ ...prev, gender: value }));
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) {
        alert("File quá lớn! Vui lòng chọn ảnh dưới 1MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, avatar: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setSuccessMessage('');

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/user/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
          gender: formData.gender,
          dateOfBirth: formData.dateOfBirth,
          avatar: formData.avatar
        })
      });

      const data = await res.json();
      if (res.ok) {
        setSuccessMessage('Lưu thông tin thành công!');
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        const updatedUser = { ...currentUser, ...formData };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        alert(data.message || 'Lỗi cập nhật');
      }
    } catch (error) {
      console.error(error);
      alert('Có lỗi kết nối server');
    } finally {
      setIsLoading(false);
    }
  };

  const maskEmail = (email: string) => {
    if (!email) return '';
    const [name, domain] = email.split('@');
    if (!name || !domain) return email;
    return `${name.substring(0, 2)}***${name.substring(name.length - 1)}@${domain}`;
  };

  return (
    <div>
      <div className="border-b border-gray-100 pb-4 mb-8">
        <h1 className="text-xl font-medium text-gray-800 uppercase tracking-wide">Hồ Sơ Của Tôi</h1>
        <p className="text-sm text-gray-500 mt-1">Quản lý thông tin hồ sơ để bảo mật tài khoản</p>
      </div>

      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-none mb-6 flex items-center gap-2 text-sm shadow-sm">
           <div className="w-2 h-2 bg-green-500 rounded-none"></div>
           {successMessage}
        </div>
      )}

      <div className="flex flex-col-reverse md:flex-row gap-12">
        <div className="flex-1 pr-0 md:pr-12 border-r-0 md:border-r border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            <div className="flex items-center">
              <label className="w-32 text-right text-sm text-gray-500 mr-6 font-bold uppercase tracking-wider text-[10px]">Tên đăng nhập</label>
              <div className="text-gray-800 font-bold">{user?.name}</div>
            </div>

            <div className="flex items-center">
              <label className="w-32 text-right text-sm text-gray-500 mr-6 font-bold uppercase tracking-wider text-[10px]">Tên</label>
              <input 
                type="text" 
                name="name" 
                value={formData.name} 
                onChange={handleChange}
                className="flex-1 border border-gray-300 rounded-none px-3 py-2 focus:outline-none focus:border-primary shadow-sm transition text-sm font-medium"
              />
            </div>

            <div className="flex items-center">
              <label className="w-32 text-right text-sm text-gray-500 mr-6 font-bold uppercase tracking-wider text-[10px]">Email</label>
              <div className="flex items-center gap-2">
                <span className="text-gray-800 text-sm font-medium">{maskEmail(formData.email)}</span>
                <span className="text-primary text-xs underline cursor-pointer hover:text-primary-dark font-bold uppercase">Thay đổi</span>
              </div>
            </div>

            <div className="flex items-center">
              <label className="w-32 text-right text-sm text-gray-500 mr-6 font-bold uppercase tracking-wider text-[10px]">Số điện thoại</label>
              <div className="flex-1 flex items-center gap-2">
                 <input 
                  type="text" 
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Thêm số điện thoại"
                  className="flex-1 border border-gray-300 rounded-none px-3 py-2 focus:outline-none focus:border-primary shadow-sm transition text-sm font-medium"
                />
              </div>
            </div>

            <div className="flex items-center">
              <label className="w-32 text-right text-sm text-gray-500 mr-6 font-bold uppercase tracking-wider text-[10px]">Giới tính</label>
              <div className="flex gap-4">
                {['male', 'female', 'other'].map((g) => (
                  <label key={g} className="flex items-center gap-2 cursor-pointer group">
                    <div className="relative flex items-center">
                      <input 
                        type="radio" 
                        name="gender" 
                        checked={formData.gender === g}
                        onChange={() => handleGenderChange(g)}
                        className="peer h-4 w-4 cursor-pointer appearance-none rounded-none border border-gray-300 checked:border-primary transition-all checked:bg-primary"
                      />
                    </div>
                    <span className="text-sm text-gray-700 capitalize group-hover:text-primary font-medium">
                      {g === 'male' ? 'Nam' : g === 'female' ? 'Nữ' : 'Khác'}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex items-center">
              <label className="w-32 text-right text-sm text-gray-500 mr-6 font-bold uppercase tracking-wider text-[10px]">Ngày sinh</label>
              <input 
                type="date"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleChange}
                className="border border-gray-300 rounded-none px-3 py-2 focus:outline-none focus:border-primary shadow-sm transition text-sm font-medium"
              />
            </div>

            <div className="flex flex-col pt-4 gap-4">
              <div className="flex items-center">
                <div className="w-32 mr-6"></div>
                <button 
                  type="submit" 
                  disabled={isLoading}
                  className="px-8 py-3 bg-primary text-white rounded-none hover:bg-primary-dark transition shadow-sm disabled:opacity-70 flex items-center gap-2 font-bold uppercase tracking-wider text-xs"
                >
                  {isLoading && <Loader2 size={16} className="animate-spin" />}
                  Lưu Thay Đổi
                </button>
              </div>

              <div className="flex items-center mt-4 pt-4 border-t border-gray-100">
                <div className="w-32 mr-6"></div>
                <button 
                  type="button"
                  onClick={() => {
                    if (confirm('Bạn có chắc chắn muốn đăng xuất?')) {
                      logout();
                    }
                  }}
                  className="text-red-500 hover:text-red-700 font-bold uppercase tracking-wider text-[10px] flex items-center gap-2 transition-colors py-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-log-out"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
                  Đăng xuất tài khoản
                </button>
              </div>
            </div>
          </form>
        </div>

        <div className="w-full md:w-64 flex flex-col items-center pt-4">
          <div className="relative group">
            <div className="w-32 h-32 rounded-none border-2 border-gray-200 overflow-hidden mb-5 shadow-sm">
              {formData.avatar ? (
                  <img src={formData.avatar} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                      <User size={48} />
                  </div>
              )}
            </div>
          </div>
          
          <label className="cursor-pointer">
            <span className="px-6 py-2 border border-gray-300 text-gray-600 text-xs font-bold uppercase tracking-wider rounded-none hover:bg-black hover:text-white hover:border-black transition shadow-sm inline-block">
              Chọn Ảnh
            </span>
            <input 
              type="file" 
              className="hidden" 
              accept=".jpg,.jpeg,.png"
              onChange={handleAvatarChange} 
            />
          </label>

          <div className="mt-4 text-[10px] text-gray-400 text-center space-y-1 font-medium uppercase tracking-wide">
            <p>Dụng lượng file tối đa 1 MB</p>
            <p>Định dạng: .JPEG, .PNG</p>
          </div>
        </div>

      </div>
    </div>
  );
}

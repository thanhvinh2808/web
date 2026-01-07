"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const { user } = useAuth();
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

  // 1. Load User Data
  useEffect(() => {
    // Ưu tiên lấy từ API hoặc localStorage mới nhất
    const fetchProfile = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        const res = await fetch('http://localhost:5000/api/user/me', {
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
          // Đồng bộ lại localStorage
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
      const res = await fetch('http://localhost:5000/api/user/update', {
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
          // Không gửi địa chỉ ở đây nữa
        })
      });

      const data = await res.json();
      if (res.ok) {
        setSuccessMessage('Lưu thông tin thành công!');
        
        // Cập nhật localStorage để các component khác (Header) hiển thị đúng ngay lập tức
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        const updatedUser = { ...currentUser, ...formData };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        // Tắt thông báo sau 3s
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

  // Ẩn email để bảo mật (giống Shopee)
  const maskEmail = (email: string) => {
    if (!email) return '';
    const [name, domain] = email.split('@');
    if (!name || !domain) return email;
    return `${name.substring(0, 2)}***${name.substring(name.length - 1)}@${domain}`;
  };

  return (
    <div>
      {/* Header Section */}
      <div className="border-b border-gray-100 pb-4 mb-8">
        <h1 className="text-xl font-medium text-gray-800">Hồ Sơ Của Tôi</h1>
        <p className="text-sm text-gray-500 mt-1">Quản lý thông tin hồ sơ để bảo mật tài khoản</p>
      </div>

      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-6 flex items-center gap-2 text-sm shadow-sm">
           <div className="w-2 h-2 bg-green-500 rounded-full"></div>
           {successMessage}
        </div>
      )}

      <div className="flex flex-col-reverse md:flex-row gap-12">
        {/* LEFT: FORM */}
        <div className="flex-1 pr-0 md:pr-12 border-r-0 md:border-r border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Username (Read-only) */}
            <div className="flex items-center">
              <label className="w-32 text-right text-sm text-gray-500 mr-6">Tên đăng nhập</label>
              <div className="text-gray-800 font-medium">{user?.name}</div>
            </div>

            {/* Name */}
            <div className="flex items-center">
              <label className="w-32 text-right text-sm text-gray-500 mr-6">Tên</label>
              <input 
                type="text" 
                name="name" 
                value={formData.name} 
                onChange={handleChange}
                className="flex-1 border border-gray-300 rounded-sm px-3 py-2 focus:outline-none focus:border-gray-500 shadow-sm transition text-sm"
              />
            </div>

            {/* Email (Read-only view) */}
            <div className="flex items-center">
              <label className="w-32 text-right text-sm text-gray-500 mr-6">Email</label>
              <div className="flex items-center gap-2">
                <span className="text-gray-800 text-sm">{maskEmail(formData.email)}</span>
                <span className="text-blue-600 text-xs underline cursor-pointer hover:text-blue-700">Thay đổi</span>
              </div>
            </div>

            {/* Phone */}
            <div className="flex items-center">
              <label className="w-32 text-right text-sm text-gray-500 mr-6">Số điện thoại</label>
              <div className="flex-1 flex items-center gap-2">
                 <input 
                  type="text" 
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Thêm số điện thoại"
                  className="flex-1 border border-gray-300 rounded-sm px-3 py-2 focus:outline-none focus:border-gray-500 shadow-sm transition text-sm"
                />
              </div>
            </div>

            {/* Gender */}
            <div className="flex items-center">
              <label className="w-32 text-right text-sm text-gray-500 mr-6">Giới tính</label>
              <div className="flex gap-4">
                {['male', 'female', 'other'].map((g) => (
                  <label key={g} className="flex items-center gap-2 cursor-pointer group">
                    <div className="relative flex items-center">
                      <input 
                        type="radio" 
                        name="gender" 
                        checked={formData.gender === g}
                        onChange={() => handleGenderChange(g)}
                        className="peer h-4 w-4 cursor-pointer appearance-none rounded-full border border-gray-300 checked:border-blue-600 transition-all"
                      />
                      <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-blue-600 opacity-0 peer-checked:opacity-100 transition-opacity"></span>
                    </div>
                    <span className="text-sm text-gray-700 capitalize group-hover:text-blue-600">
                      {g === 'male' ? 'Nam' : g === 'female' ? 'Nữ' : 'Khác'}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Date of Birth */}
            <div className="flex items-center">
              <label className="w-32 text-right text-sm text-gray-500 mr-6">Ngày sinh</label>
              <input 
                type="date"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleChange}
                className="border border-gray-300 rounded-sm px-3 py-2 focus:outline-none focus:border-gray-500 shadow-sm transition text-sm"
              />
            </div>

            {/* Submit Button */}
            <div className="flex items-center pt-4">
              <div className="w-32 mr-6"></div>
              <button 
                type="submit" 
                disabled={isLoading}
                className="px-8 py-2.5 bg-blue-600 text-white rounded-sm hover:bg-blue-700 transition shadow-sm disabled:opacity-70 flex items-center gap-2"
              >
                {isLoading && <Loader2 size={16} className="animate-spin" />}
                Lưu
              </button>
            </div>
          </form>
        </div>

        {/* RIGHT: AVATAR */}
        <div className="w-full md:w-64 flex flex-col items-center pt-4">
          <div className="relative group">
            <div className="w-28 h-28 rounded-full border border-gray-200 overflow-hidden mb-5 shadow-sm">
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
            <span className="px-5 py-2 border border-gray-300 text-gray-600 text-sm rounded-sm hover:bg-gray-50 transition shadow-sm inline-block">
              Chọn Ảnh
            </span>
            <input 
              type="file" 
              className="hidden" 
              accept=".jpg,.jpeg,.png"
              onChange={handleAvatarChange} 
            />
          </label>

          <div className="mt-4 text-xs text-gray-400 text-center space-y-1">
            <p>Dụng lượng file tối đa 1 MB</p>
            <p>Định dạng: .JPEG, .PNG</p>
          </div>
        </div>

      </div>
    </div>
  );
}
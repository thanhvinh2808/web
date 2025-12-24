// app/profile/edit/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  ArrowLeft,
  Save,
  Camera,
  Calendar,
  Building
} from 'lucide-react';

interface UserInfo {
  id: string;
  email: string;
  name: string;
  phone?: string;
  address?: string;
  dateOfBirth?: string;
  gender?: string;
  city?: string;
  district?: string;
  ward?: string;
  avatar?: string;
}

export default function ProfileEditPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [formData, setFormData] = useState<UserInfo>({
    id: '',
    email: '',
    name: '',
    phone: '',
    address: '',
    dateOfBirth: '',
    gender: '',
    city: '',
    district: '',
    ward: '',
    avatar: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    // Kiểm tra đăng nhập
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/login');
      return;
    }

    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);
    setFormData({
      id: parsedUser.id || '',
      email: parsedUser.email || '',
      name: parsedUser.name || '',
      phone: parsedUser.phone || '',
      address: parsedUser.address || '',
      dateOfBirth: parsedUser.dateOfBirth || '',
      gender: parsedUser.gender || '',
      city: parsedUser.city || '',
      district: parsedUser.district || '',
      ward: parsedUser.ward || '',
      avatar: parsedUser.avatar || ''
    });
  }, [router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsLoading(true);
  setSuccessMessage('');
  setErrorMessage('');

  try {
    // ✅ Lấy token từ localStorage
    const token = localStorage.getItem('token');
    
    if (!token) {
      setErrorMessage('Vui lòng đăng nhập lại');
      router.push('/login');
      return;
    }

    // ✅ GỌI API THẬT ĐỂ CẬP NHẬT DATABASE
    const response = await fetch('http://localhost:5000/api/user/update', {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        name: formData.name,
        phone: formData.phone,
        address: formData.address,
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        city: formData.city,
        district: formData.district,
        ward: formData.ward,
        avatar: formData.avatar
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Cập nhật thất bại');
    }

    console.log('✅ API response:', data);

    // ✅ Sau khi API thành công, cập nhật localStorage
    const updatedUser = {
      id: data.id,
      email: data.email,
      name: data.name,
      phone: data.phone,
      address: data.address,
      dateOfBirth: data.dateOfBirth,
      gender: data.gender,
      city: data.city,
      district: data.district,
      ward: data.ward,
      avatar: data.avatar,
      role: data.role
    };

    localStorage.setItem('user', JSON.stringify(updatedUser));
    
    // ✅ Lưu thông tin giao hàng mặc định
    const shippingInfo = {
      fullName: updatedUser.name,
      phone: updatedUser.phone || '',
      email: updatedUser.email,
      address: updatedUser.address || '',
      city: updatedUser.city || '',
      district: updatedUser.district || '',
      ward: updatedUser.ward || ''
    };
    localStorage.setItem('defaultShippingInfo', JSON.stringify(shippingInfo));
    
    setSuccessMessage('Cập nhật thông tin thành công!');
    
    // Redirect về profile sau 1.5s
    setTimeout(() => {
      router.push('/profile');
    }, 1500);

  } catch (error: any) {
    console.error('❌ Update error:', error);
    setErrorMessage(error.message || 'Có lỗi xảy ra. Vui lòng thử lại!');
  } finally {
    setIsLoading(false);
  }
};

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          avatar: reader.result as string
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          
          {/* Header */}
          <div className="mb-8">
            <Link 
              href="/profile"
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4"
            >
              <ArrowLeft size={20} />
              Quay lại trang cá nhân
            </Link>
            <h1 className="text-3xl font-bold text-gray-800">Chỉnh sửa thông tin</h1>
            <p className="text-gray-600 mt-2">
              Cập nhật thông tin cá nhân của bạn
            </p>
          </div>

          {/* Success/Error Messages */}
          {successMessage && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg flex items-center gap-2">
              <Save size={20} />
              {successMessage}
            </div>
          )}
          {errorMessage && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
              {errorMessage}
            </div>
          )}

          {/* Form */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
            
            {/* Avatar Section */}
            <div className="mb-8 text-center">
              <div className="relative inline-block">
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-4xl font-bold overflow-hidden">
                  {formData.avatar ? (
                    <img src={formData.avatar} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    formData.name.charAt(0).toUpperCase()
                  )}
                </div>
                <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700 transition">
                  <Camera size={20} />
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </label>
              </div>
              <p className="text-sm text-gray-500 mt-3">
                Click vào icon camera để thay đổi ảnh đại diện
              </p>
            </div>

            {/* ✅ SỬA: Đổi từ <div> thành <form> */}
            <form onSubmit={handleSubmit}>
              {/* Personal Information */}
              <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <User size={20} className="text-blue-600" />
                  Thông tin cá nhân
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Họ và tên <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Nguyễn Văn A"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        disabled
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed"
                        placeholder="email@example.com"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Email không thể thay đổi</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Số điện thoại
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="0123456789"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ngày sinh
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                      <input
                        type="date"
                        name="dateOfBirth"
                        value={formData.dateOfBirth}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Giới tính
                    </label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Chọn giới tính</option>
                      <option value="male">Nam</option>
                      <option value="female">Nữ</option>
                      <option value="other">Khác</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Address Information */}
              <div className="mb-6 pt-6 border-t border-gray-200">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <MapPin size={20} className="text-blue-600" />
                  Địa chỉ giao hàng
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tỉnh/Thành phố
                    </label>
                    <div className="relative">
                      <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Hồ Chí Minh"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Quận/Huyện
                    </label>
                    <input
                      type="text"
                      name="district"
                      value={formData.district}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Quận 1"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phường/Xã
                    </label>
                    <input
                      type="text"
                      name="ward"
                      value={formData.ward}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Phường Bến Nghé"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Địa chỉ chi tiết
                  </label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Số nhà, tên đường..."
                  />
                </div>
              </div>

              {/* ✅ Thông báo về lưu thông tin */}
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  💡 <strong>Lưu ý:</strong> Thông tin địa chỉ của bạn sẽ được tự động điền vào form thanh toán để tiện lợi hơn cho lần mua hàng tiếp theo.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => router.push('/profile')}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Đang lưu...
                    </>
                  ) : (
                    <>
                      <Save size={20} />
                      Lưu thay đổi
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
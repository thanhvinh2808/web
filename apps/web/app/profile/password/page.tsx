"use client";

import { useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { Lock, Save } from 'lucide-react';

export default function ChangePasswordPage() {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (formData.newPassword !== formData.confirmPassword) {
      setMessage({ type: 'error', text: 'Mật khẩu xác nhận không khớp' });
      return;
    }

    if (formData.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Mật khẩu mới phải có ít nhất 6 ký tự' });
      return;
    }

    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/user/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword
        })
      });

      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: 'Đổi mật khẩu thành công!' });
        setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        setMessage({ type: 'error', text: data.message || 'Có lỗi xảy ra' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Lỗi kết nối đến server' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="border-b border-gray-100 pb-4 mb-6">
        <h1 className="text-xl font-medium text-gray-800">Đổi Mật Khẩu</h1>
        <p className="text-sm text-gray-500 mt-1">Để bảo mật tài khoản, vui lòng không chia sẻ mật khẩu cho người khác</p>
      </div>

      {message.text && (
        <div className={`px-4 py-3 rounded mb-4 text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="max-w-xl">
        <div className="flex items-center mb-6">
          <label className="w-1/3 text-right text-sm text-gray-500 mr-6">Mật khẩu hiện tại</label>
          <div className="flex-1 relative">
            <input 
              type="password" 
              name="currentPassword"
              value={formData.currentPassword}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-sm px-4 py-2 focus:outline-none focus:border-gray-500 transition"
            />
          </div>
        </div>

        <div className="flex items-center mb-6">
          <label className="w-1/3 text-right text-sm text-gray-500 mr-6">Mật khẩu mới</label>
          <div className="flex-1">
            <input 
              type="password" 
              name="newPassword"
              value={formData.newPassword}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-sm px-4 py-2 focus:outline-none focus:border-gray-500 transition"
            />
          </div>
        </div>

        <div className="flex items-center mb-8">
          <label className="w-1/3 text-right text-sm text-gray-500 mr-6">Xác nhận mật khẩu</label>
          <div className="flex-1">
            <input 
              type="password" 
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-sm px-4 py-2 focus:outline-none focus:border-gray-500 transition"
            />
          </div>
        </div>

        <div className="flex items-center">
          <div className="w-1/3 mr-6"></div>
          <button 
            type="submit" 
            disabled={isLoading}
            className="px-6 py-2 bg-blue-600 text-white rounded-sm hover:bg-blue-700 transition shadow-sm disabled:opacity-70 flex items-center gap-2"
          >
            <Save size={18} />
            {isLoading ? 'Đang xử lý...' : 'Xác nhận'}
          </button>
        </div>
      </form>
    </div>
  );
}
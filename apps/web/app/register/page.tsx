"use client";

import { useState } from "react";
import { UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "../contexts/AuthContext";

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  
  const [formData, setFormData] = useState({ 
    name: '', 
    email: '', 
    password: '',
    confirmPassword: '' 
  });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      setMessage('Mật khẩu xác nhận không khớp!');
      return;
    }

    try {
      setLoading(true);
      setMessage('');
      
      // ✅ SỬA: Truyền object thay vì 3 tham số riêng lẻ
      await register({
        name: formData.name,
        email: formData.email,
        password: formData.password
      });
      
      // ✅ AuthContext sẽ tự redirect sau khi đăng ký thành công
      setMessage('Đăng ký thành công!');
      
    } catch (error) {
      console.error('❌ Register error:', error);
      setMessage((error as any).message || 'Có lỗi xảy ra khi đăng ký!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 font-sans">
      <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-md border border-gray-100">
        <div className="text-center mb-8">
          <div className="bg-black w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <UserPlus className="text-white" size={32} />
          </div>
          <h2 className="text-3xl font-black italic tracking-tighter">FOOT<span className="text-blue-600">MARK</span>.</h2>
          <p className="text-gray-500 mt-2 font-medium">Tạo tài khoản thành viên mới</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">Họ và tên</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none transition"
              placeholder="Nguyễn Văn A"
              required
              disabled={loading}
            />
          </div>
          
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none transition"
              placeholder="email@example.com"
              required
              disabled={loading}
            />
          </div>
          
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">Mật khẩu</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none transition"
              placeholder="••••••••"
              required
              minLength={6}
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">Xác nhận mật khẩu</label>
            <input
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none transition"
              placeholder="••••••••"
              required
              minLength={6}
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white py-4 rounded-lg font-bold uppercase tracking-wider hover:bg-stone-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Đang xử lý...' : 'ĐĂNG KÝ NGAY'}
          </button>
          
          {message && (
            <p className={`text-center font-bold text-sm ${message.includes('thành công') ? 'text-green-600' : 'text-red-600'}`}>
              {message}
            </p>
          )}
        </form>

        <div className="mt-8 text-center">
          <p className="text-gray-600">
            Đã có tài khoản?{' '}
            <button
              onClick={() => router.push('/login')}
              className="text-blue-600 font-bold hover:underline"
              disabled={loading}
            >
              Đăng nhập ngay
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
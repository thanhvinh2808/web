// app/login/page.tsx
"use client";

import { useEffect, useState } from "react";
import { User, Lock, Mail, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "../contexts/AuthContext";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      const redirectPath = sessionStorage.getItem('redirectAfterLogin') || '/';
      sessionStorage.removeItem('redirectAfterLogin');
      router.push(redirectPath);
    }
  }, [isAuthenticated, isLoading, router]);

  const handleForceLogout = () => {
    localStorage.clear();
    window.location.reload();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    try {
      await login(formData.email, formData.password);
      setMessage('Đăng nhập thành công!');
    } catch (error: any) {
      setMessage(error.message || 'Đăng nhập thất bại!');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 font-sans">
      <div className="bg-white rounded-none shadow-2xl p-8 w-full max-w-md border border-gray-100 relative">
        {/* Decorative Top Bar */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-primary"></div>

        <div className="text-center mb-10">
          <div className="bg-primary w-16 h-16 rounded-none flex items-center justify-center mx-auto mb-6 shadow-lg shadow-primary/20 transform rotate-3">
            <User className="text-white" size={32} />
          </div>
          <h2 className="text-4xl font-black italic tracking-tighter uppercase italic uppercase">FOOT<span className="text-primary">MARK</span>.</h2>
          <p className="text-gray-400 mt-2 font-bold uppercase tracking-widest text-[10px]">Đăng nhập để săn giày chất</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Email Address</label>
            <div className="relative">
               <input
                 type="email"
                 value={formData.email}
                 onChange={(e) => setFormData({...formData, email: e.target.value})}
                 className="w-full px-4 py-4 bg-gray-50 border-none rounded-none focus:ring-2 focus:ring-primary outline-none transition font-medium text-sm pl-12"
                 placeholder="email@example.com"
                 required
                 disabled={isLoading}
               />
               <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18}/>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
               <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Password</label>
               <Link href="/forgot-password" size="sm" className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline">
                  Quên mật khẩu?
               </Link>
            </div>
            <div className="relative">
               <input
                 type="password"
                 value={formData.password}
                 onChange={(e) => setFormData({...formData, password: e.target.value})}
                 className="w-full px-4 py-4 bg-gray-50 border-none rounded-none focus:ring-2 focus:ring-primary outline-none transition font-medium text-sm pl-12"
                 placeholder="••••••••"
                 required
                 disabled={isLoading}
               />
               <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18}/>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary text-white py-5 rounded-none font-black uppercase tracking-[0.2em] hover:bg-primary-dark transition disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-primary/20 flex items-center justify-center gap-3 group"
          >
            {isLoading ? 'Đang xử lý...' : 'Đăng nhập'} <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform"/>
          </button>

          {message && (
            <div className={`p-4 rounded-none text-center font-bold text-xs uppercase tracking-widest border ${
               message.includes('thành công') 
               ? 'bg-green-50 text-green-600 border-green-100' 
               : 'bg-red-50 text-red-600 border-red-100'
            }`}>
              {message}
            </div>
          )}
        </form>

          <div className="mt-10 text-center space-y-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
              Chưa có tài khoản?{' '}
              <Link
                href="/register"
                className="text-primary font-black hover:underline ml-1"
              >
                Đăng ký ngay
              </Link>
            </p>
            <div className="pt-4 border-t border-gray-100">
               <button
                 type="button"
                 onClick={handleForceLogout}
                 className="text-[8px] font-bold text-red-400 uppercase tracking-[0.3em] hover:text-red-600 opacity-60 hover:opacity-100 transition"
               >
                 Gặp lỗi đăng nhập? Xóa cache ứng dụng
               </button>
            </div>
          </div>
      </div>
    </div>
  );
}

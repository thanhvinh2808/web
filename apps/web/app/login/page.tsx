// app/login/page.tsx
"use client";

import { useEffect, useState } from "react";
import { User, Lock, Mail, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "../contexts/AuthContext";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, isLoading: authLoading } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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
    <div className="min-h-screen flex items-stretch bg-white font-sans overflow-hidden">
      {/* Left Side: Brand Visual */}
      <div className="hidden lg:flex lg:w-1/2 bg-black relative flex-col justify-between p-12 text-white">
        <div className="absolute inset-0 opacity-40">
           <img 
             src="https://images.unsplash.com/photo-1552346154-21d32810aba3?q=80&w=2070&auto=format&fit=crop" 
             alt="Sneaker Culture" 
             className="w-full h-full object-cover"
           />
           <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black"></div>
        </div>
        
        <div className="relative z-10">
          <Link href="/" className="text-3xl font-black italic tracking-tighter italic">FOOTMARK.</Link>
        </div>

        <div className="relative z-10">
          <h1 className="text-7xl font-black italic uppercase leading-none tracking-tighter mb-6">
            STEP INTO <br />
            <span className="text-primary text-8xl">THE FUTURE.</span>
          </h1>
          <p className="max-w-md text-gray-300 font-medium text-lg leading-relaxed">
            Khám phá những đôi giày Sneaker chính hãng và hàng 2Hand tuyển chọn. Định nghĩa lại phong cách của bạn cùng FootMark.
          </p>
        </div>

        <div className="relative z-10 flex gap-8 text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">
          <span>Instagram</span>
          <span>Facebook</span>
          <span>TikTok</span>
        </div>
      </div>

      {/* Right Side: Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 md:p-16 bg-white relative">
        <div className="w-full max-w-md">
          <div className="mb-10 lg:hidden text-center">
             <Link href="/" className="text-3xl font-black italic tracking-tighter italic inline-block mb-4">FOOTMARK.</Link>
          </div>

          <div className="mb-12">
            <h2 className="text-4xl font-black italic uppercase tracking-tighter mb-2">Đăng nhập.</h2>
            <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Tiếp tục cuộc hành trình sneaker của bạn</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-2 group">
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 group-focus-within:text-primary transition-colors">Địa chỉ Email</label>
              <div className="relative border-b-2 border-gray-100 group-focus-within:border-primary transition-all">
                 <input
                   type="email"
                   value={formData.email}
                   onChange={(e) => setFormData({...formData, email: e.target.value})}
                   className="w-full py-4 bg-transparent outline-none font-bold text-lg placeholder:text-gray-200"
                   placeholder="your@email.com"
                   required
                   disabled={isLoading}
                 />
                 <Mail className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-200 group-focus-within:text-primary transition-colors" size={20}/>
              </div>
            </div>

            <div className="space-y-2 group">
              <div className="flex justify-between items-center">
                 <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 group-focus-within:text-primary transition-colors">Mật khẩu</label>
                 <Link href="/forgot-password" size="sm" className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline">
                    Quên?
                 </Link>
              </div>
              <div className="relative border-b-2 border-gray-100 group-focus-within:border-primary transition-all">
                 <input
                   type="password"
                   value={formData.password}
                   onChange={(e) => setFormData({...formData, password: e.target.value})}
                   className="w-full py-4 bg-transparent outline-none font-bold text-lg placeholder:text-gray-200"
                   placeholder="••••••••"
                   required
                   disabled={isLoading}
                 />
                 <Lock className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-200 group-focus-within:text-primary transition-colors" size={20}/>
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-black text-white py-6 rounded-none font-black uppercase tracking-[0.3em] hover:bg-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 group relative overflow-hidden"
              >
                <span className="relative z-10 flex items-center gap-3">
                  {isLoading ? 'Đang xác thực...' : 'Đăng nhập ngay'} <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform"/>
                </span>
                <div className="absolute inset-0 bg-primary translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
              </button>
            </div>

            {message && (
              <div className={`p-4 rounded-none text-center font-bold text-[10px] uppercase tracking-widest ${
                 message.includes('thành công') 
                 ? 'text-green-600 bg-green-50' 
                 : 'text-red-600 bg-red-50'
              }`}>
                {message}
              </div>
            )}
          </form>

          <div className="mt-12 text-center">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-400">
              Chưa có tài khoản?{' '}
              <Link
                href="/register"
                className="text-black font-black hover:text-primary transition-colors border-b-2 border-black ml-1"
              >
                TẠO TÀI KHOẢN MỚI
              </Link>
            </p>
          </div>
        </div>
        
        {/* Floating Tag */}
        <div className="absolute bottom-8 right-8 hidden lg:block">
           <div className="flex items-center gap-3 text-gray-300">
              <div className="w-12 h-px bg-gray-200"></div>
              <span className="text-[10px] font-black uppercase tracking-[0.4em]">Footmark Elite 2024</span>
           </div>
        </div>
      </div>
    </div>
  );
}

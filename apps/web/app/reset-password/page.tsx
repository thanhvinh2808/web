// app/reset-password/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Lock, KeyRound, ChevronRight, CheckCircle, Mail } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";

const API_URL = process.env.NEXT_PUBLIC_API_URL || '$ {process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}';

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailFromQuery = searchParams.get('email') || '';

  const [formData, setFormData] = useState({
    email: emailFromQuery,
    otp: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!emailFromQuery) {
      toast.error('Vui lòng bắt đầu từ trang quên mật khẩu!');
      router.push('/forgot-password');
    }
  }, [emailFromQuery, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp!');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          otp: formData.otp,
          newPassword: formData.newPassword
        })
      });

      const data = await res.json();
      if (res.ok) {
        toast.success('Đổi mật khẩu thành công! Vui lòng đăng nhập lại.');
        setTimeout(() => router.push('/login'), 2000);
      } else {
        toast.error(data.message || 'Mã xác thực không đúng hoặc đã hết hạn!');
      }
    } catch (error) {
      toast.error('Lỗi kết nối server!');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-stretch bg-white font-sans overflow-hidden">
      {/* Left Side: Brand Visual */}
      <div className="hidden lg:flex lg:w-1/2 bg-black relative flex-col justify-between p-12 text-white">
        <div className="absolute inset-0 opacity-40">
           <img 
             src="https://images.unsplash.com/photo-1597045566677-8cf032ed6634?q=80&w=1974&auto=format&fit=crop" 
             alt="Sneaker Security" 
             className="w-full h-full object-cover"
           />
           <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black"></div>
        </div>
        
        <div className="relative z-10">
          <Link href="/" className="text-3xl font-black italic tracking-tighter italic">FOOTMARK.</Link>
        </div>

        <div className="relative z-10">
          <h1 className="text-7xl font-black italic uppercase leading-none tracking-tighter mb-6">
            SECURE YOUR <br />
            <span className="text-primary text-8xl">VAULT.</span>
          </h1>
          <p className="max-w-md text-gray-300 font-medium text-lg leading-relaxed">
            Thiết lập mật khẩu mới mạnh mẽ hơn để bảo vệ tài khoản và lịch sử săn giày của bạn tại FootMark.
          </p>
        </div>

        <div className="relative z-10 flex gap-8 text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">
          <span>Encryption</span>
          <span>Verified</span>
          <span>Footmark Elite</span>
        </div>
      </div>

      {/* Right Side: Reset Password Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 md:p-16 bg-white relative">
        <div className="w-full max-w-md">
          <div className="mb-10 lg:hidden text-center">
             <Link href="/" className="text-3xl font-black italic tracking-tighter italic inline-block mb-4">FOOTMARK.</Link>
          </div>

          <div className="mb-12">
            <h2 className="text-4xl font-black italic uppercase tracking-tighter mb-2">Đặt lại mật khẩu.</h2>
            <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Nhập mã xác thực 6 số và mật khẩu mới của bạn</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-2 group">
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Email xác thực</label>
              <div className="relative border-b-2 border-gray-100 transition-all opacity-60">
                 <input
                   type="email"
                   value={formData.email}
                   readOnly
                   className="w-full py-4 bg-transparent outline-none font-bold text-lg text-gray-400 cursor-not-allowed"
                 />
                 <Mail className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-300" size={20}/>
              </div>
            </div>

            <div className="space-y-2 group">
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 group-focus-within:text-primary transition-colors">Mã xác thực OTP (6 số)</label>
              <div className="relative border-b-2 border-gray-100 group-focus-within:border-primary transition-all">
                 <input
                   type="text"
                   maxLength={6}
                   value={formData.otp}
                   onChange={(e) => setFormData({...formData, otp: e.target.value})}
                   className="w-full py-4 bg-transparent outline-none font-black tracking-[1em] text-2xl placeholder:text-gray-100"
                   placeholder="000000"
                   required
                   disabled={isLoading}
                 />
                 <KeyRound className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-200 group-focus-within:text-primary transition-colors" size={20}/>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 group">
                <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 group-focus-within:text-primary transition-colors">Mật khẩu mới</label>
                <div className="relative border-b-2 border-gray-100 group-focus-within:border-primary transition-all">
                   <input
                     type="password"
                     value={formData.newPassword}
                     onChange={(e) => setFormData({...formData, newPassword: e.target.value})}
                     className="w-full py-4 bg-transparent outline-none font-bold text-lg placeholder:text-gray-200"
                     placeholder="••••••••"
                     required
                     disabled={isLoading}
                   />
                </div>
              </div>

              <div className="space-y-2 group">
                <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 group-focus-within:text-primary transition-colors">Xác nhận mật khẩu</label>
                <div className="relative border-b-2 border-gray-100 group-focus-within:border-primary transition-all">
                   <input
                     type="password"
                     value={formData.confirmPassword}
                     onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                     className="w-full py-4 bg-transparent outline-none font-bold text-lg placeholder:text-gray-200"
                     placeholder="••••••••"
                     required
                     disabled={isLoading}
                   />
                </div>
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-black text-white py-6 rounded-none font-black uppercase tracking-[0.3em] hover:bg-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 group relative overflow-hidden"
              >
                <span className="relative z-10 flex items-center gap-3">
                  {isLoading ? 'Đang cập nhật...' : 'Xác nhận thay đổi'} <CheckCircle size={20} className="group-hover:scale-110 transition-transform"/>
                </span>
                <div className="absolute inset-0 bg-primary translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
              </button>
            </div>
          </form>

          <div className="mt-12 text-center">
             <button 
                onClick={() => router.push('/forgot-password')}
                className="text-[10px] font-black text-gray-400 hover:text-black uppercase tracking-[0.2em] transition border-b border-gray-200 hover:border-black"
             >
                Gửi lại mã OTP mới
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}

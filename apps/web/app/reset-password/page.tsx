// app/reset-password/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Lock, KeyRound, ChevronRight, CheckCircle2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 font-sans py-12">
      <div className="bg-white rounded-none shadow-2xl p-8 w-full max-w-md border border-gray-100 relative">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-primary"></div>

        <div className="text-center mb-10">
          <div className="bg-primary w-16 h-16 rounded-none flex items-center justify-center mx-auto mb-6 shadow-lg shadow-primary/20 -rotate-3">
            <KeyRound className="text-white" size={32} />
          </div>
          <h2 className="text-3xl font-black italic tracking-tighter uppercase">ĐẶT LẠI MẬT KHẨU</h2>
          <p className="text-gray-400 mt-2 font-bold uppercase tracking-widest text-[10px]">Nhập mã OTP và mật khẩu mới của bạn</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Email Address</label>
            <input
              type="email"
              value={formData.email}
              readOnly
              className="w-full px-4 py-4 bg-gray-100 border-none rounded-none text-gray-400 font-medium text-sm outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">OTP Code (6 Digits)</label>
            <div className="relative">
               <input
                 type="text"
                 maxLength={6}
                 value={formData.otp}
                 onChange={(e) => setFormData({...formData, otp: e.target.value})}
                 className="w-full px-4 py-4 bg-gray-50 border-none rounded-none focus:ring-2 focus:ring-primary outline-none transition font-black tracking-[0.5em] text-center text-lg"
                 placeholder="000000"
                 required
                 disabled={isLoading}
               />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">New Password</label>
            <div className="relative">
               <input
                 type="password"
                 value={formData.newPassword}
                 onChange={(e) => setFormData({...formData, newPassword: e.target.value})}
                 className="w-full px-4 py-4 bg-gray-50 border-none rounded-none focus:ring-2 focus:ring-primary outline-none transition font-medium text-sm pl-12"
                 placeholder="••••••••"
                 required
                 disabled={isLoading}
               />
               <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18}/>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Confirm New Password</label>
            <div className="relative">
               <input
                 type="password"
                 value={formData.confirmPassword}
                 onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
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
            className="w-full bg-primary text-white py-5 rounded-none font-black uppercase tracking-[0.2em] hover:bg-primary-dark transition disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-primary/20 flex items-center justify-center gap-3 group mt-4"
          >
            {isLoading ? 'Đang xử lý...' : 'Xác nhận đổi mật khẩu'} <CheckCircle2 size={20} className="group-hover:scale-110 transition-transform"/>
          </button>
        </form>

        <div className="mt-8 text-center">
           <button 
              onClick={() => router.push('/forgot-password')}
              className="text-[10px] font-bold text-gray-400 hover:text-primary uppercase tracking-widest transition underline"
           >
              Gửi lại mã OTP mới
           </button>
        </div>
      </div>
    </div>
  );
}

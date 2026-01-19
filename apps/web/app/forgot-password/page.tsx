// app/forgot-password/page.tsx
"use client";

import { useState } from "react";
import { Mail, ChevronRight, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await res.json();
      if (res.ok) {
        toast.success('Mã OTP đã được gửi vào Email của bạn!');
        // Chuyển sang trang Reset mật khẩu và truyền email qua query param
        router.push(`/reset-password?email=${encodeURIComponent(email)}`);
      } else {
        toast.error(data.message || 'Email không tồn tại trong hệ thống!');
      }
    } catch (error) {
      toast.error('Lỗi kết nối server!');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 font-sans">
      <div className="bg-white rounded-none shadow-2xl p-8 w-full max-w-md border border-gray-100 relative">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-primary"></div>

        <div className="mb-8">
           <Link href="/login" className="inline-flex items-center gap-2 text-gray-400 hover:text-primary transition font-bold text-[10px] uppercase tracking-widest">
              <ArrowLeft size={14}/> Quay lại đăng nhập
           </Link>
        </div>

        <div className="text-center mb-10">
          <div className="bg-primary w-16 h-16 rounded-none flex items-center justify-center mx-auto mb-6 shadow-lg shadow-primary/20 rotate-3">
            <Mail className="text-white" size={32} />
          </div>
          <h2 className="text-3xl font-black italic tracking-tighter uppercase">QUÊN MẬT KHẨU?</h2>
          <p className="text-gray-400 mt-2 font-bold uppercase tracking-widest text-[10px]">Nhập email để nhận mã xác thực OTP</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Email Address</label>
            <div className="relative">
               <input
                 type="email"
                 value={email}
                 onChange={(e) => setEmail(e.target.value)}
                 className="w-full px-4 py-4 bg-gray-50 border-none rounded-none focus:ring-2 focus:ring-primary outline-none transition font-medium text-sm pl-12"
                 placeholder="email@example.com"
                 required
                 disabled={isLoading}
               />
               <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18}/>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary text-white py-5 rounded-none font-black uppercase tracking-[0.2em] hover:bg-primary-dark transition disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-primary/20 flex items-center justify-center gap-3 group"
          >
            {isLoading ? 'Đang gửi...' : 'Gửi mã xác thực'} <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform"/>
          </button>
        </form>

        <div className="mt-10 text-center text-[10px] font-bold uppercase tracking-widest text-gray-400 leading-relaxed">
           Nếu không nhận được email, vui lòng kiểm tra hộp thư rác (Spam) hoặc liên hệ hỗ trợ.
        </div>
      </div>
    </div>
  );
}

// app/forgot-password/page.tsx
"use client";

import { useState } from "react";
import { Mail, ChevronRight, ArrowLeft, KeyRound, CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

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
    <div className="min-h-screen flex items-stretch bg-white font-sans overflow-hidden">
      {/* Left Side: Brand Visual */}
      <div className="hidden lg:flex lg:w-1/2 bg-black relative flex-col justify-between p-12 text-white">
        <div className="absolute inset-0 opacity-40">
           <img 
             src="https://images.unsplash.com/photo-1512374382149-4332c6c02151?q=80&w=1931&auto=format&fit=crop" 
             alt="Lost in Sneaker" 
             className="w-full h-full object-cover"
           />
           <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black"></div>
        </div>
        
        <div className="relative z-10">
          <Link href="/" className="text-3xl font-black italic tracking-tighter italic">FOOTMARK.</Link>
        </div>

        <div className="relative z-10">
          <h1 className="text-7xl font-black italic uppercase leading-none tracking-tighter mb-6">
            LOST YOUR <br />
            <span className="text-primary text-8xl">WAY?</span>
          </h1>
          <p className="max-w-md text-gray-300 font-medium text-lg leading-relaxed">
            Đừng lo lắng, chúng tôi sẽ giúp bạn khôi phục quyền truy cập vào bộ sưu tập sneaker của mình trong vài bước đơn giản.
          </p>
        </div>

        <div className="relative z-10 flex gap-8 text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">
          <span>Security</span>
          <span>Privacy</span>
          <span>Support</span>
        </div>
      </div>

      {/* Right Side: Forgot Password Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 md:p-16 bg-white relative">
        <div className="w-full max-w-md">
          <div className="mb-10 lg:hidden text-center">
             <Link href="/" className="text-3xl font-black italic tracking-tighter italic inline-block mb-4">FOOTMARK.</Link>
          </div>

          <div className="mb-8">
             <Link href="/login" className="inline-flex items-center gap-2 text-gray-400 hover:text-black transition-colors font-black text-[10px] uppercase tracking-widest group">
                <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform"/> TRỞ LẠI ĐĂNG NHẬP
             </Link>
          </div>

          <div className="mb-12">
            <h2 className="text-4xl font-black italic uppercase tracking-tighter mb-2">Quên mật khẩu?</h2>
            <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Nhập email để nhận mã xác thực OTP khôi phục tài khoản</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-10">
            <div className="space-y-2 group">
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 group-focus-within:text-primary transition-colors">Địa chỉ Email xác thực</label>
              <div className="relative border-b-2 border-gray-100 group-focus-within:border-primary transition-all">
                 <input
                   type="email"
                   value={email}
                   onChange={(e) => setEmail(e.target.value)}
                   className="w-full py-4 bg-transparent outline-none font-bold text-lg placeholder:text-gray-200"
                   placeholder="your@email.com"
                   required
                   disabled={isLoading}
                 />
                 <Mail className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-200 group-focus-within:text-primary transition-colors" size={20}/>
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-black text-white py-6 rounded-none font-black uppercase tracking-[0.3em] hover:bg-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 group relative overflow-hidden"
              >
                <span className="relative z-10 flex items-center gap-3">
                  {isLoading ? 'Đang gửi mã...' : 'Gửi mã xác thực'} <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform"/>
                </span>
                <div className="absolute inset-0 bg-primary translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
              </button>
            </div>
          </form>

          <div className="mt-12 text-center">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 leading-relaxed max-w-xs mx-auto">
              Kiểm tra kỹ hộp thư đến và cả hộp thư rác (Spam). Nếu vẫn không nhận được, hãy thử lại sau vài phút.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

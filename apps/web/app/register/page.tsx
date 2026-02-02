// app/register/page.tsx
"use client";

import { useState } from "react";
import { User, Mail, Lock, ChevronRight, CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "../contexts/AuthContext";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setMessage('Mật khẩu không khớp!');
      return;
    }

    setIsLoading(true);
    setMessage('');

    try {
      await register({
        name: formData.name, 
        email: formData.email, 
        password: formData.password
      });
      setMessage('Đăng ký thành công!');
      setTimeout(() => router.push('/'), 2000);
    } catch (error: any) {
      setMessage(error.message || 'Đăng ký thất bại!');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-stretch bg-white font-sans overflow-hidden">
      {/* Left Side: Register Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 md:p-16 bg-white relative">
        <div className="w-full max-w-md">
          <div className="mb-10 lg:hidden text-center">
             <Link href="/" className="text-3xl font-black italic tracking-tighter italic inline-block mb-4">FOOTMARK.</Link>
          </div>

          <div className="mb-12">
            <h2 className="text-4xl font-black italic uppercase tracking-tighter mb-2">Gia nhập đội.</h2>
            <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Trở thành thành viên để nhận ưu đãi đặc quyền</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2 group">
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 group-focus-within:text-primary transition-colors">Họ và Tên</label>
              <div className="relative border-b-2 border-gray-100 group-focus-within:border-primary transition-all">
                 <input
                   type="text"
                   value={formData.name}
                   onChange={(e) => setFormData({...formData, name: e.target.value})}
                   className="w-full py-4 bg-transparent outline-none font-bold text-lg placeholder:text-gray-200"
                   placeholder="Nguyễn Văn A"
                   required
                   disabled={isLoading}
                 />
                 <User className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-200 group-focus-within:text-primary transition-colors" size={20}/>
              </div>
            </div>

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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 group">
                <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 group-focus-within:text-primary transition-colors">Mật khẩu</label>
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

              <div className="space-y-2 group">
                <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 group-focus-within:text-primary transition-colors">Xác nhận</label>
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

            <div className="pt-6">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-black text-white py-6 rounded-none font-black uppercase tracking-[0.3em] hover:bg-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 group relative overflow-hidden"
              >
                <span className="relative z-10 flex items-center gap-3">
                  {isLoading ? 'Đang tạo tài khoản...' : 'Đăng ký ngay'} <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform"/>
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
              Đã có tài khoản?{' '}
              <Link
                href="/login"
                className="text-black font-black hover:text-primary transition-colors border-b-2 border-black ml-1"
              >
                ĐĂNG NHẬP TẠI ĐÂY
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Right Side: Brand Visual */}
      <div className="hidden lg:flex lg:w-1/2 bg-black relative flex-col justify-between p-12 text-white">
        <div className="absolute inset-0 opacity-40">
           <img 
             src="https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?q=80&w=1974&auto=format&fit=crop" 
             alt="Sneaker Design" 
             className="w-full h-full object-cover"
           />
           <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black"></div>
        </div>
        
        <div className="relative z-10 text-right">
          <Link href="/" className="text-3xl font-black italic tracking-tighter italic">FOOTMARK.</Link>
        </div>

        <div className="relative z-10 text-right">
          <h1 className="text-7xl font-black italic uppercase leading-none tracking-tighter mb-6">
            JOIN THE <br />
            <span className="text-primary text-8xl">CULTURE.</span>
          </h1>
          <p className="max-w-md ml-auto text-gray-300 font-medium text-lg leading-relaxed">
            Nhận thông tin sớm nhất về các đợt Drop giày giới hạn và các chương trình ưu đãi dành riêng cho thành viên Elite.
          </p>
        </div>

        <div className="relative z-10 flex justify-end gap-8 text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">
          <span>Instagram</span>
          <span>Facebook</span>
          <span>TikTok</span>
        </div>
      </div>
    </div>
  );
}

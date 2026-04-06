// app/register/page.tsx
"use client";

import { useState } from "react";
import { User, Mail, Lock, ChevronRight, Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "../contexts/AuthContext";
import Link from "next/link";
import AuthLayout from "../../components/AuthLayout";
import toast from "react-hot-toast";

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      toast.error('Mật khẩu nhập lại không khớp!');
      return;
    }

    setIsLoading(true);
    
    // Simulate delay
    await new Promise(r => setTimeout(r, 500));

    try {
      await register({
        name: formData.name, 
        email: formData.email, 
        password: formData.password
      });
      toast.success('Đăng ký thành công! Đang chuyển hướng...');
      setTimeout(() => router.push('/'), 1500);
    } catch (error: any) {
      toast.error(error.message || 'Email này đã được sử dụng!');
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="JOIN THE CULTURE."
      subtitle="Nhận thông tin sớm nhất về các đợt Drop giày giới hạn và các chương trình ưu đãi dành riêng cho thành viên Elite."
      image="https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?q=80&w=1974&auto=format&fit=crop"
      side="right"
    >
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
               autoFocus
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
                 type={showPassword ? "text" : "password"}
                 value={formData.password}
                 onChange={(e) => setFormData({...formData, password: e.target.value})}
                 className="w-full py-4 bg-transparent outline-none font-bold text-lg placeholder:text-gray-200 pr-8"
                 placeholder="••••••••"
                 required
                 disabled={isLoading}
               />
               <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-200 hover:text-black transition-colors"
               >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
               </button>
            </div>
          </div>

          <div className="space-y-2 group">
            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 group-focus-within:text-primary transition-colors">Xác nhận</label>
            <div className="relative border-b-2 border-gray-100 group-focus-within:border-primary transition-all">
               <input
                 type={showConfirmPassword ? "text" : "password"}
                 value={formData.confirmPassword}
                 onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                 className="w-full py-4 bg-transparent outline-none font-bold text-lg placeholder:text-gray-200 pr-8"
                 placeholder="••••••••"
                 required
                 disabled={isLoading}
               />
               <button 
                  type="button" 
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-200 hover:text-black transition-colors"
               >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
               </button>
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
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                  Đang xử lý...
                </>
              ) : (
                <>Đăng ký ngay <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform"/></>
              )}
            </span>
            <div className="absolute inset-0 bg-primary translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
          </button>
        </div>
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
    </AuthLayout>
  );
}

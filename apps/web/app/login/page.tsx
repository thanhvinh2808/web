// app/login/page.tsx
"use client";

import { useEffect, useState } from "react";
import { User, Lock, Mail, ChevronRight, Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "../contexts/AuthContext";
import Link from "next/link";
import AuthLayout from "../../components/AuthLayout";
import toast from "react-hot-toast";

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate slight delay for better UX (prevent flickering)
    await new Promise(r => setTimeout(r, 500));

    try {
      await login(formData.email, formData.password);
      toast.success('Chào mừng trở lại FootMark!');
    } catch (error: any) {
      toast.error(error.message || 'Email hoặc mật khẩu không đúng');
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="STEP INTO THE FUTURE."
      subtitle="Khám phá những đôi giày Sneaker chính hãng và hàng 2Hand tuyển chọn. Định nghĩa lại phong cách của bạn cùng FootMark."
      image="https://images.unsplash.com/photo-1552346154-21d32810aba3?q=80&w=2070&auto=format&fit=crop"
      side="left"
    >
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
               autoFocus
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
               type={showPassword ? "text" : "password"}
               value={formData.password}
               onChange={(e) => setFormData({...formData, password: e.target.value})}
               className="w-full py-4 bg-transparent outline-none font-bold text-lg placeholder:text-gray-200 pr-10"
               placeholder="••••••••"
               required
               disabled={isLoading}
             />
             <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-200 hover:text-black transition-colors"
             >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
             </button>
          </div>
        </div>

        <div className="pt-4">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-black text-white py-6 rounded-none font-black uppercase tracking-[0.3em] hover:bg-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 group relative overflow-hidden"
          >
            <span className="relative z-10 flex items-center gap-3">
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                  Đang xác thực...
                </>
              ) : (
                <>Đăng nhập ngay <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform"/></>
              )}
            </span>
            <div className="absolute inset-0 bg-primary translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
          </button>
        </div>
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
    </AuthLayout>
  );
}

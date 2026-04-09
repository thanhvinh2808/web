// app/login/page.tsx
"use client";

import { useEffect, useState, Suspense } from "react";
import { User, Lock, Mail, ChevronRight, Eye, EyeOff } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "../contexts/AuthContext";
import Link from "next/link";
import AuthLayout from "../../components/AuthLayout";

import { signIn } from "next-auth/react";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const authError = searchParams.get("error");
  const { login, isAuthenticated } = useAuth();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authError) {
      if (authError === "OAuthSignin" || authError === "OAuthCallback") {
        setError("Lỗi xác thực với Google. Vui lòng thử lại.");
      } else if (authError === "OAuthAccountNotLinked") {
        setError("Email này đã được đăng ký bằng phương thức khác.");
      } else {
        setError(`Lỗi đăng nhập: ${authError}`);
      }
    }
  }, [authError]);

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Simulate slight delay for better UX (prevent flickering)
    await new Promise((r) => setTimeout(r, 500));

    try {
      await login(formData.email, formData.password);
    } catch (err: any) {
      setError(err.message || "Email hoặc mật khẩu không đúng");
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
        <Link
          href="/"
          className="text-3xl font-black italic tracking-tighter italic inline-block mb-4"
        >
          FOOTMARK.
        </Link>
      </div>

      <div className="mb-12">
        <h2 className="text-4xl font-black italic uppercase tracking-tighter mb-2">
          Đăng nhập.
        </h2>
        <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">
          Tiếp tục cuộc hành trình sneaker của bạn
        </p>
      </div>

      {error && (
        <div className="mb-8 p-4 bg-red-50 border-l-4 border-red-600 animate-in fade-in slide-in-from-left-2 duration-300">
          <p className="text-xs font-black uppercase tracking-widest text-red-600">
            Lỗi xác thực
          </p>
          <p className="text-sm font-bold text-red-900 mt-1">
            {error}
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="space-y-2 group">
          <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 group-focus-within:text-primary transition-colors">
            Địa chỉ Email
          </label>
          <div className="relative border-b-2 border-gray-100 group-focus-within:border-primary transition-all">
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="w-full py-4 bg-transparent outline-none font-bold text-lg placeholder:text-gray-200"
              placeholder="your@email.com"
              required
              disabled={isLoading}
              autoFocus
            />
            <Mail
              className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-200 group-focus-within:text-primary transition-colors"
              size={20}
            />
          </div>
        </div>

        <div className="space-y-2 group">
          <div className="flex justify-between items-center">
            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 group-focus-within:text-primary transition-colors">
              Mật khẩu
            </label>
            <Link
              href="/forgot-password"
              title="Quên mật khẩu?"
              className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline"
            >
              {" "}
              Quên?
            </Link>
          </div>
          <div className="relative border-b-2 border-gray-100 group-focus-within:border-primary transition-all">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
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
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Đang xác thực...
                </>
              ) : (
                <>
                  Đăng nhập ngay{" "}
                  <ChevronRight
                    size={20}
                    className="group-hover:translate-x-1 transition-transform"
                  />
                </>
              )}
            </span>
            <div className="absolute inset-0 bg-primary translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
          </button>
        </div>

        <div className="relative py-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-100"></div>
          </div>
          <div className="relative flex justify-center text-[10px] font-black uppercase tracking-widest">
            <span className="bg-white px-4 text-gray-400">Hoặc sử dụng email</span>
          </div>
        </div>

        <div className="pt-2">
           <button
            type="button"
            onClick={() => signIn("google")}
            disabled={isLoading}
            className="w-full bg-white text-black border-2 border-gray-100 py-6 rounded-none font-black uppercase tracking-[0.3em] hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 group relative overflow-hidden"
          >
            <span className="relative z-10 flex items-center gap-3">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1 .67-2.28 1.07-3.71 1.07-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.11c-.22-.67-.35-1.39-.35-2.11s.13-1.44.35-2.11V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.83z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              Đăng nhập bằng Google
            </span>
          </button>
        </div>
      </form>

      <div className="mt-12 text-center">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-400">
          Chưa có tài khoản?{" "}
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

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}

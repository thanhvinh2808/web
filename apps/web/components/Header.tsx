// app/components/Header.tsx
"use client";
import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { ShoppingCart, User, Menu, X, Heart, Search, LogOut, LogIn } from "lucide-react";
import { useCart } from '../app/contexts/CartContext';
import { useAuth } from '../app/contexts/AuthContext';

interface HeaderProps {
  cartCount?: number;
}

export const Header = ({ cartCount = 0 }: HeaderProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  
  // ✅ Sử dụng useCart và useAuth
  const { cart } = useCart();
  const { user, isLoading, logout } = useAuth();
  
  // Tính số lượng động từ cart
  const dynamicCartCount = cart.length;

  useEffect(() => {
    const user = localStorage.getItem('user');
    setIsAuthenticated(!!user);
  }, []);

  const handleUserIconClick = () => {
    if (user) {
      router.push('/profile');
    } else {
      router.push('/login');
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setIsMenuOpen(false);
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <header className="border-b sticky top-0 bg-white/95 backdrop-blur-md z-50 shadow-sm text-gray-900 font-sans">
      <div className="container mx-auto px-4 h-20 flex items-center justify-between">
        
        {/* Logo */}
        <Link href="/" className="flex flex-col group">
          <h1 className="text-2xl md:text-3xl font-black tracking-tighter text-black leading-none group-hover:opacity-80 transition">
            FOOT<span className="text-blue-600">MARK</span>.
          </h1>
          <span className="text-[8px] md:text-[10px] font-bold tracking-[0.2em] text-gray-500 uppercase">Authentic Sneakers</span>
        </Link>

        {/* Search Bar (Hidden on mobile) */}
        <div className="hidden md:flex flex-1 mx-8 lg:mx-12 max-w-lg relative group">
           <input 
              type="text" 
              placeholder="Tìm kiếm: Jordan 1, 350 V2, Size 42..." 
              className="w-full bg-gray-100 border-none rounded-full py-2.5 pl-12 pr-4 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all group-hover:bg-gray-50"
           />
           <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-blue-500 transition" size={18}/>
        </div>

        {/* Desktop Menu & Actions */}
        <div className="flex items-center gap-6">
           <nav className="hidden lg:flex gap-6 font-bold text-sm uppercase tracking-wide">
              <Link href="/products?type=new" className="hover:text-blue-600 transition relative group">
                Hàng Mới
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 transition-all group-hover:w-full"></span>
              </Link>
              <Link href="/products?type=2hand" className="hover:text-red-600 transition text-red-600 relative group">
                2Hand Deal
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-red-600 transition-all group-hover:w-full"></span>
              </Link>
              <Link href="/blog" className="hover:text-blue-600 transition">Blog</Link>
           </nav>

           <div className="flex items-center gap-2 md:gap-4 md:border-l md:pl-6">
              <button className="relative group hidden md:block hover:bg-gray-100 p-2 rounded-full transition">
                  <Heart size={24} className="group-hover:text-red-500 transition"/>
              </button>
              
              <Link href="/cart" className="relative group hover:bg-gray-100 p-2 rounded-full transition">
                 <ShoppingCart size={24} className="group-hover:text-blue-600 transition"/>
                 {dynamicCartCount > 0 && (
                   <span className="absolute top-0 right-0 bg-black text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold group-hover:bg-blue-600 transition">
                     {dynamicCartCount}
                   </span>
                 )}
              </Link>

              {/* User Menu Desktop */}
              <div className="hidden md:block relative">
                 {user ? (
                   <div className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 p-1.5 pr-3 rounded-full transition" onClick={() => router.push('/profile')}>
                      <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">
                        {user.name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <span className="text-sm font-bold max-w-[100px] truncate">{user.name}</span>
                   </div>
                 ) : (
                   <button onClick={() => router.push('/login')} className="flex items-center gap-2 text-sm font-bold hover:text-blue-600 transition">
                      <User size={24}/>
                   </button>
                 )}
              </div>

              {/* Mobile Menu Button */}
              <button 
                className="lg:hidden hover:bg-gray-100 p-2 rounded-lg transition"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
           </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMenuOpen && (
        <div className="lg:hidden bg-white border-t border-gray-100 absolute w-full left-0 shadow-xl py-4 px-4 flex flex-col gap-4 animate-in slide-in-from-top-5 fade-in duration-200">
           {/* Mobile Search */}
           <div className="relative">
              <input 
                 type="text" 
                 placeholder="Tìm kiếm..." 
                 className="w-full bg-gray-100 border-none rounded-lg py-3 pl-10 pr-4 text-sm outline-none"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18}/>
           </div>

           <nav className="flex flex-col gap-4 font-bold text-sm uppercase">
              <Link href="/products?type=new" onClick={() => setIsMenuOpen(false)} className="py-2 border-b border-gray-50 hover:text-blue-600">Hàng Mới</Link>
              <Link href="/products?type=2hand" onClick={() => setIsMenuOpen(false)} className="py-2 border-b border-gray-50 text-red-600">2Hand Deal</Link>
              <Link href="/blog" onClick={() => setIsMenuOpen(false)} className="py-2 border-b border-gray-50 hover:text-blue-600">Blog Kiến Thức</Link>
              <Link href="/contact" onClick={() => setIsMenuOpen(false)} className="py-2 border-b border-gray-50 hover:text-blue-600">Liên Hệ</Link>
           </nav>

           <div className="pt-2">
              {user ? (
                <>
                  <button onClick={() => {router.push('/profile'); setIsMenuOpen(false);}} className="flex items-center gap-3 w-full py-3 hover:bg-gray-50 rounded-lg">
                    <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">
                        {user.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <span className="text-sm font-bold">{user.name}</span>
                  </button>
                  <button onClick={handleLogout} className="flex items-center gap-3 w-full py-3 text-red-500 hover:bg-red-50 rounded-lg mt-2">
                    <LogOut size={20}/>
                    <span>Đăng xuất</span>
                  </button>
                </>
              ) : (
                <button onClick={() => {router.push('/login'); setIsMenuOpen(false);}} className="flex items-center gap-3 w-full py-3 bg-black text-white justify-center rounded-lg font-bold uppercase text-sm">
                  <LogIn size={18}/>
                  <span>Đăng nhập / Đăng ký</span>
                </button>
              )}
           </div>
        </div>
      )}
    </header>
  );
};
// app/components/Header.tsx
"use client";
import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { ShoppingCart, User, Menu, X, Heart, Search, LogOut, LogIn, ShieldCheck } from "lucide-react";
import { useCart } from '../app/contexts/CartContext';
import { useAuth } from '../app/contexts/AuthContext';
import { useWishlist } from '../app/contexts/WishlistContext';
import { CLEAN_API_URL } from '@lib/shared/constants';
import { getImageUrl } from '../lib/imageHelper';

const API_URL = CLEAN_API_URL;

interface HeaderProps {
  cartCount?: number;
}

export const Header = ({ cartCount = 0 }: HeaderProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const router = useRouter();
  const pathname = usePathname();
  
  const { cart } = useCart();
  const { user, logout } = useAuth();
  const { wishlist } = useWishlist();
  
  const dynamicCartCount = cart.length;
  const wishlistCount = wishlist.length;

  // ✅ Search Suggestions Logic
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (searchQuery.trim().length < 2) {
        setSuggestions([]);
        return;
      }

      try {
        const res = await fetch(`${API_URL}/api/products`);
        const data = await res.json();
        const allProducts = Array.isArray(data) ? data : data.data || [];
        
        const filtered = allProducts.filter((p: any) => 
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.brand?.toLowerCase().includes(searchQuery.toLowerCase())
        ).slice(0, 5);

        setSuggestions(filtered);
        setShowSuggestions(true);
      } catch (error) {
        console.error("Error:", error);
      }
    };

    const timeoutId = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setIsMenuOpen(false);
      setShowSuggestions(false);
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
    <>
      <div className={`${isScrolled ? 'h-16' : 'h-20'} transition-all duration-300`}></div>

      <header className={`fixed top-0 left-0 w-full z-[100] transition-all duration-300 border-b border-gray-100 ${isScrolled ? "bg-white shadow-md h-16" : "bg-white h-20 shadow-none"}`}>
        <div className="container mx-auto px-4 h-full flex items-center justify-between">
          
          <Link href="/" className="flex flex-col group">
            <h1 className={`font-black tracking-tighter text-black leading-none group-hover:opacity-80 transition-all duration-300 ${isScrolled ? 'text-2xl' : 'text-3xl'}`}>
              FOOT<span className="text-primary">MARK</span>.
            </h1>
            <span className={`font-bold tracking-[0.2em] text-gray-500 uppercase transition-all duration-300 ${isScrolled ? 'text-[0px] opacity-0 h-0' : 'text-[8px] md:text-[10px] opacity-100'}`}>Authentic Sneakers</span>
          </Link>

          <form onSubmit={handleSearch} className="hidden md:flex flex-1 mx-8 lg:mx-12 max-w-lg relative group transition-all duration-300">
             <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm giày..." 
                className="w-full bg-gray-100 border-none rounded-none py-2.5 pl-12 pr-4 text-sm focus:ring-2 focus:ring-primary outline-none transition-all font-medium"
             />
             <button type="submit" className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-primary transition">
                <Search size={18}/>
             </button>

             {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full left-0 w-full bg-white shadow-2xl border border-gray-100 mt-1 z-[110] animate-in fade-in slide-in-from-top-2 duration-200">
                   <div className="p-2 border-b border-gray-50">
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-2">Gợi ý</p>
                   </div>
                   <div className="max-h-[400px] overflow-y-auto">
                      {suggestions.map((p) => (
                         <Link key={p._id} href={`/products/${p.slug}`} onClick={() => {setShowSuggestions(false); setSearchQuery("");}} className="flex items-center gap-4 p-3 hover:bg-gray-50 transition-colors">
                            <div className="w-12 h-12 bg-gray-100 overflow-hidden flex-shrink-0">
                               <img src={getImageUrl(p.image)} alt={p.name} className="w-full h-full object-cover" onError={(e: any) => e.target.src = '/placeholder-product.jpg'} />
                            </div>
                            <div className="flex-1 min-w-0">
                               <p className="text-sm font-bold text-gray-900 truncate uppercase italic">{p.name}</p>
                               <p className="text-xs text-gray-500 font-medium">{p.brand}</p>
                            </div>
                            <div className="text-right">
                               <p className="text-sm font-black text-black">{p.price?.toLocaleString()}₫</p>
                            </div>
                         </Link>
                      ))}
                   </div>
                </div>
             )}
          </form>

          <div className="flex items-center gap-6 h-full">
             <nav className="hidden lg:flex gap-6 font-bold text-sm uppercase tracking-wide">
                <Link href="/products?type=new" className="hover:text-primary transition relative group">Hàng Mới</Link>
                <Link href="/products?type=2hand" className="hover:text-red-600 transition text-red-600 relative group">2Hand Deal</Link>
                <Link href="/blog" className="hover:text-primary transition">Blog</Link>
             </nav>

             <div className="flex items-center gap-2 md:gap-4 md:border-l md:pl-6 h-full">
                <Link href="/profile/wishlist" className="relative group hidden md:block hover:bg-gray-100 p-2 rounded-none transition">
                    <Heart size={24} className="group-hover:text-red-500 transition"/>
                    {wishlistCount > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-5 h-5 flex items-center justify-center font-bold">{wishlistCount}</span>}
                </Link>
                
                <Link href="/cart" className="relative group hover:bg-gray-100 p-2 rounded-none transition">
                   <ShoppingCart size={24} className="group-hover:text-primary transition"/>
                   {dynamicCartCount > 0 && <span className="absolute -top-1 -right-1 bg-primary text-white text-[10px] w-5 h-5 flex items-center justify-center font-bold">{dynamicCartCount}</span>}
                </Link>

                <div className="hidden md:flex items-center gap-3 relative group h-full">
                   {user ? (
                     <>
                       <div className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 h-full px-3 transition" onClick={() => router.push('/profile')}>
                          <div className="w-8 h-8 bg-blue-100 text-primary flex items-center justify-center font-bold border border-blue-200 overflow-hidden">
                            {user.avatar ? (
                               <img src={getImageUrl(user.avatar)} alt={user.name} className="w-full h-full object-cover" />
                            ) : (
                               user.name?.charAt(0).toUpperCase() || 'U'
                            )}
                          </div>
                          <div className="flex flex-col">
                            
                            <span className="text-xs font-black max-w-[100px] truncate uppercase tracking-tighter leading-none">{user.name}</span>
                          </div>
                       </div>

                       <div className="absolute top-full right-0 w-48 bg-white shadow-2xl border border-gray-100 py-2 hidden group-hover:block animate-in fade-in slide-in-from-top-2 duration-200 z-[120]">
                          <Link href="/profile" className="flex items-center gap-3 px-4 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 hover:text-primary transition">
                             <User size={14} /> Tài khoản của tôi
                          </Link>
                          <Link href="/profile/orders" className="flex items-center gap-3 px-4 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 hover:text-primary transition">
                             <ShoppingCart size={14} /> Đơn mua
                          </Link>
                          {user.role === 'admin' && (
                             <Link href="/admin" className="flex items-center gap-3 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-50/50 hover:bg-blue-50 transition border-y border-blue-100 my-1">
                                <ShieldCheck size={14} /> Trang quản trị
                             </Link>
                          )}
                          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-red-500 hover:bg-red-50 transition mt-1">
                            <LogOut size={14} /> Đăng xuất
                          </button>
                       </div>
                     </>
                   ) : (
                     <button onClick={() => router.push('/login')} className="flex items-center gap-2 text-sm font-bold hover:text-primary transition p-2 border-l border-gray-100 pl-4">
                        <User size={24}/>
                     </button>
                   )}
                </div>

                <button className="lg:hidden hover:bg-gray-100 p-2 rounded-none transition" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                  {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
             </div>
          </div>
        </div>

        {isMenuOpen && (
          <div className="lg:hidden bg-white border-t border-gray-100 absolute w-full left-0 shadow-xl py-4 px-4 flex flex-col gap-4 animate-in slide-in-from-top-5 fade-in duration-200 h-screen">
             <form onSubmit={handleSearch} className="relative">
                <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Tìm kiếm..." className="w-full bg-gray-100 border-none py-3 pl-10 pr-4 text-sm outline-none" />
                <button type="submit" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><Search size={18}/></button>
             </form>

             <nav className="flex flex-col gap-4 font-bold text-sm uppercase">
                <Link href="/products?type=new" onClick={() => setIsMenuOpen(false)} className="py-2 border-b border-gray-50">Hàng Mới</Link>
                <Link href="/products?type=2hand" onClick={() => setIsMenuOpen(false)} className="py-2 border-b border-gray-50 text-red-600">2Hand Deal</Link>
                <Link href="/blog" onClick={() => setIsMenuOpen(false)} className="py-2 border-b border-gray-50">Blog</Link>
             </nav>

             <div className="pt-2">
                {user ? (
                  <>
                    <button onClick={() => {router.push('/profile'); setIsMenuOpen(false);}} className="flex items-center gap-3 w-full py-3 hover:bg-gray-50 rounded-none border-b border-gray-50">
                      <div className="w-10 h-10 bg-blue-100 text-primary flex items-center justify-center font-bold border border-blue-200 overflow-hidden">
                          {user.avatar ? <img src={getImageUrl(user.avatar)} alt={user.name} className="w-full h-full object-cover" /> : (user.name?.charAt(0).toUpperCase() || 'U')}
                      </div>
                      <div className="text-left">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Tài khoản</p>
                        <p className="text-sm font-black uppercase italic tracking-tighter leading-none">{user.name}</p>
                      </div>
                    </button>
                    {user.role === 'admin' && (
                      <button onClick={() => {router.push('/admin'); setIsMenuOpen(false);}} className="flex items-center gap-3 w-full py-4 text-blue-600 hover:bg-blue-50 border-b border-gray-50">
                        <ShieldCheck size={20}/>
                        <span className="text-sm font-black uppercase tracking-widest">Trang quản trị</span>
                      </button>
                    )}
                    <button onClick={handleLogout} className="flex items-center gap-3 w-full py-3 text-red-500 hover:bg-red-50 mt-2">
                      <LogOut size={20}/>
                      <span>Đăng xuất</span>
                    </button>
                  </>
                ) : (
                  <button onClick={() => {router.push('/login'); setIsMenuOpen(false);}} className="flex items-center gap-3 w-full py-3 bg-primary text-white justify-center font-bold uppercase text-sm">
                    <LogIn size={18}/>
                    <span>Đăng nhập</span>
                  </button>
                )}
             </div>
          </div>
        )}
      </header>
    </>
  );
};

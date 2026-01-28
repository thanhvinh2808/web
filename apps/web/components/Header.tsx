// app/components/Header.tsx
"use client";
import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { ShoppingCart, User, Menu, X, Heart, Search, LogOut, LogIn } from "lucide-react";
import { useCart } from '../app/contexts/CartContext';
import { useAuth } from '../app/contexts/AuthContext';
import { useWishlist } from '../app/contexts/WishlistContext';

interface HeaderProps {
  cartCount?: number;
}

export const Header = ({ cartCount = 0 }: HeaderProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const router = useRouter();
  const pathname = usePathname();
  
  const { cart } = useCart();
  const { user, isLoading, logout } = useAuth();
  const { wishlist } = useWishlist();
  
  const dynamicCartCount = cart.length;

  // ✅ Search Suggestions Logic
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (searchQuery.trim().length < 2) {
        setSuggestions([]);
        return;
      }

      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
        const res = await fetch(`${API_URL}/api/products`);
        const data = await res.json();
        const allProducts = Array.isArray(data) ? data : data.data || [];
        
        const filtered = allProducts.filter((p: any) => 
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.brand?.toLowerCase().includes(searchQuery.toLowerCase())
        ).slice(0, 5); // Lấy tối đa 5 gợi ý

        setSuggestions(filtered);
        setShowSuggestions(true);
      } catch (error) {
        console.error("Error fetching suggestions:", error);
      }
    };

    const timeoutId = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // ✅ Close suggestions on click outside
  useEffect(() => {
    const handleClickOutside = () => setShowSuggestions(false);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setIsMenuOpen(false);
      setShowSuggestions(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch(e as any);
    }
  };

  useEffect(() => {
    const user = localStorage.getItem('user');
    setIsAuthenticated(!!user);

    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
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
    <>
      {/* Spacer để nội dung không bị Header che mất vì Header là fixed */}
      <div className={`${isScrolled ? 'h-16' : 'h-20'} transition-all duration-300`}></div>

      <header 
        className={`fixed top-0 left-0 w-full z-[100] transition-all duration-300 border-b border-gray-100 ${
          isScrolled 
            ? "bg-white shadow-md h-16" 
            : "bg-white h-20 shadow-none"
        }`}
      >
        <div className="container mx-auto px-4 h-full flex items-center justify-between">
          
          {/* Logo */}
          <Link href="/" className="flex flex-col group">
            <h1 className={`font-black tracking-tighter text-black leading-none group-hover:opacity-80 transition-all duration-300 ${isScrolled ? 'text-2xl' : 'text-3xl'}`}>
              FOOT<span className="text-primary">MARK</span>.
            </h1>
            <span className={`font-bold tracking-[0.2em] text-gray-500 uppercase transition-all duration-300 ${isScrolled ? 'text-[0px] opacity-0 h-0' : 'text-[8px] md:text-[10px] opacity-100'}`}>Authentic Sneakers</span>
          </Link>

          {/* Search Bar (Hidden on mobile) */}
          <form 
            onSubmit={handleSearch} 
            className={`hidden md:flex flex-1 mx-8 lg:mx-12 max-w-lg relative group transition-all duration-300 ${isScrolled ? 'scale-95' : 'scale-100'}`}
            onClick={(e) => e.stopPropagation()}
          >
             <input 
                type="text" 
                placeholder="Tìm kiếm: Jordan 1, 350 V2, Size 42..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => searchQuery.length >= 2 && setShowSuggestions(true)}
                className="w-full bg-gray-100 border-none rounded-none py-2.5 pl-12 pr-4 text-sm focus:ring-2 focus:ring-primary outline-none transition-all group-hover:bg-gray-50 font-medium"
             />
             <button type="submit" className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-primary transition">
                <Search size={18}/>
             </button>

             {/* Search Suggestions Dropdown */}
             {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full left-0 w-full bg-white shadow-2xl border border-gray-100 mt-1 z-[110] animate-in fade-in slide-in-from-top-2 duration-200">
                   <div className="p-2 border-b border-gray-50">
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-2">Sản phẩm gợi ý</p>
                   </div>
                   <div className="max-h-[400px] overflow-y-auto">
                      {suggestions.map((p) => (
                         <Link 
                            key={p._id} 
                            href={`/products/${p.slug}`}
                            onClick={() => {
                               setShowSuggestions(false);
                               setSearchQuery("");
                            }}
                            className="flex items-center gap-4 p-3 hover:bg-gray-50 transition-colors group/item"
                         >
                            <div className="w-12 h-12 bg-gray-100 overflow-hidden flex-shrink-0">
                               <img 
                                  src={p.image?.startsWith('http') ? p.image : `http://localhost:5000${p.image}`} 
                                  alt={p.name} 
                                  className="w-full h-full object-cover"
                                  onError={(e: any) => e.target.src = '/placeholder-product.jpg'}
                               />
                            </div>
                            <div className="flex-1 min-w-0">
                               <p className="text-sm font-bold text-gray-900 truncate group-hover/item:text-primary transition-colors uppercase italic">{p.name}</p>
                               <p className="text-xs text-gray-500 font-medium">{p.brand}</p>
                            </div>
                            <div className="text-right">
                               <p className="text-sm font-black text-black">{p.price?.toLocaleString()}₫</p>
                            </div>
                         </Link>
                      ))}
                   </div>
                   <button 
                      onClick={handleSearch}
                      className="w-full p-3 text-center text-xs font-black uppercase tracking-widest bg-gray-50 hover:bg-primary hover:text-white transition-all border-t border-gray-100"
                   >
                      Xem tất cả kết quả cho "{searchQuery}"
                   </button>
                </div>
             )}
          </form>

          {/* Desktop Menu & Actions */}
          <div className="flex items-center gap-6">
             <nav className="hidden lg:flex gap-6 font-bold text-sm uppercase tracking-wide">
                <Link href="/products?type=new" className="hover:text-primary transition relative group">
                  Hàng Mới
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full"></span>
                </Link>
                <Link href="/products?type=2hand" className="hover:text-red-600 transition text-red-600 relative group">
                  2Hand Deal
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-red-600 transition-all group-hover:w-full"></span>
                </Link>
                <Link href="/blog" className="hover:text-primary transition">Blog</Link>
             </nav>

             <div className="flex items-center gap-2 md:gap-4 md:border-l md:pl-6">
                <Link href="/wishlist" className="relative group hidden md:block hover:bg-gray-100 p-2 rounded-none transition">
                    <Heart size={24} className={`${wishlist.length > 0 ? 'text-red-500 fill-red-500' : 'group-hover:text-red-500'} transition`}/>
                    {wishlist.length > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-5 h-5 rounded-none flex items-center justify-center font-bold">
                        {wishlist.length}
                      </span>
                    )}
                </Link>
                
                <Link href="/cart" className="relative group hover:bg-gray-100 p-2 rounded-none transition">
                   <ShoppingCart size={24} className="group-hover:text-primary transition"/>
                   {dynamicCartCount > 0 && (
                     <span className="absolute -top-1 -right-1 bg-primary text-white text-[10px] w-5 h-5 rounded-none flex items-center justify-center font-bold group-hover:bg-primary-dark transition">
                       {dynamicCartCount}
                     </span>
                   )}
                </Link>

                {/* User Menu Desktop */}
                <div className="hidden md:block relative group">
                   {user ? (
                     <>
                       <div className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 p-1.5 pr-3 rounded-none transition" onClick={() => router.push('/profile')}>
                          <div className="w-8 h-8 bg-blue-100 text-primary rounded-none flex items-center justify-center font-bold">
                            {user.name?.charAt(0).toUpperCase() || 'U'}
                          </div>
                          <span className="text-sm font-bold max-w-[100px] truncate">{user.name}</span>
                       </div>
                       
                       {/* Dropdown on Hover */}
                       <div className="absolute right-0 top-full pt-2 w-48 hidden group-hover:block z-50">
                          <div className="bg-white shadow-xl border border-gray-100 py-2 rounded-none">
                              <div className="px-4 py-2 border-b border-gray-50 mb-1">
                                <p className="text-xs text-gray-500">Xin chào,</p>
                                <p className="font-bold text-sm truncate">{user.name}</p>
                              </div>
                              <Link href="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary font-medium transition-colors">
                                  Tài khoản của tôi
                              </Link>
                              {user.role === 'admin' && (
                                <Link href="/admin" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary font-medium transition-colors">
                                    Trang quản trị
                                </Link>
                              )}
                              <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleLogout();
                                  }}
                                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 font-medium flex items-center gap-2 transition-colors mt-1"
                              >
                                  <LogOut size={16} />
                                  Đăng xuất
                              </button>
                          </div>
                       </div>
                     </>
                   ) : (
                     <button onClick={() => router.push('/login')} className="flex items-center gap-2 text-sm font-bold hover:text-primary transition">
                        <User size={24}/>
                     </button>
                   )}
                </div>

                {/* Mobile Menu Button */}
                <button 
                  className="lg:hidden hover:bg-gray-100 p-2 rounded-none transition"
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                >
                  {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
             </div>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMenuOpen && (
          <div className="lg:hidden bg-white border-t border-gray-100 absolute w-full left-0 shadow-xl py-4 px-4 flex flex-col gap-4 animate-in slide-in-from-top-5 fade-in duration-200 h-screen">
             {/* Mobile Search */}
             <form onSubmit={handleSearch} className="relative" onClick={(e) => e.stopPropagation()}>
                <input 
                   type="text" 
                   placeholder="Tìm kiếm..." 
                   value={searchQuery}
                   onChange={(e) => setSearchQuery(e.target.value)}
                   onFocus={() => searchQuery.length >= 2 && setShowSuggestions(true)}
                   className="w-full bg-gray-100 border-none rounded-none py-3 pl-10 pr-4 text-sm outline-none focus:ring-1 focus:ring-primary"
                />
                <button type="submit" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                   <Search size={18}/>
                </button>

                {/* Mobile Suggestions */}
                {showSuggestions && suggestions.length > 0 && (
                   <div className="absolute top-full left-0 w-full bg-white shadow-xl border border-gray-100 mt-1 z-[110]">
                      {suggestions.map((p) => (
                         <Link 
                            key={p._id} 
                            href={`/products/${p.slug}`}
                            onClick={() => {
                               setShowSuggestions(false);
                               setIsMenuOpen(false);
                               setSearchQuery("");
                            }}
                            className="flex items-center gap-3 p-3 border-b border-gray-50"
                         >
                            <img 
                               src={p.image?.startsWith('http') ? p.image : `http://localhost:5000${p.image}`} 
                               alt={p.name} 
                               className="w-10 h-10 object-cover"
                            />
                            <div className="flex-1 min-w-0">
                               <p className="text-sm font-bold truncate uppercase italic">{p.name}</p>
                               <p className="text-xs text-gray-500">{p.price?.toLocaleString()}₫</p>
                            </div>
                         </Link>
                      ))}
                   </div>
                )}
             </form>

             <nav className="flex flex-col gap-4 font-bold text-sm uppercase">
                <Link href="/products?type=new" onClick={() => setIsMenuOpen(false)} className="py-2 border-b border-gray-50 hover:text-primary">Hàng Mới</Link>
                <Link href="/products?type=2hand" onClick={() => setIsMenuOpen(false)} className="py-2 border-b border-gray-50 text-red-600">2Hand Deal</Link>
                <Link href="/blog" onClick={() => setIsMenuOpen(false)} className="py-2 border-b border-gray-50 hover:text-primary">Blog Kiến Thức</Link>
                <Link href="/contact" onClick={() => setIsMenuOpen(false)} className="py-2 border-b border-gray-50 hover:text-primary">Liên Hệ</Link>
             </nav>

             <div className="pt-2">
                {user ? (
                  <>
                    <button onClick={() => {router.push('/profile'); setIsMenuOpen(false);}} className="flex items-center gap-3 w-full py-3 hover:bg-gray-50 rounded-none">
                      <div className="w-8 h-8 bg-blue-100 text-primary rounded-none flex items-center justify-center font-bold">
                          {user.name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <span className="text-sm font-bold">{user.name}</span>
                    </button>
                    <button onClick={handleLogout} className="flex items-center gap-3 w-full py-3 text-red-500 hover:bg-red-50 rounded-none mt-2">
                      <LogOut size={20}/>
                      <span>Đăng xuất</span>
                    </button>
                  </>
                ) : (
                  <button onClick={() => {router.push('/login'); setIsMenuOpen(false);}} className="flex items-center gap-3 w-full py-3 bg-primary text-white justify-center rounded-none font-bold uppercase text-sm hover:bg-primary-dark">
                    <LogIn size={18}/>
                    <span>Đăng nhập / Đăng ký</span>
                  </button>
                )}
             </div>
          </div>
        )}
      </header>
    </>
  );
};
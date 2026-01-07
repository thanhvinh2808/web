// app/components/Header.tsx
"use client";
import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Box, ShoppingCart, User, Menu, X, Home, Package, Info, BookOpen, Mail, HelpCircle, LogIn, LogOut } from "lucide-react";
import { SearchBar } from "./SearchBar";
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
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsAuthenticated(!!user);
  }, []);

  const navigation = [
    { name: 'Trang chủ', href: '/', icon: Home },
    { name: 'Sản phẩm', href: '/products', icon: Package },
    { name: 'Giới thiệu', href: '/about', icon: Info },
    { name: 'Blog', href: '/blog', icon: BookOpen },
    { name: 'Liên hệ', href: '/contact', icon: Mail },
    { name: 'FAQ', href: '/faq', icon: HelpCircle },
  ];

  const categories = [
    { name: 'Điện thoại', slug: 'smartphones', icon: '📱' },
    { name: 'Laptop', slug: 'laptops', icon: '💻' },
    { name: 'Máy tính bảng', slug: 'tablets', icon: '📲' },
    { name: 'Âm thanh', slug: 'audio', icon: '🎧' },
    { name: 'Đồng hồ', slug: 'wearables', icon: '⌚' },
    { name: 'Camera', slug: 'cameras', icon: '📷' },
    { name: 'Gaming', slug: 'gaming', icon: '🎮' },
    { name: 'Phụ kiện', slug: 'accessories', icon: '⚡' },
  ];

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname?.startsWith(href);
  };

  const handleUserIconClick = () => {
    if (user) {
      router.push('/profile');
    } else {
      router.push('/login');
    }
  };

  const handleLogout = async () => {
    try {
      await logout(); // ✅ Dùng logout từ AuthContext
      setIsMenuOpen(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <header className="bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between py-4">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 cursor-pointer">
            <div className="bg-white p-2 rounded-lg">
              <Box className="text-blue-600" size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold">TechStore</h1>
              <p className="text-xs text-blue-100">Công nghệ hàng đầu</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center space-x-1 px-4 py-2 rounded-lg transition-all ${
                  isActive(item.href)
                    ? 'bg-white text-blue-600 shadow-md'
                    : 'hover:bg-white/10'
                }`}
              >
                <item.icon size={18} />
                <span>{item.name}</span>
              </Link>
            ))}
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center space-x-3">
            {/* Search Component */}
            <SearchBar />
            
            {/* Cart with Dynamic Badge */}
            <Link 
              href="/cart"
              className="relative hover:bg-white/10 p-2 rounded-lg transition group"
              id="cart-icon"
            >
              <ShoppingCart size={20} />
              {dynamicCartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold animate-bounce group-hover:scale-110 transition-transform">
                  {dynamicCartCount}
                </span>
              )}
            </Link>
            
            <button 
              onClick={handleUserIconClick}
              className="hidden md:flex items-center gap-2 hover:bg-white/10 p-2 rounded-lg transition"
              title={user ? 'Tài khoản của tôi' : 'Đăng nhập'}
            >
              <User size={20} />
              <span className="text-sm">{user?.name || 'Đăng nhập'}</span>
            </button>
            
            <button 
              className="md:hidden hover:bg-white/10 p-2 rounded-lg transition"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <nav className="md:hidden py-4 border-t border-white/20">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMenuOpen(false)}
                className={`flex items-center space-x-3 w-full px-4 py-3 rounded-lg transition ${
                  isActive(item.href)
                    ? 'bg-white text-blue-600'
                    : 'hover:bg-white/10'
                }`}
              >
                <item.icon size={20} />
                <span>{item.name}</span>
              </Link>
            ))}
            
            <div className="mt-4 pt-4 border-t border-white/20">
              <p className="px-4 py-2 text-sm font-semibold text-blue-100">Danh mục sản phẩm</p>
              {categories.map((cat) => (
                <Link
                  key={cat.slug}
                  href={`/categories/${cat.slug}`}
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center space-x-3 w-full px-4 py-3 rounded-lg hover:bg-white/10 transition"
                >
                  <span className="text-xl">{cat.icon}</span>
                  <span>{cat.name}</span>
                </Link>
              ))}
            </div>

            {user ? (
              <>
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    router.push('/profile');
                  }}
                  className="flex items-center space-x-3 w-full px-4 py-3 rounded-lg hover:bg-white/10 transition mt-2"
                >
                  <User size={20} />
                  <span>{user.name || 'Người dùng'}</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-3 w-full px-4 py-3 rounded-lg hover:bg-red-500/20 transition text-red-200"
                >
                  <LogOut size={20} />
                  <span>Đăng xuất</span>
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  router.push('/login');
                }}
                className="flex items-center space-x-3 w-full px-4 py-3 rounded-lg hover:bg-white/10 transition mt-2"
              >
                <LogIn size={20} />
                <span>Đăng nhập</span>
              </button>
            )}
          </nav>
        )}
      </div>
    </header>
  );
};
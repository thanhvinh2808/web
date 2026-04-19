"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { 
  User, 
  FileText, 
  Bell, 
  Ticket, 
  Edit,
  MapPin,
  Lock,
  CreditCard,
  ChevronDown,
  ChevronRight,
  LogOut,
  Heart
} from 'lucide-react';
import { useState } from 'react';

interface ProfileSidebarProps {
  isMobile?: boolean;
}

export default function ProfileSidebar({ isMobile = false }: ProfileSidebarProps) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [isAccountOpen, setIsAccountOpen] = useState(true);

  const handleLogout = async () => {
    if (window.confirm('Bạn có chắc chắn muốn đăng xuất?')) {
      await logout();
    }
  };

  const menuItems = [
    {
      id: 'profile',
      label: 'Hồ sơ',
      icon: <User size={isMobile ? 16 : 20} />,
      href: '/profile'
    },
    {
      id: 'orders',
      label: 'Đơn mua',
      icon: <FileText size={isMobile ? 16 : 20} />,
      href: '/profile/orders'
    },
    {
      id: 'address',
      label: 'Địa chỉ',
      icon: <MapPin size={isMobile ? 16 : 20} />,
      href: '/profile/address'
    },
    {
      id: 'wishlist',
      label: 'Yêu thích',
      icon: <Heart size={isMobile ? 16 : 20} />,
      href: '/profile/wishlist'
    },
    {
      id: 'vouchers',
      label: 'Voucher',
      icon: <Ticket size={isMobile ? 16 : 20} />,
      href: '/profile/vouchers'
    },
    {
      id: 'password',
      label: 'Mật khẩu',
      icon: <Lock size={isMobile ? 16 : 20} />,
      href: '/profile/password'
    }
  ];

  if (isMobile) {
    return (
      <div className="flex items-center gap-2">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link 
              key={item.id}
              href={item.href}
              className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-none border-b-2 transition-all ${
                isActive 
                ? 'border-primary text-primary bg-primary/5 font-black uppercase text-[10px] tracking-wider' 
                : 'border-transparent text-gray-500 font-bold uppercase text-[10px] tracking-wider hover:text-black'
              }`}
            >
              {item.icon}
              <span className="whitespace-nowrap">{item.label}</span>
            </Link>
          );
        })}
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* User Info Header */}
      <div className="flex items-center gap-4 py-6 border-b border-gray-200 mb-6">
        <div className="w-14 h-14 bg-gray-200 rounded-none overflow-hidden border border-gray-300">
          {user?.avatar ? (
            <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
              <User size={28} />
            </div>
          )}
        </div>
        <div>
          <h3 className="font-black text-gray-900 truncate max-w-[150px] uppercase tracking-tighter">
            {user?.name || 'Người dùng'}
          </h3>
          <Link href="/profile" className="flex items-center gap-1 text-gray-500 text-xs font-bold hover:text-primary uppercase tracking-wider mt-1">
            <Edit size={12} /> Sửa hồ sơ
          </Link>
        </div>
      </div>

      {/* Menu Desktop */}
      <nav>
        <ul className="space-y-1">
          {/* Grouped Account Item for Desktop */}
          <li>
            <button 
              onClick={() => setIsAccountOpen(!isAccountOpen)}
              className="flex items-center justify-between w-full py-3 px-2 text-gray-800 font-bold hover:text-primary transition group"
            >
              <div className="flex items-center gap-3">
                  <span className="text-gray-400 group-hover:text-primary transition"><User size={20}/></span>
                  <span className="uppercase text-sm tracking-wide">Tài khoản của tôi</span>
              </div>
              {isAccountOpen ? <ChevronDown size={16}/> : <ChevronRight size={16}/>}
            </button>
            
            {isAccountOpen && (
              <ul className="mt-1 ml-10 space-y-1 border-l-2 border-gray-100 pl-4">
                <li><Link href="/profile" className={`block py-2 text-xs font-bold transition ${pathname === '/profile' ? 'text-primary uppercase tracking-wider' : 'text-gray-500 hover:text-black'}`}>Hồ sơ</Link></li>
                <li><Link href="/profile/address" className={`block py-2 text-xs font-bold transition ${pathname === '/profile/address' ? 'text-primary uppercase tracking-wider' : 'text-gray-500 hover:text-black'}`}>Địa chỉ</Link></li>
                <li><Link href="/profile/password" className={`block py-2 text-xs font-bold transition ${pathname === '/profile/password' ? 'text-primary uppercase tracking-wider' : 'text-gray-500 hover:text-black'}`}>Đổi mật khẩu</Link></li>
              </ul>
            )}
          </li>

          <li>
            <Link 
              href="/profile/orders"
              className={`flex items-center gap-3 py-3 px-2 font-bold transition group ${pathname.startsWith('/profile/orders') ? 'text-primary' : 'text-gray-800 hover:text-primary'}`}
            >
              <span className={pathname.startsWith('/profile/orders') ? 'text-primary' : 'text-gray-400 group-hover:text-primary transition'}>
                <FileText size={20} />
              </span>
              <span className="uppercase text-sm tracking-wide">Đơn mua</span>
            </Link>
          </li>

          <li>
            <Link 
              href="/profile/wishlist"
              className={`flex items-center gap-3 py-3 px-2 font-bold transition group ${pathname.startsWith('/profile/wishlist') ? 'text-primary' : 'text-gray-800 hover:text-primary'}`}
            >
              <span className={pathname.startsWith('/profile/wishlist') ? 'text-primary' : 'text-gray-400 group-hover:text-primary transition'}>
                <Heart size={20} />
              </span>
              <span className="uppercase text-sm tracking-wide">Sản phẩm yêu thích</span>
            </Link>
          </li>

          <li>
            <Link 
              href="/profile/vouchers"
              className={`flex items-center gap-3 py-3 px-2 font-bold transition group ${pathname.startsWith('/profile/vouchers') ? 'text-primary' : 'text-gray-800 hover:text-primary'}`}
            >
              <span className={pathname.startsWith('/profile/vouchers') ? 'text-primary' : 'text-gray-400 group-hover:text-primary transition'}>
                <Ticket size={20} />
              </span>
              <span className="uppercase text-sm tracking-wide">Kho Voucher</span>
            </Link>
          </li>

          <li>
            <button 
              onClick={handleLogout}
              className="flex items-center gap-3 w-full py-3 px-2 font-bold text-red-500 hover:bg-red-50 transition group mt-4 border-t border-gray-100 pt-6 text-left"
            >
              <span className="text-red-400 group-hover:text-red-600 transition">
                <LogOut size={20} />
              </span>
              <span className="uppercase text-sm tracking-wide">Đăng xuất</span>
            </button>
          </li>
        </ul>
      </nav>
    </div>
  );
}

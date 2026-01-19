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
  ChevronRight
} from 'lucide-react';
import { useState } from 'react';

export default function ProfileSidebar() {
  const { user } = useAuth();
  const pathname = usePathname();
  const [isAccountOpen, setIsAccountOpen] = useState(true);

  const menuItems = [
    {
      id: 'account',
      label: 'Tài khoản của tôi',
      icon: <User size={20} />,
      hasSubmenu: true,
      href: '/profile',
      subItems: [
        { label: 'Hồ sơ', href: '/profile' },
        { label: 'Ngân hàng', href: '/profile/banks' },
        { label: 'Địa chỉ', href: '/profile/address' },
        { label: 'Đổi mật khẩu', href: '/profile/password' },
      ]
    },
    {
      id: 'orders',
      label: 'Đơn mua',
      icon: <FileText size={20} />,
      href: '/profile/orders'
    },
    {
      id: 'notifications',
      label: 'Thông báo',
      icon: <Bell size={20} />,
      href: '/profile/notifications'
    },
    {
      id: 'vouchers',
      label: 'Kho Voucher',
      icon: <Ticket size={20} />,
      href: '/profile/vouchers'
    }
  ];

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

      {/* Menu */}
      <nav>
        <ul className="space-y-1">
          {menuItems.map((item) => (
            <li key={item.id}>
              {item.hasSubmenu ? (
                <div>
                  <button 
                    onClick={() => setIsAccountOpen(!isAccountOpen)}
                    className="flex items-center justify-between w-full py-3 px-2 text-gray-800 font-bold hover:text-primary transition group"
                  >
                    <div className="flex items-center gap-3">
                       <span className="text-gray-400 group-hover:text-primary transition">{item.icon}</span>
                       <span className="uppercase text-sm tracking-wide">{item.label}</span>
                    </div>
                    {isAccountOpen ? <ChevronDown size={16}/> : <ChevronRight size={16}/>}
                  </button>
                  
                  {isAccountOpen && (
                    <ul className="mt-1 ml-10 space-y-1 border-l-2 border-gray-100 pl-4">
                      {item.subItems?.map((sub) => {
                        const isActive = pathname === sub.href;
                        return (
                          <li key={sub.href}>
                            <Link 
                              href={sub.href}
                              className={`block py-2 text-xs font-bold transition ${isActive ? 'text-primary uppercase tracking-wider' : 'text-gray-500 hover:text-black'}`}
                            >
                              {sub.label}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              ) : (
                <Link 
                  href={item.href}
                  className={`flex items-center gap-3 py-3 px-2 font-bold transition group ${pathname.startsWith(item.href) ? 'text-primary' : 'text-gray-800 hover:text-primary'}`}
                >
                  <span className={pathname.startsWith(item.href) ? 'text-primary' : 'text-gray-400 group-hover:text-primary transition'}>
                    {item.icon}
                  </span>
                  <span className="uppercase text-sm tracking-wide">{item.label}</span>
                </Link>
              )}
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}

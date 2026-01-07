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
  CreditCard
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
      <div className="flex items-center gap-3 py-4 border-b border-gray-200 mb-4">
        <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden border border-gray-300">
          {user?.avatar ? (
            <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
              <User size={24} />
            </div>
          )}
        </div>
        <div>
          <h3 className="font-bold text-gray-800 truncate max-w-[150px]">
            {user?.name || 'Người dùng'}
          </h3>
          <Link href="/profile" className="flex items-center gap-1 text-gray-500 text-sm hover:text-blue-600">
            <Edit size={12} /> Sửa hồ sơ
          </Link>
        </div>
      </div>

      {/* Menu */}
      <nav>
        <ul className="space-y-4">
          {menuItems.map((item) => (
            <li key={item.id}>
              {item.hasSubmenu ? (
                <div>
                  <button 
                    onClick={() => setIsAccountOpen(!isAccountOpen)}
                    className="flex items-center gap-3 text-gray-800 font-medium hover:text-blue-600 transition w-full text-left"
                  >
                    <span className="text-blue-600">{item.icon}</span>
                    {item.label}
                  </button>
                  {isAccountOpen && (
                    <ul className="mt-2 ml-8 space-y-2">
                      {item.subItems?.map((sub) => {
                        const isActive = pathname === sub.href;
                        return (
                          <li key={sub.href}>
                            <Link 
                              href={sub.href}
                              className={`block text-sm ${isActive ? 'text-blue-600 font-medium' : 'text-gray-500 hover:text-blue-600'}`}
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
                  className={`flex items-center gap-3 font-medium transition ${pathname.startsWith(item.href) ? 'text-blue-600' : 'text-gray-800 hover:text-blue-600'}`}
                >
                  <span className={pathname.startsWith(item.href) ? 'text-blue-600' : 'text-gray-500'}>
                    {item.icon}
                  </span>
                  {item.label}
                </Link>
              )}
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
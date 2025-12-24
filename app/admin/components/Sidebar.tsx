// app/admin/components/Sidebar.tsx
'use client';
import React from 'react';
import { User } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
  user?: {
    name: string;
    email: string;
    role: string;
  } | null;
}

export default function Sidebar({ activeTab, setActiveTab, onLogout, user }: SidebarProps) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'users', label: 'Người dùng', icon: '👥' },
    { id: 'orders', label: 'Đơn hàng', icon: '🛒' },
    { id: 'products', label: 'Sản phẩm', icon: '📦' },
    { id: 'categories', label: 'Danh mục', icon: '📁' },
    { id: 'contacts', label: 'Liên hệ', icon: '📧' },
  ];

  return (
    <aside className="w-64 bg-gradient-to-b from-blue-900 to-blue-800 text-white fixed h-screen shadow-xl flex flex-col">
      
      {/* Header */}
      <div className="p-6 border-b border-blue-700">
        <h1 className="text-2xl font-bold text-center">Admin Panel</h1>
      </div>

      {/* User Info Section */}
      {user && (
        <div className="p-4 border-b border-blue-700 bg-blue-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
              <User size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">{user.name}</p>
              <p className="text-xs text-blue-300 truncate">{user.email}</p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Menu */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
              activeTab === item.id
                ? 'bg-blue-600 shadow-lg scale-105'
                : 'hover:bg-blue-700/50'
            }`}
          >
            <span className="text-xl">{item.icon}</span>
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t border-blue-700">
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 rounded-lg transition-all duration-200 font-medium shadow-lg"
        >
          <span>🚪</span>
          <span>Đăng xuất</span>
        </button>
      </div>
    </aside>
  );
}
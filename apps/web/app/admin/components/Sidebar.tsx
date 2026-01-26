// app/admin/components/Sidebar.tsx
'use client';
import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  ShoppingCart, 
  Package, 
  FolderTree, 
  MessageSquare, 
  Ticket,
  LogOut,
  Store,
  X,
  RefreshCw
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
  isOpen: boolean;        // Trạng thái mở menu mobile
  onClose: () => void;    // Hàm đóng menu mobile
}

export default function Sidebar({ activeTab, setActiveTab, onLogout, isOpen, onClose }: SidebarProps) {
  const menuItems = [
    { id: 'dashboard', label: 'Tổng quan', icon: LayoutDashboard },
    { id: 'users', label: 'Người dùng', icon: Users },
    { id: 'orders', label: 'Đơn hàng', icon: ShoppingCart },
    { id: 'products', label: 'Sản phẩm', icon: Package },
    { id: 'categories', label: 'Danh mục', icon: FolderTree },
    { id: 'vouchers', label: 'Khuyến mãi', icon: Ticket },
    { id: 'trade-in', label: 'Thu cũ đổi mới', icon: RefreshCw },
    { id: 'contacts', label: 'Liên hệ', icon: MessageSquare },
  ];

  return (
    <>
      {/* Mobile Overlay (Lớp nền đen mờ khi mở menu) */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm transition-opacity"
          onClick={onClose}
        ></div>
      )}

      {/* Sidebar Container */}
      <aside 
        className={`fixed top-0 left-0 h-screen w-72 bg-white border-r border-gray-100 shadow-xl z-50 transition-transform duration-300 ease-in-out md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        
        {/* Brand Logo & Close Button */}
        <div className="h-20 flex items-center justify-between px-6 border-b border-gray-50">
          <div className="flex flex-col">
            <h1 className="text-2xl font-black italic tracking-tighter text-black leading-none">
              FOOT<span className="text-blue-600">MARK</span>.
            </h1>
            <span className="text-[9px] font-bold tracking-[0.2em] text-gray-500 uppercase">Dashboard</span>
          </div>
          {/* Nút đóng chỉ hiện trên mobile */}
          <button onClick={onClose} className="md:hidden text-gray-400 hover:text-red-500">
            <X size={24} />
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Quản lý</p>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  onClose(); // Tự động đóng menu khi chọn trên mobile
                }}
                className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-xl transition-all duration-200 group font-medium text-sm ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 shadow-sm'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon 
                  size={20} 
                  className={`transition-colors ${isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'}`} 
                  strokeWidth={isActive ? 2.5 : 2}
                />
                {item.label}
                {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600"></div>}
              </button>
            );
          })}
        </nav>

        {/* Footer / Logout */}
        <div className="p-4 border-t border-gray-50">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 text-sm font-medium"
          >
            <LogOut size={20} />
            <span>Đăng xuất hệ thống</span>
          </button>
        </div>
      </aside>
    </>
  );
}
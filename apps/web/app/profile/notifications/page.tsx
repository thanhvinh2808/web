"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Bell, Mail, Package, User, Check, Trash2, Clock, Inbox, Ticket } from 'lucide-react';
import toast from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface Notification {
  _id: string;
  type: 'order' | 'user' | 'contact' | 'system';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationsPage() {
  const { token } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/notifications`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setNotifications(data.data);
        setUnreadCount(data.unreadCount);
      }
    } catch (error) {
      console.error("Lỗi tải thông báo:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [token]);

  const markAsRead = async (id: string) => {
    try {
      const res = await fetch(`${API_URL}/api/notifications/${id}/read`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setNotifications(prev => 
          prev.map(n => n._id === id ? { ...n, isRead: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error("Lỗi cập nhật thông báo:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const res = await fetch(`${API_URL}/api/notifications/read-all`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);
        toast.success("Đã đánh dấu tất cả là đã đọc");
      }
    } catch (error) {
      toast.error("Lỗi hệ thống");
    }
  };

  const getIcon = (type: string, title: string) => {
    if (title.toLowerCase().includes('voucher') || title.toLowerCase().includes('khuyến mãi')) {
        return <Ticket size={20} className="text-orange-600" />;
    }
    switch (type) {
      case 'order': return <Package size={20} className="text-blue-600" />;
      case 'user': return <User size={20} className="text-green-600" />;
      case 'contact': return <Mail size={20} className="text-purple-600" />;
      case 'system': return <Bell size={20} className="text-orange-600" />;
      default: return <Bell size={20} className="text-gray-600" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <div className="animate-fade-in">
      <div className="border-b border-gray-100 pb-4 mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-medium text-gray-800 uppercase tracking-wide">Thông Báo Của Tôi</h1>
          <p className="text-sm text-gray-500 mt-1">Cập nhật tin tức mới nhất về đơn hàng và hỗ trợ</p>
        </div>
        {unreadCount > 0 && (
          <button 
            onClick={markAllAsRead}
            className="text-xs font-bold text-blue-600 hover:text-blue-800 uppercase tracking-widest flex items-center gap-1.5 transition-colors"
          >
            <Check size={14} /> Đánh dấu tất cả đã đọc
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-4">
          <div className="w-10 h-10 border-4 border-gray-200 border-t-black rounded-full animate-spin"></div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Đang tải thông báo...</p>
        </div>
      ) : notifications.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
            <Inbox size={40} className="text-gray-300" />
          </div>
          <h3 className="text-gray-900 font-bold uppercase tracking-wider">Chưa có thông báo nào</h3>
          <p className="text-gray-500 text-sm mt-2">Bạn sẽ nhận được thông báo khi có cập nhật mới</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((noti) => (
            <div 
              key={noti._id}
              onClick={() => !noti.isRead && markAsRead(noti._id)}
              className={`group relative p-5 border transition-all duration-200 cursor-pointer hover:shadow-md ${
                noti.isRead 
                  ? 'bg-white border-gray-100 opacity-80' 
                  : 'bg-blue-50/30 border-blue-100 ring-1 ring-blue-50 shadow-sm'
              }`}
            >
              <div className="flex gap-4">
                <div className={`w-12 h-12 flex-shrink-0 flex items-center justify-center rounded-2xl shadow-sm ${
                  noti.isRead ? 'bg-gray-100 text-gray-400' : 'bg-white text-blue-600'
                }`}>
                  {getIcon(noti.type, noti.title)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-2 mb-1">
                    <h4 className={`text-sm tracking-tight ${noti.isRead ? 'font-bold text-gray-700' : 'font-black text-black'}`}>
                      {noti.title}
                    </h4>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1 whitespace-nowrap">
                      <Clock size={10} /> {formatDate(noti.createdAt)}
                    </span>
                  </div>
                  <p className={`text-sm leading-relaxed line-clamp-2 ${noti.isRead ? 'text-gray-500 font-medium' : 'text-gray-700 font-bold'}`}>
                    {noti.message}
                  </p>
                </div>

                {!noti.isRead && (
                  <div className="absolute top-5 right-5 w-2 h-2 bg-blue-600 rounded-full shadow-sm shadow-blue-500/50"></div>
                )}
              </div>
              
              {/* Mark as read indicator for hover on unread */}
              {!noti.isRead && (
                <div className="absolute bottom-2 right-5 opacity-0 group-hover:opacity-100 transition-opacity">
                   <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest">Nhấn để đánh dấu đã đọc</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      
      <div className="mt-8 p-6 bg-gray-50 border border-dashed border-gray-200 text-center">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em]">
          Thông báo tự động xóa sau 30 ngày
        </p>
      </div>
    </div>
  );
}

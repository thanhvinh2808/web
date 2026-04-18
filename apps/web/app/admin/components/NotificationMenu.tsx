'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Bell, Package, User, Mail, Check, Clock, RefreshCw, Star } from 'lucide-react';
import { useSocket } from '../../contexts/SocketContext';
import { API_URL } from '../config/constants';
import { useRouter } from 'next/navigation';

export default function NotificationMenu() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const { socket } = useSocket();
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    fetchNotifications();

    if (socket) {
      socket.on('newNotification', (newNoti) => {
        setNotifications(prev => [newNoti, ...prev]);
        setUnreadCount(prev => prev + 1);
        
        // Play sound effect
        const audio = new Audio('/notification.mp3'); 
        audio.play().catch(() => {});
      });
    }

    return () => {
      if (socket) socket.off('newNotification');
    };
  }, [socket]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_URL}/api/admin/notifications?limit=10`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setNotifications(data.data);
        setUnreadCount(data.unreadCount);
      }
    } catch (error) {
      console.error('Fetch noti error:', error);
    }
  };

  const handleMarkAsRead = async (noti: any) => {
    try {
      const id = noti._id;
      const token = localStorage.getItem('adminToken');
      await fetch(`${API_URL}/api/admin/notifications/${id}/read`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));

      // ✅ Redirect based on notification type / model
      setIsOpen(false);
      
      const refModel = noti.referenceModel;
      const type = noti.type;

      if (refModel === 'Order' || type === 'order') {
        router.push('/admin?tab=orders');
      } else if (refModel === 'TradeIn') {
        router.push('/admin?tab=trade-in');
      } else if (refModel === 'User' || type === 'user') {
        router.push('/admin?tab=users');
      } else if (refModel === 'Contact' || type === 'contact') {
        router.push('/admin?tab=contacts');
      } else if (refModel === 'Voucher') {
        router.push('/admin?tab=vouchers');
      } else if (refModel === 'Product') {
        router.push('/admin?tab=products');
      } else if (refModel === 'Blog') {
        router.push('/admin?tab=blogs');
      } else if (type === 'review' && noti.referenceId?.slug) {
        // Redirect to Public Product Detail page's review section
        router.push(`/products/${noti.referenceId.slug}#review`);
      }
    } catch (error) {
      console.error('Read error:', error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      await fetch(`${API_URL}/api/admin/notifications/read-all`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Read all error:', error);
    }
  };

  const getIcon = (type: string, refModel?: string) => {
    if (refModel === 'TradeIn') return <RefreshCw size={16} className="text-orange-600" />;
    
    switch (type) {
      case 'order': return <Package size={16} className="text-blue-600" />;
      case 'user': return <User size={16} className="text-green-600" />;
      case 'contact': return <Mail size={16} className="text-purple-600" />;
      case 'review': return <Star size={16} className="text-yellow-500 fill-yellow-500" />;
      default: return <Bell size={16} className="text-gray-600" />;
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-400 hover:text-blue-600 transition-colors bg-white rounded-full hover:bg-gray-50 border border-transparent hover:border-gray-100"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-4 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
            <h3 className="font-black text-sm uppercase tracking-wider text-gray-800">Thông báo mới</h3>
            {unreadCount > 0 && (
              <button onClick={handleMarkAllRead} className="text-[10px] font-bold text-blue-600 hover:text-blue-700 uppercase tracking-widest">
                Đọc tất cả
              </button>
            )}
          </div>
          
          <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-xs font-bold uppercase tracking-widest">
                Không có thông báo
              </div>
            ) : (
              notifications.map((noti) => (
                <div 
                  key={noti._id}
                  onClick={() => handleMarkAsRead(noti)}
                  className={`p-4 border-b border-gray-50 hover:bg-gray-50 transition cursor-pointer flex gap-3 ${!noti.isRead ? 'bg-blue-50/30' : ''}`}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${!noti.isRead ? 'bg-white shadow-sm border border-blue-100' : 'bg-gray-100'}`}>
                    {getIcon(noti.type, noti.referenceModel)}
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-tighter mb-0.5">{noti.title}</p>
                    <p className={`text-[11px] leading-relaxed ${!noti.isRead ? 'font-bold text-gray-900' : 'font-medium text-gray-500'}`}>
                      {noti.message}
                    </p>
                    <p className="text-[9px] text-gray-400 font-bold mt-1.5 uppercase tracking-widest flex items-center gap-1">
                      <Clock size={10} /> {new Date(noti.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} • {new Date(noti.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  {!noti.isRead && (
                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                  )}
                </div>
              ))
            )}
          </div>
          
          <div className="p-3 bg-gray-50 text-center border-t border-gray-100">
            <button className="text-[10px] font-black text-gray-500 hover:text-black uppercase tracking-widest">
              Xem tất cả
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

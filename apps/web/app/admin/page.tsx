// app/admin/page.tsx
'use client';
import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Bell, Search, User, Menu, Package, ShoppingCart, Users } from 'lucide-react'; // Import icons
import { CLEAN_API_URL } from '@lib/shared/constants';
const API_URL = CLEAN_API_URL;

import { useSocket } from '../contexts/SocketContext';
import LoginForm from './components/LoginForm';
import Sidebar from './components/Sidebar';
import DashboardTab from './components/DashboardTab';
import UsersTab from './components/UsersTab';
import OrdersTab from './components/OrdersTab';
import ProductsTab from './components/ProductsTab';
import CategoriesTab from './components/CategoriesTab';
import ContactsTab from './components/ContactsTab';
import VouchersTab from './components/VouchersTab';
import TradeInTab from './components/TradeInTab';
import BlogsTab from './components/BlogsTab';
import NotificationMenu from './components/NotificationMenu';

function AdminDashboardContent() {
  const { socket, isConnected } = useSocket();
  const searchParams = useSearchParams();
  const [token, setToken] = useState('');
  
  // ✅ ĐỒNG BỘ TAB VỚI URL
  const [activeTab, setActiveTab] = useState('dashboard');

  // Khởi tạo tab từ URL
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    if (tabFromUrl) {
      setActiveTab(tabFromUrl);
    }
  }, []);

  // Cập nhật URL khi đổi Tab
  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab);
    const url = new URL(window.location.href);
    url.searchParams.set('tab', newTab);
    window.history.replaceState({}, '', url.toString());
  };

  const [stats, setStats] = useState<any>(null);
  const [dashboardRefresh, setDashboardRefresh] = useState(0); 
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [message, setMessage] = useState('');
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [currentUser, setCurrentUser] = useState<{
    name: string;
    email: string;
    role: string;
  } | null>(null);

  // ✅ SOCKET LISTENERS
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleNewOrder = (order: any) => {
      console.log('🔔 New order received via socket:', order);
      showMessage(`🆕 Có đơn hàng mới #${order._id.slice(-6).toUpperCase()}`);
      
      // Refresh data
      fetchStats(token);
      setDashboardRefresh(prev => prev + 1);
      if (activeTab === 'orders') fetchOrders();
    };

    const handleStatusUpdate = (data: any) => {
      console.log('📝 Order status updated via socket:', data);
      fetchStats(token);
      setDashboardRefresh(prev => prev + 1);
      if (activeTab === 'orders') fetchOrders();
    };

    socket.on('newOrder', handleNewOrder);
    socket.on('orderStatusUpdated', handleStatusUpdate);
    socket.on('orderCancelled', handleNewOrder);

    return () => {
      socket.off('newOrder', handleNewOrder);
      socket.off('orderStatusUpdated', handleStatusUpdate);
      socket.off('orderCancelled', handleNewOrder);
    };
  }, [socket, isConnected, token, activeTab]);
  
  // ✅ STATE CHO MOBILE MENU
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // 🔍 GLOBAL SEARCH STATE
  const [globalSearch, setGlobalSearch] = useState('');
  const [searchResults, setSearchResults] = useState<{ products: any[], users: any[], orders: any[] } | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const showMessage = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 3000);
  };

  useEffect(() => {
    document.body.classList.add('admin-mode');
    return () => {
      document.body.classList.remove('admin-mode');
    };
  }, []);

  // 🔍 DEBOUNCE GLOBAL SEARCH
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!globalSearch.trim()) {
        setSearchResults(null);
        return;
      }

      setIsSearching(true);
      try {
        const res = await fetch(`${API_URL}/api/admin/search?q=${globalSearch}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          setSearchResults(data.data);
          setShowResults(true);
        }
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [globalSearch, token]);

  // Click outside to close search
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Check Auth Logic
  useEffect(() => {
    const checkAuth = async () => {
      const savedToken = localStorage.getItem('token') || localStorage.getItem('adminToken');
      
      if (!savedToken) {
        setIsCheckingAuth(false);
        return;
      }
      try {
        const res = await fetch(`${API_URL}/api/admin/verify`, {
          headers: { 'Authorization': `Bearer ${savedToken}`, 'Content-Type': 'application/json' }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setToken(savedToken);
            localStorage.setItem('adminToken', savedToken);
            
            if (data.user) {
              const userData = {
                name: data.user.name || 'Admin',
                email: data.user.email || '',
                role: data.user.role || 'admin'
              };
              setCurrentUser(userData);
              localStorage.setItem('user', JSON.stringify(userData));
            }
            fetchStats(savedToken);
          } else {
            setToken('');
          }
        } else if (res.status === 401 || res.status === 403) {
          handleTokenExpired();
        }
      } catch (error) {
        console.error('Error verifying token:', error);
      } finally {
        setIsCheckingAuth(false);
      }
    };
    checkAuth();
  }, []);

  const handleTokenExpired = () => {
    setToken('');
    localStorage.removeItem('adminToken');
    showMessage('⏰ Phiên đăng nhập đã hết hạn.');
  };

  const fetchStats = async (authToken: string) => {
    try {
      const res = await fetch(`${API_URL}/api/admin/stats`, { headers: { 'Authorization': `Bearer ${authToken}` } });
      const data = await res.json();
      if (data.success) setStats(data.data);
    } catch (e) {}
  };
  const fetchUsers = async () => { 
      const res = await fetch(`${API_URL}/api/admin/users`, { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      if(data.success) {
        setUsers(data.data);
        setDashboardRefresh(prev => prev + 1);
      }
  };
  const fetchOrders = async () => { 
      const res = await fetch(`${API_URL}/api/admin/orders?limit=100`, { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      if(data.success) {
        setOrders(data.data);
        setDashboardRefresh(prev => prev + 1);
      }
  };
  const fetchProducts = async () => { 
      const res = await fetch(`${API_URL}/api/admin/products?limit=all&sort=newest&t=${Date.now()}`, { 
          headers: { 'Authorization': `Bearer ${token}` } 
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setProducts(data.data);
        setDashboardRefresh(prev => prev + 1);
      }
  };
  const fetchCategories = async () => { 
      const res = await fetch(`${API_URL}/api/categories`);
      const data = await res.json();
      if (Array.isArray(data)) setCategories(data as any);
  };
  const fetchContacts = async () => {
      const res = await fetch(`${API_URL}/api/admin/contacts`, { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      if(data.success) setContacts(data.data);
  };

  const handleLogin = async (email: string, password: string) => {
    try {
      const res = await fetch(`${API_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (data.success && data.token) {
        if (data.user.role !== 'admin') {
           showMessage('❌ Bạn không có quyền truy cập trang quản trị');
           return;
        }

        setToken(data.token);
        setCurrentUser({ name: data.user.name, email: data.user.email, role: data.user.role });
        localStorage.setItem('adminToken', data.token);
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        fetchStats(data.token);
      } else {
        showMessage('❌ ' + (data.message || 'Đăng nhập thất bại'));
      }
    } catch (e) { showMessage('❌ Lỗi kết nối server'); }
  };

  const handleLogout = () => {
    setToken('');
    setCurrentUser(null);
    localStorage.removeItem('adminToken');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  useEffect(() => {
    if (token) {
      if (activeTab === 'users') fetchUsers();
      if (activeTab === 'orders') fetchOrders();
      if (activeTab === 'products') { fetchProducts(); fetchCategories(); }
      if (activeTab === 'categories') fetchCategories();
      if (activeTab === 'contacts') fetchContacts();
    }
  }, [activeTab, token]);

  if (isCheckingAuth) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600"></div></div>;
  if (!token) return <LoginForm onLogin={handleLogin} message={message} />;

  const getTitle = () => {
    switch(activeTab) {
      case 'dashboard': return 'Tổng Quan';
      case 'users': return 'Người Dùng';
      case 'orders': return 'Đơn Hàng';
      case 'products': return 'Sản Phẩm';
      case 'categories': return 'Danh Mục';
      case 'vouchers': return 'Mã Giảm Giá';
      case 'blogs': return 'Tin Tức';
      case 'trade-in': return 'Thu Cũ Đổi Mới';
      case 'contacts': return 'Liên Hệ';
      default: return 'Dashboard';
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      {/* Sidebar Responsive */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={handleTabChange} 
        onLogout={handleLogout}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <main className="flex-1 flex flex-col min-w-0 md:ml-72 transition-all duration-300">
        <header className="h-16 md:h-20 bg-white border-b border-gray-100 flex items-center justify-between px-4 md:px-8 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-lg">
              <Menu size={24} />
            </button>
            <div>
              <h1 className="text-lg md:text-2xl font-bold text-gray-800">{getTitle()}</h1>
              <p className="hidden md:block text-sm text-gray-500 mt-0.5">Xin chào, {currentUser?.name}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 md:gap-6">
            <div className="relative hidden md:block z-50" ref={searchRef}>
              <input 
                type="text" 
                placeholder="Tìm mọi thứ (SP, Đơn, User)..." 
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                onFocus={() => setShowResults(true)}
                className="pl-10 pr-4 py-2 bg-gray-50 border-none rounded-full text-sm focus:ring-2 focus:ring-black w-72 transition-all font-medium"
              />
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              
              {showResults && searchResults && (globalSearch.trim().length > 0) && (
                <div className="absolute top-full mt-2 left-0 w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
                  {isSearching ? (
                    <div className="p-4 text-center text-gray-400 text-xs font-bold uppercase tracking-widest">Đang tìm kiếm...</div>
                  ) : (
                    <>
                      {searchResults.products.length > 0 && (
                        <div className="p-2">
                           <div className="px-2 py-1 text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1 flex items-center gap-2"><Package size={12}/> Sản Phẩm</div>
                           {searchResults.products.map(p => (
                             <div key={p._id} onClick={() => { handleTabChange('products'); setShowResults(false); }} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer transition">
                               <img src={p.image || '/placeholder.png'} className="w-8 h-8 rounded border object-cover" />
                               <div>
                                 <div className="text-sm font-bold text-gray-800 line-clamp-1">{p.name}</div>
                                 <div className="text-xs text-gray-500">{parseInt(p.price).toLocaleString()}₫</div>
                               </div>
                             </div>
                           ))}
                        </div>
                      )}
                      {searchResults.orders.length > 0 && (
                        <div className="p-2 border-t border-gray-50">
                           <div className="px-2 py-1 text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1 flex items-center gap-2"><ShoppingCart size={12}/> Đơn Hàng</div>
                           {searchResults.orders.map(o => (
                             <div key={o._id} onClick={() => { handleTabChange('orders'); setShowResults(false); }} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer transition">
                               <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded flex items-center justify-center font-bold text-[10px]">#{o._id.slice(-4).toUpperCase()}</div>
                               <div>
                                 <div className="text-sm font-bold text-gray-800">{o.customerInfo?.fullName || 'Khách vãng lai'}</div>
                                 <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{parseInt(o.totalAmount).toLocaleString()}₫</div>
                               </div>
                             </div>
                           ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
            <NotificationMenu />
            <div className="flex items-center gap-3 pl-3 md:pl-6 border-l border-gray-100">
              <div className="text-right hidden md:block">
                <div className="text-sm font-bold text-gray-700">{currentUser?.name}</div>
                <div className="text-xs text-blue-600 font-medium bg-blue-50 px-2 py-0.5 rounded-full inline-block">Admin</div>
              </div>
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-tr from-blue-600 to-blue-400 flex items-center justify-center text-white shadow-md ring-2 ring-white"><User size={18} /></div>
            </div>
          </div>
        </header>

        <div className="p-4 md:p-8 flex-1 overflow-x-hidden">
          {message && (
            <div className={`mb-6 p-4 rounded-xl shadow-sm border flex items-center gap-3 ${message.includes('thành công') || message.includes('✅') ? 'bg-green-50 border-green-100 text-green-700' : 'bg-red-50 border-red-100 text-red-700'}`}>
              {message}
            </div>
          )}
          <div className="animate-fade-in-up">
            {activeTab === 'dashboard' && stats && <DashboardTab stats={stats} setActiveTab={handleTabChange} refreshTrigger={dashboardRefresh} />}
            {activeTab === 'users' && <UsersTab users={users} token={token} onRefresh={fetchUsers} showMessage={showMessage} />}
            {activeTab === 'orders' && <OrdersTab orders={orders} token={token} onRefresh={fetchOrders} showMessage={showMessage} />}
            {activeTab === 'products' && <ProductsTab products={products} categories={categories} token={token} onRefresh={fetchProducts} showMessage={showMessage} />}
            {activeTab === 'categories' && <CategoriesTab categories={categories} token={token} onRefresh={fetchCategories} showMessage={showMessage} />}
            {activeTab === 'vouchers' && <VouchersTab token={token} showMessage={showMessage} />}
            {activeTab === 'blogs' && <BlogsTab token={token} showMessage={showMessage} />}
            {activeTab === 'trade-in' && <TradeInTab token={token} showMessage={showMessage} />}
            {activeTab === 'contacts' && <ContactsTab contacts={contacts} token={token} onRefresh={fetchContacts} showMessage={showMessage} />}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function AdminDashboard() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600"></div></div>}>
      <AdminDashboardContent />
    </Suspense>
  );
}

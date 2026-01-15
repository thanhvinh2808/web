// app/admin/page.tsx
'use client';
import React, { useState, useEffect } from 'react';
import { Bell, Search, User, Menu } from 'lucide-react'; // Import Menu icon
import { API_URL } from './config/constants';
import LoginForm from './components/LoginForm';
import Sidebar from './components/Sidebar';
import DashboardTab from './components/DashboardTab';
import UsersTab from './components/UsersTab';
import OrdersTab from './components/OrdersTab';
import ProductsTab from './components/ProductsTab';
import CategoriesTab from './components/CategoriesTab';
import ContactsTab from './components/ContactsTab';
import VouchersTab from './components/VouchersTab';

export default function AdminDashboard() {
  const [token, setToken] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState(null);
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
  
  // ✅ STATE CHO MOBILE MENU
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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

  // Check Auth Logic (Giữ nguyên)
  useEffect(() => {
    const checkAuth = async () => {
      const savedToken = localStorage.getItem('adminToken');
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
            if (data.user) {
              setCurrentUser({
                name: data.user.name || 'Admin',
                email: data.user.email || '',
                role: data.user.role || 'admin'
              });
            }
            fetchStats(savedToken);
          } else {
            localStorage.removeItem('adminToken');
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

  // Fetch functions (Giữ nguyên)
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
      if(data.success) setUsers(data.data);
  };
  const fetchOrders = async () => { 
      const res = await fetch(`${API_URL}/api/admin/orders?limit=100`, { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      if(data.success) setOrders(data.data);
  };
  const fetchProducts = async () => { 
      const res = await fetch(`${API_URL}/api/admin/products`, { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      if (Array.isArray(data.data)) setProducts(data.data);
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
        setToken(data.token);
        if (data.user) setCurrentUser({ name: data.user.name, email: data.user.email, role: data.user.role });
        localStorage.setItem('adminToken', data.token);
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
      case 'contacts': return 'Liên Hệ';
      default: return 'Dashboard';
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      {/* Sidebar Responsive */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onLogout={handleLogout}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Content Area - Điều chỉnh margin left trên desktop */}
      <main className="flex-1 flex flex-col min-w-0 md:ml-72 transition-all duration-300">
        
        {/* Top Header */}
        <header className="h-16 md:h-20 bg-white border-b border-gray-100 flex items-center justify-between px-4 md:px-8 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            {/* Nút Hamburger cho Mobile */}
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
            >
              <Menu size={24} />
            </button>

            <div>
              <h1 className="text-lg md:text-2xl font-bold text-gray-800">{getTitle()}</h1>
              <p className="hidden md:block text-sm text-gray-500 mt-0.5">Xin chào, {currentUser?.name}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 md:gap-6">
            <div className="relative hidden md:block">
              <input 
                type="text" 
                placeholder="Tìm kiếm..." 
                className="pl-10 pr-4 py-2 bg-gray-50 border-none rounded-full text-sm focus:ring-2 focus:ring-blue-100 w-64 transition-all"
              />
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            </div>
            
            <button className="relative p-2 text-gray-400 hover:text-blue-600 transition-colors">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
            </button>

            <div className="flex items-center gap-3 pl-3 md:pl-6 border-l border-gray-100">
              <div className="text-right hidden md:block">
                <div className="text-sm font-bold text-gray-700">{currentUser?.name}</div>
                <div className="text-xs text-blue-600 font-medium bg-blue-50 px-2 py-0.5 rounded-full inline-block">Admin</div>
              </div>
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-tr from-blue-600 to-blue-400 flex items-center justify-center text-white shadow-md ring-2 ring-white">
                <User size={18} />
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Content */}
        <div className="p-4 md:p-8 flex-1 overflow-x-hidden">
          {message && (
            <div className={`mb-6 p-4 rounded-xl shadow-sm border flex items-center gap-3 ${
              message.includes('thành công') || message.includes('✅') 
                ? 'bg-green-50 border-green-100 text-green-700' 
                : 'bg-red-50 border-red-100 text-red-700'
            }`}>
              {message}
            </div>
          )}

          <div className="animate-fade-in-up">
            {activeTab === 'dashboard' && stats && <DashboardTab stats={stats} />}
            {activeTab === 'users' && <UsersTab users={users} token={token} onRefresh={fetchUsers} showMessage={showMessage} />}
            {activeTab === 'orders' && <OrdersTab orders={orders} token={token} onRefresh={fetchOrders} showMessage={showMessage} />}
            {activeTab === 'products' && <ProductsTab products={products} categories={categories} token={token} onRefresh={fetchProducts} showMessage={showMessage} />}
            {activeTab === 'categories' && <CategoriesTab categories={categories} token={token} onRefresh={fetchCategories} showMessage={showMessage} />}
            {activeTab === 'vouchers' && <VouchersTab token={token} showMessage={showMessage} />}
            {activeTab === 'contacts' && <ContactsTab contacts={contacts} token={token} onRefresh={fetchContacts} showMessage={showMessage} />}
          </div>
        </div>
      </main>
    </div>
  );
}
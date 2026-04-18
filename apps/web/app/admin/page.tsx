// app/admin/page.tsx
'use client';
import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Bell, Search, User, Menu, Package, ShoppingCart, Users } from 'lucide-react';
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
import BrandsTab from './components/BrandsTab';
import ContactsTab from './components/ContactsTab';
import VouchersTab from './components/VouchersTab';
import TradeInTab from './components/TradeInTab';
import BlogsTab from './components/BlogsTab';
import NotificationMenu from './components/NotificationMenu';

function AdminDashboardContent() {
  const { socket, isConnected } = useSocket();
  const searchParams = useSearchParams();
  const [token, setToken] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    if (tabFromUrl) setActiveTab(tabFromUrl);
  }, [searchParams]);

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
  const [currentUser, setCurrentUser] = useState<{name: string; email: string; role: string;} | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');
  const [searchResults, setSearchResults] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const showMessage = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 3000);
  };

  useEffect(() => {
    const checkAuth = async () => {
      const savedToken = localStorage.getItem('adminToken') || localStorage.getItem('token');
      if (!savedToken) { setIsCheckingAuth(false); return; }
      try {
        const res = await fetch(`${API_URL}/api/admin/verify`, { headers: { 'Authorization': `Bearer ${savedToken}` } });
        if (res.ok) {
          const data = await res.json();
          setToken(savedToken);
          setCurrentUser(data.user);
          fetchStats(savedToken);
        }
      } catch (e) { console.error(e); } finally { setIsCheckingAuth(false); }
    };
    checkAuth();
  }, []);

  const fetchStats = async (t: string) => {
    try {
      const res = await fetch(`${API_URL}/api/admin/stats`, { headers: { 'Authorization': `Bearer ${t}` } });
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
    const res = await fetch(`${API_URL}/api/admin/orders`, { headers: { 'Authorization': `Bearer ${token}` } });
    const data = await res.json();
    if(data.success) setOrders(data.data);
  };

  const fetchProducts = async () => { 
    try {
      const res = await fetch(`${API_URL}/api/admin/products?limit=all&sort=newest&t=${Date.now()}`, { 
          headers: { 'Authorization': `Bearer ${token}` } 
      });
      const data = await res.json();
      if (data.success && data.data) {
        setProducts(data.data);
      } else if (Array.isArray(data)) {
        setProducts(data as any);
      }
    } catch (e) {
      console.error("Error fetching products:", e);
    }
  };

  const fetchCategories = async () => { 
    const res = await fetch(`${API_URL}/api/categories`);
    const data = await res.json();
    if(Array.isArray(data)) setCategories(data as any);
  };

  useEffect(() => {
    if (token) {
      if (activeTab === 'users') fetchUsers();
      if (activeTab === 'orders') fetchOrders();
      if (activeTab === 'products') { fetchProducts(); fetchCategories(); }
      if (activeTab === 'categories') fetchCategories();
    }
  }, [activeTab, token]);

  const handleLogin = async (email: string, password: string) => {
    try {
      const res = await fetch(`${API_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (data.success && data.user.role === 'admin') {
        setToken(data.token);
        setCurrentUser(data.user);
        localStorage.setItem('adminToken', data.token);
        fetchStats(data.token);
      } else {
        showMessage('❌ Đăng nhập thất bại');
      }
    } catch (e) { showMessage('❌ Lỗi kết nối'); }
  };

  if (isCheckingAuth) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600"></div></div>;
  if (!token) return <LoginForm onLogin={handleLogin} message={message} />;

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      <Sidebar activeTab={activeTab} setActiveTab={handleTabChange} onLogout={() => { localStorage.clear(); window.location.href='/login'; }} isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <main className="flex-1 flex flex-col min-w-0 md:ml-72">
        <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-8 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2"><Menu /></button>
            <h1 className="text-2xl font-bold text-gray-800 uppercase tracking-tight italic">{activeTab}</h1>
          </div>
          <div className="flex items-center gap-6">
            <NotificationMenu />
            <div className="flex items-center gap-3 pl-6 border-l border-gray-100">
               <div className="text-right hidden md:block">
                  <div className="text-sm font-bold text-gray-700">{currentUser?.name}</div>
                  <div className="text-[10px] font-black uppercase text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">Admin</div>
               </div>
               <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center font-black">A</div>
            </div>
          </div>
        </header>
        <div className="p-8 flex-1">
          {message && <div className="mb-6 p-4 bg-blue-50 text-blue-700 rounded-xl border border-blue-100 font-bold">{message}</div>}
          {activeTab === 'dashboard' && stats && <DashboardTab stats={stats} setActiveTab={handleTabChange} refreshTrigger={dashboardRefresh} />}
          {activeTab === 'users' && <UsersTab users={users} token={token} onRefresh={fetchUsers} showMessage={showMessage} />}
          {activeTab === 'orders' && <OrdersTab orders={orders} token={token} onRefresh={fetchOrders} showMessage={showMessage} />}
          {activeTab === 'products' && <ProductsTab products={products} categories={categories} token={token} onRefresh={fetchProducts} showMessage={showMessage} />}
          {activeTab === 'categories' && <CategoriesTab categories={categories} token={token} onRefresh={fetchCategories} showMessage={showMessage} />}
          {activeTab === 'brands' && <BrandsTab token={token} apiUrl={API_URL} />}
          {activeTab === 'vouchers' && <VouchersTab token={token} showMessage={showMessage} />}
          {activeTab === 'blogs' && <BlogsTab token={token} showMessage={showMessage} />}
          {activeTab === 'trade-in' && <TradeInTab token={token} showMessage={showMessage} />}
          {activeTab === 'contacts' && <ContactsTab contacts={contacts} token={token} onRefresh={()=>{}} showMessage={showMessage} />}
        </div>
      </main>
    </div>
  );
}

export default function AdminDashboard() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600"></div></div>}>
      <AdminDashboardContent />
    </Suspense>
  );
}

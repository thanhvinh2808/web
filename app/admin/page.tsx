// app/admin/page.tsx
'use client';
import React, { useState, useEffect } from 'react';
import { API_URL } from './config/constants';
import LoginForm from './components/LoginForm';
import Sidebar from './components/Sidebar';
import DashboardTab from './components/DashboardTab';
import UsersTab from './components/UsersTab';
import OrdersTab from './components/OrdersTab';
import ProductsTab from './components/ProductsTab';
import CategoriesTab from './components/CategoriesTab';
import ContactsTab from './components/ContactsTab';

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
  const [isCheckingAuth, setIsCheckingAuth] = useState(true); // ✅ Loading state
 // ✅ THÊM state user
  const [currentUser, setCurrentUser] = useState<{
    name: string;
    email: string;
    role: string;
  } | null>(null);
  const showMessage = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 3000);
  };

   // ✅ THÊM useEffect này NGAY SAU các useState
  useEffect(() => {
    // Ẩn header và footer
    document.body.classList.add('admin-mode');
    
    return () => {
      // Bỏ class khi rời trang
      document.body.classList.remove('admin-mode');
    };
  }, []);

  // ✅ Kiểm tra và verify token khi load trang
  useEffect(() => {
  const checkAuth = async () => {
    const savedToken = localStorage.getItem('adminToken');
    
    if (!savedToken) {
      console.log('⚠️ No token found in localStorage');
      setIsCheckingAuth(false);
      return;
    }

    console.log('🔄 Found token, verifying...');
    
    try {
      const res = await fetch(`${API_URL}/admin/verify`, {
        headers: { 
          'Authorization': `Bearer ${savedToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          console.log('✅ Token is valid, restoring session');
          setToken(savedToken);
          
          // ✅ LƯU THÔNG TIN USER
          if (data.user) {
            setCurrentUser({
              name: data.user.name || 'Admin',
              email: data.user.email || '',
              role: data.user.role || 'admin'
            });
          }
          
          fetchStats(savedToken);
        } else {
          console.log('❌ Token invalid, clearing...');
          localStorage.removeItem('adminToken');
        }
      } else if (res.status === 401 || res.status === 403) {
        console.log('❌ Token expired, clearing...');
        localStorage.removeItem('adminToken');
        showMessage('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      }
    } catch (error) {
      console.error('❌ Error verifying token:', error);
      setToken(savedToken);
    } finally {
      setIsCheckingAuth(false);
    }
  };

  checkAuth();
}, []);

  const fetchStats = async (authToken: string) => {
    try {
      const res = await fetch(`${API_URL}/admin/stats`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      
      if (res.status === 401 || res.status === 403) {
        handleTokenExpired();
        return;
      }
      
      const data = await res.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${API_URL}/admin/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.status === 401 || res.status === 403) {
        handleTokenExpired();
        return;
      }
      
      const data = await res.json();
      if (data.success) {
        setUsers(data.data);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await fetch(`${API_URL}/admin/orders?limit=100`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.status === 401 || res.status === 403) {
        handleTokenExpired();
        return;
      }
      
      const data = await res.json();
      if (data.success) {
        setOrders(data.data);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch(`${API_URL}/admin/products`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (res.status === 401 || res.status === 403) {
        handleTokenExpired();
        return;
      }
      
      if (!res.ok) {
        setProducts([]);
        return;
      }
      
      const data = await res.json();
      
      let productsArray = [];
      if (Array.isArray(data)) {
        productsArray = data;
      } else if (data && Array.isArray(data.data)) {
        productsArray = data.data;
      } else if (data && data.success && Array.isArray(data.data)) {
        productsArray = data.data;
      } else if (data && Array.isArray(data.products)) {
        productsArray = data.products;
      }
      
      setProducts(productsArray);
    } catch (error) {
      console.error('❌ Error in fetchProducts:', error);
      setProducts([]);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${API_URL}/categories`);
      
      if (!res.ok) {
        setCategories([]);
        return;
      }
      
      const data = await res.json();
      
      let categoriesArray = [];
      if (Array.isArray(data)) {
        categoriesArray = data;
      } else if (data && Array.isArray(data.data)) {
        categoriesArray = data.data;
      } else if (data && data.success && Array.isArray(data.data)) {
        categoriesArray = data.data;
      } else if (data && Array.isArray(data.categories)) {
        categoriesArray = data.categories;
      }
      
      setCategories(categoriesArray);
    } catch (error) {
      console.error('❌ Error in fetchCategories:', error);
      setCategories([]);
    }
  };

  const fetchContacts = async () => {
    try {
      const res = await fetch(`${API_URL}/admin/contacts`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (res.status === 401 || res.status === 403) {
        handleTokenExpired();
        return;
      }
      
      if (!res.ok) {
        setContacts([]);
        return;
      }
      
      const data = await res.json();
      
      let contactsArray = [];
      if (Array.isArray(data)) {
        contactsArray = data;
      } else if (data && Array.isArray(data.data)) {
        contactsArray = data.data;
      } else if (data && data.success && Array.isArray(data.data)) {
        contactsArray = data.data;
      } else if (data && Array.isArray(data.contacts)) {
        contactsArray = data.contacts;
      }
      
      setContacts(contactsArray);
    } catch (error) {
      console.error('❌ Error in fetchContacts:', error);
      setContacts([]);
    }
  };

  // ✅ Xử lý khi token hết hạn
  const handleTokenExpired = () => {
    console.log('⏰ Token expired, logging out...');
    setToken('');
    localStorage.removeItem('adminToken');
    showMessage('⏰ Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
  };

 const handleLogin = async (email: string, password: string) => {
  showMessage('');
  try {
    console.group('🔐 LOGIN DEBUG');
    console.log('1. API URL:', `${API_URL}/login`);
    console.log('2. Email:', email);
    
    const res = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    console.log('3. Response status:', res.status);
    
    const data = await res.json();
    console.log('4. Response data:', data);
    
    if (data.success && data.token) {
      console.log('6. Saving token to state...');
      setToken(data.token);
      
      // ✅ LƯU THÔNG TIN USER
      if (data.user) {
        setCurrentUser({
          name: data.user.name || 'Admin',
          email: data.user.email || email,
          role: data.user.role || 'admin'
        });
      }
      
      localStorage.setItem('adminToken', data.token);
      
      console.groupEnd();
      showMessage('✅ Đăng nhập thành công!');
      fetchStats(data.token);
    } else {
      console.log('❌ Login failed:', data.message);
      console.groupEnd();
      showMessage('❌ ' + (data.message || 'Đăng nhập thất bại'));
    }
  } catch (error) {
    console.error('❌ Login error:', error);
    console.groupEnd();
    showMessage('❌ Lỗi kết nối server');
  }
};

  const handleLogout = () => {
    setToken('');
     setCurrentUser(null);
    localStorage.removeItem('adminToken');
    showMessage('👋 Đã đăng xuất thành công!');
  };

  useEffect(() => {
    if (token) {
      if (activeTab === 'users') {
        fetchUsers();
      }
      if (activeTab === 'orders') {
        fetchOrders();
      }
      if (activeTab === 'products') {
        fetchProducts();
        fetchCategories();
      }
      if (activeTab === 'categories') {
        fetchCategories();
      }
      if (activeTab === 'contacts') {
        fetchContacts();
      }
    }
  }, [activeTab, token]);

  // ✅ Hiển thị loading khi đang check auth
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Đang kiểm tra phiên đăng nhập...</p>
        </div>
      </div>
    );
  }

  if (!token) {
    return <LoginForm onLogin={handleLogin} message={message} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onLogout={handleLogout}
        user={currentUser}
      />

      <main className="ml-64 flex-1 p-8">
        {message && (
          <div className={`mb-4 p-4 rounded-lg ${
            message.includes('thành công') || message.includes('✅') 
              ? 'bg-green-100 text-green-700' 
              : message.includes('hết hạn') || message.includes('⏰')
              ? 'bg-yellow-100 text-yellow-700'
              : 'bg-blue-100 text-blue-700'
          }`}>
            {message}
          </div>
        )}

        {activeTab === 'dashboard' && stats && (
          <DashboardTab stats={stats} />
        )}

        {activeTab === 'users' && (
          <UsersTab 
            users={users} 
            token={token} 
            onRefresh={fetchUsers} 
            showMessage={showMessage} 
          />
        )}

        {activeTab === 'orders' && (
          <OrdersTab 
            orders={orders} 
            token={token} 
            onRefresh={fetchOrders} 
            showMessage={showMessage} 
          />
        )}

        {activeTab === 'products' && (
          <ProductsTab 
            products={products} 
            categories={categories}
            token={token} 
            onRefresh={fetchProducts} 
            showMessage={showMessage} 
          />
        )}

        {activeTab === 'categories' && (
          <CategoriesTab 
            categories={categories} 
            token={token} 
            onRefresh={fetchCategories} 
            showMessage={showMessage} 
          />
        )}

        {activeTab === 'contacts' && (
          <ContactsTab 
            contacts={contacts} 
            token={token} 
            onRefresh={fetchContacts} 
            showMessage={showMessage} 
          />
        )}
      </main>
    </div>
  );
}
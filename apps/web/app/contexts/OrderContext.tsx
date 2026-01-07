// app/contexts/OrderContext.tsx
"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useAuth } from './AuthContext';

// --- TYPES ---
export interface OrderItem {
  productId: string;
  productName: string;
  productImage: string;
  productBrand: string;
  price: number;
  quantity: number;
}

export interface Order {
  userId: any;
  id?: string;
  _id?: string;
  orderNumber: string;
  items: OrderItem[];
  customerInfo: {
    fullName: string;
    phone: string;
    email: string;
    address: string;
    city?: string;
    district?: string;
    ward?: string;
    notes?: string;
  };
  paymentMethod: 'cod' | 'banking' | 'momo' | 'card';
  totalAmount: number;
  shippingFee?: number;
  discountAmount?: number;
  voucherCode?: string | null;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  isPaid?: boolean;
  paymentStatus?: 'paid' | 'unpaid';
  createdAt: string;
  paidAt?: string;
  notes?: string;
  cancelledAt?: string | null;
  cancelledBy?: 'user' | 'admin' | 'system' | null;
  cancelReason?: string | null;
  updatedAt: string;
}

interface OrderContextType {
  orders: Order[];
  isLoading: boolean;
  addOrder: (order: Omit<Order, 'id' | 'orderNumber' | 'createdAt'>) => Order;
  refreshOrders: () => Promise<void>;
  updateOrderStatus: (orderId: string, status: Order['status']) => void;
  updateOrderInContext: (orderId: string, updates: Partial<Order>) => void;
  markAsPaid: (orderId: string) => void;
  cancelOrder: (orderId: string) => void;
  getOrderById: (orderId: string) => Order | undefined;
  getPendingOrders: () => Order[];
  getPaidOrders: () => Order[];
  getUnpaidOrders: () => Order[];
}

// --- CONTEXT ---
const OrderContext = createContext<OrderContextType | undefined>(undefined);

// --- API URL ---
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// --- PROVIDER ---
export function OrderProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  // ✅ FETCH ORDERS TỪ BACKEND
  const fetchOrders = async () => {
  if (!user?.id) {
    console.log('⚠️ No user ID, skipping order fetch');
    setOrders([]); // ✅ CLEAR ORDERS KHI KHÔNG CÓ USER
    return;
  }

  setIsLoading(true);
  try {
    console.log(`📡 Fetching orders for user: ${user.id}`);
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    
    // ✅ SỬA: Đổi từ /orders/user/${user.id} thành /user/orders
    const response = await fetch(`${API_URL}/api/user/orders`, {
      headers: token ? { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      } : {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`✅ Fetched orders from backend:`, data);
    
    // ✅ Backend trả về { success: true, data: [...], total: X }
    const ordersData = data.data || data || [];
    console.log(`✅ Loaded ${ordersData.length} orders`);
    setOrders(ordersData);
    
    // ✅ Sync với localStorage - CÓ KEY RIÊNG CHO USER
    if (typeof window !== 'undefined') {
      const ordersKey = `orders_${user.id}`;
      localStorage.setItem(ordersKey, JSON.stringify(ordersData));
    }
  } catch (error) {
    console.error('❌ Error fetching orders:', error);
    
    // ✅ Fallback: Load từ localStorage nếu fetch thất bại
    if (typeof window !== 'undefined') {
      const ordersKey = `orders_${user.id}`;
      const savedOrders = localStorage.getItem(ordersKey);
      if (savedOrders) {
        try {
          setOrders(JSON.parse(savedOrders));
          console.log('📦 Loaded orders from localStorage (fallback)');
        } catch (e) {
          console.error('Error parsing localStorage orders:', e);
          setOrders([]);
        }
      }
    }
  } finally {
    setIsLoading(false);
  }
};

  // ✅ FETCH ORDERS KHI USER THAY ĐỔI
  useEffect(() => {
    if (user?.id) {
      fetchOrders();
    } else {
      setOrders([]); // ✅ CLEAR ORDERS KHI LOGOUT
    }
  }, [user?.id]);

  // ✅ REFRESH ORDERS (PUBLIC METHOD)
  const refreshOrders = async () => {
    await fetchOrders();
  };

  // Generate order number
  const generateOrderNumber = () => {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `ORD${year}${month}${day}${random}`;
  };

  // ✅ Add new order
  const addOrder = (orderData: Omit<Order, 'id' | 'orderNumber' | 'createdAt'>): Order => {
    const newOrder: Order = {
      ...orderData,
      id: Date.now().toString(),
      orderNumber: generateOrderNumber(),
      createdAt: new Date().toISOString(),
    };
    
    setOrders(prev => {
      const updated = [newOrder, ...prev];
      if (typeof window !== 'undefined' && user?.id) {
        const ordersKey = `orders_${user.id}`;
        localStorage.setItem(ordersKey, JSON.stringify(updated));
      }
      return updated;
    });
    
    return newOrder;
  };

  // Update order status
  const updateOrderStatus = (orderId: string, status: Order['status']) => {
    setOrders(prev => {
      const updated = prev.map(order => {
        const isMatch = order.id === orderId || order._id === orderId || order.orderNumber === orderId;
        if (isMatch) {
          return { ...order, status };
        }
        return order;
      });
      if (typeof window !== 'undefined' && user?.id) {
        const ordersKey = `orders_${user.id}`;
        localStorage.setItem(ordersKey, JSON.stringify(updated));
      }
      return updated;
    });
  };

  // ✅ CẬP NHẬT ORDER TRONG CONTEXT (CHO REAL-TIME)
  const updateOrderInContext = (orderId: string, updates: Partial<Order>) => {
    setOrders(prevOrders => {
      const updated = prevOrders.map(order => {
        const isMatch = order.id === orderId || order._id === orderId || order.orderNumber === orderId;
        if (isMatch) {
          console.log('📝 Updating order in context:', orderId, updates);
          return { ...order, ...updates };
        }
        return order;
      });
      if (typeof window !== 'undefined' && user?.id) {
        const ordersKey = `orders_${user.id}`;
        localStorage.setItem(ordersKey, JSON.stringify(updated));
      }
      return updated;
    });
  };

  // Mark order as paid
  const markAsPaid = (orderId: string) => {
    setOrders(prev => {
      const updated = prev.map(order => {
        const isMatch = order.id === orderId || order._id === orderId || order.orderNumber === orderId;
        if (isMatch) {
          return {
            ...order,
            isPaid: true,
            paymentStatus: 'paid',
            paidAt: new Date().toISOString(),
            status: order.status === 'pending' ? 'processing' : order.status
          };
        }
        return order;
      });
      if (typeof window !== 'undefined' && user?.id) {
        const ordersKey = `orders_${user.id}`;
        localStorage.setItem(ordersKey, JSON.stringify(updated));
      }
      return updated;
    });
  };

  // Cancel order
  const cancelOrder = (orderId: string) => {
    setOrders(prev => {
      const updated = prev.map(order => {
        const isMatch = order.id === orderId || order._id === orderId || order.orderNumber === orderId;
        if (isMatch) {
          return { ...order, status: 'cancelled' };
        }
        return order;
      });
      if (typeof window !== 'undefined' && user?.id) {
        const ordersKey = `orders_${user.id}`;
        localStorage.setItem(ordersKey, JSON.stringify(updated));
      }
      return updated;
    });
  };

  // Get order by ID
  const getOrderById = (orderId: string) => {
    return orders.find(order => 
      order.id === orderId || 
      order._id === orderId || 
      order.orderNumber === orderId
    );
  };

  // Get pending orders
  const getPendingOrders = () => {
    return orders.filter(order => order.status === 'pending');
  };

  // Get paid orders
  const getPaidOrders = () => {
    return orders.filter(order => 
      order.isPaid === true || 
      order.paymentStatus === 'paid'
    );
  };

  // Get unpaid orders
  const getUnpaidOrders = () => {
    return orders.filter(order => 
      (order.isPaid !== true && order.paymentStatus !== 'paid') && 
      order.status !== 'cancelled'
    );
  };

  return (
    <OrderContext.Provider
      value={{
        orders,
        isLoading,
        addOrder,
        refreshOrders,
        updateOrderStatus,
        updateOrderInContext,
        markAsPaid,
        cancelOrder,
        getOrderById,
        getPendingOrders,
        getPaidOrders,
        getUnpaidOrders,
      }}
    >
      {children}
    </OrderContext.Provider>
  );
}

// --- HOOK ---
export function useOrders() {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error('useOrders must be used within OrderProvider');
  }
  return context;
}
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
  variant?: {
    name: string;
    sku: string;
  };
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
  addOrder: (order: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'updatedAt'>) => Order;
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
const API_URL = process.env.NEXT_PUBLIC_API_URL || '$ {process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}';

// --- PROVIDER ---
export function OrderProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  // ✅ FETCH ORDERS TỪ BACKEND
  const fetchOrders = async () => {
  if (!user?.id) {
    setOrders([]); 
    return;
  }

  setIsLoading(true);
  try {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    
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
    const ordersData = data.data || data || [];
    setOrders(ordersData);
    
    if (typeof window !== 'undefined') {
      const ordersKey = `orders_${user.id}`;
      localStorage.setItem(ordersKey, JSON.stringify(ordersData));
    }
  } catch (error) {
    console.error('❌ Error fetching orders:', error);
    
    if (typeof window !== 'undefined') {
      const ordersKey = `orders_${user.id}`;
      const savedOrders = localStorage.getItem(ordersKey);
      if (savedOrders) {
        try {
          setOrders(JSON.parse(savedOrders));
        } catch (e) {
          setOrders([]);
        }
      }
    }
  } finally {
    setIsLoading(false);
  }
};

  useEffect(() => {
    if (user?.id) {
      fetchOrders();
    } else {
      setOrders([]); 
    }
  }, [user?.id]);

  const refreshOrders = async () => {
    await fetchOrders();
  };

  const generateOrderNumber = () => {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `ORD${year}${month}${day}${random}`;
  };

  // ✅ Fix type error by casting prev to any
  const addOrder = (orderData: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'updatedAt'>): Order => {
    const newOrder: Order = {
      ...orderData,
      id: Date.now().toString(),
      orderNumber: generateOrderNumber(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    setOrders((prev: any) => {
      const updated = [newOrder, ...prev];
      if (typeof window !== 'undefined' && user?.id) {
        const ordersKey = `orders_${user.id}`;
        localStorage.setItem(ordersKey, JSON.stringify(updated));
      }
      return updated;
    });
    
    return newOrder;
  };

  const updateOrderStatus = (orderId: string, status: Order['status']) => {
    setOrders((prev: any) => {
      const updated = prev.map((order: Order) => {
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

  const updateOrderInContext = (orderId: string, updates: Partial<Order>) => {
    setOrders((prevOrders: any) => {
      const updated = prevOrders.map((order: Order) => {
        const isMatch = order.id === orderId || order._id === orderId || order.orderNumber === orderId;
        if (isMatch) {
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

  const markAsPaid = (orderId: string) => {
    setOrders((prev: any) => {
      const updated = prev.map((order: Order) => {
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

  const cancelOrder = (orderId: string) => {
    setOrders((prev: any) => {
      const updated = prev.map((order: Order) => {
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

  const getOrderById = (orderId: string) => {
    return orders.find(order => 
      order.id === orderId || 
      order._id === orderId || 
      order.orderNumber === orderId
    );
  };

  const getPendingOrders = () => {
    return orders.filter(order => order.status === 'pending');
  };

  const getPaidOrders = () => {
    return orders.filter(order => 
      order.isPaid === true || 
      order.paymentStatus === 'paid'
    );
  };

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

export function useOrders() {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error('useOrders must be used within OrderProvider');
  }
  return context;
}

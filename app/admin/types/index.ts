// app/admin/types/index.ts

import { ReactNode } from "react";

export interface Category {
  id?: string;
  _id?: string;
  name: string;
  slug: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Product {
  id?: string;
  _id?: string;
  name: string;
  slug: string;
  description?: string;
  price: number;
  salePrice?: number;
  category: string;
  categorySlug?: string;
  images?: string[];
  stock?: number;
  status?: 'active' | 'inactive' | 'draft';
  createdAt?: string;
  updatedAt?: string;
}

export interface UserInfo {
  id?: string;
  _id?: string;
  email: string;
  name?: string;
  role?: 'admin' | 'user';
  phone?: string;
  address?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Order {
  id?: string;
  _id?: string;
  orderNumber: string;
  userId: string;
  user?: UserInfo;
  items: OrderItem[];
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  shippingAddress?: Address;
  paymentMethod?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  total: number;
}

export interface Address {
  street?: string;
  city?: string;
  province?: string;
  zipCode?: string;
  country?: string;
  phone?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
export interface Stats {
  newUsersThisMonth: ReactNode;
  totalRevenue: unknown;
  totalOrders: ReactNode;
  totalUsers: ReactNode;
  users: {
    total: number;
    newThisMonth?: number; // Thống kê người dùng mới trong tháng
  };
  products: {
    total: number;
    outOfStock: number; // Số sản phẩm hết hàng
    active: number;     // Số sản phẩm đang 'active'
  };
  orders: {
    total: number;
    pending: number;
    processing: number;
    shipped: number;
    delivered: number;
    cancelled: number;
  };
  sales: {
    totalRevenue: number;      // Tổng doanh thu (thường tính từ các đơn đã 'delivered')
    revenueToday?: number;     // Doanh thu hôm nay
    revenueThisMonth?: number; // Doanh thu tháng này
  };
}
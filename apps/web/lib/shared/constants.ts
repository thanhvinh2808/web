export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '$ {process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}';
export const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || '$ {process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}';

export const ORDER_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled'
} as const;

export const PAYMENT_STATUS = {
  UNPAID: 'unpaid',
  PAID: 'paid',
  REFUNDED: 'refunded'
} as const;

export const USER_ROLES = {
  USER: 'user',
  ADMIN: 'admin'
} as const;

export const PRODUCT_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  OUT_OF_STOCK: 'out_of_stock'
} as const;

export const CONTACT_STATUS = {
  PENDING: 'pending',
  REPLIED: 'replied',
  CLOSED: 'closed'
} as const;

export const ROUTES = {
  HOME: '/',
  PRODUCTS: '/products',
  CART: '/cart',
  CHECKOUT: '/checkout',
  LOGIN: '/login',
  REGISTER: '/register',
  PROFILE: '/profile',
  ORDERS: '/orders',
  ADMIN: '/admin',
  CONTACT: '/contact'
} as const;

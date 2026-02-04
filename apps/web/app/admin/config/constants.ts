// app/admin/config/constants.ts

// ✅ ÉP CỨNG PORT 5000 ĐỂ TRÁNH LỖI NHẦM VỚI PORT 3000 CỦA FRONTEND
export const API_URL = process.env.NEXT_PUBLIC_API_URL || '$ {process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}';

export const ITEMS_PER_PAGE = 10;
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

export const STATUS_OPTIONS = [
  { value: 'active', label: 'Hoạt động' },
  { value: 'inactive', label: 'Không hoạt động' },
  { value: 'draft', label: 'Nháp' }
];

export const AUTH_TOKEN_KEY = 'adminToken';

export const API_ENDPOINTS = {
  // Auth
  LOGIN: `${API_URL}/api/login`,
  
  // Categories
  CATEGORIES: `${API_URL}/api/categories`,
  
  // Products
  PRODUCTS: `${API_URL}/api/admin/products`,
  
  // Users
  USERS: `${API_URL}/api/admin/users`,
  
  // Orders
  ORDERS: `${API_URL}/api/admin/orders`,
  ORDER_BY_ID: (id: string) => `${API_URL}/api/admin/orders/${id}`,
};

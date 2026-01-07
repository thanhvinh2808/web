// app/admin/config/constants.ts

// API Base URL - điều chỉnh theo môi trường của bạn
export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// Các hằng số khác có thể dùng trong admin panel
export const ITEMS_PER_PAGE = 10;

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

export const STATUS_OPTIONS = [
  { value: 'active', label: 'Hoạt động' },
  { value: 'inactive', label: 'Không hoạt động' },
  { value: 'draft', label: 'Nháp' }
];

// Token storage key
export const AUTH_TOKEN_KEY = 'admin_auth_token';

// API Endpoints
export const API_ENDPOINTS = {
  // Auth
  LOGIN: `${API_URL}/admin/login`,
  LOGOUT: `${API_URL}/admin/logout`,
  
  // Categories
  CATEGORIES: `${API_URL}/admin/categories`,
  CATEGORY_BY_SLUG: (slug: string) => `${API_URL}/admin/categories/${slug}`,
  
  // Products
  PRODUCTS: `${API_URL}/admin/products`,
  PRODUCT_BY_ID: (slug: string) => `${API_URL}/admin/products/${slug}`,
  
  // Users
  USERS: `${API_URL}/admin/users`,
  USER_BY_ID: (id: string) => `${API_URL}/admin/users/${id}`,
  
  // Orders
  ORDERS: `${API_URL}/admin/orders`,
  ORDER_BY_ID: (id: string) => `${API_URL}/admin/orders/${id}`,
};

// Messages
export const MESSAGES = {
  SUCCESS: {
    CREATE: 'Tạo mới thành công!',
    UPDATE: 'Cập nhật thành công!',
    DELETE: 'Xóa thành công!',
    LOGIN: 'Đăng nhập thành công!',
  },
  ERROR: {
    GENERIC: 'Có lỗi xảy ra, vui lòng thử lại',
    NETWORK: 'Lỗi kết nối server',
    UNAUTHORIZED: 'Bạn không có quyền truy cập',
    NOT_FOUND: 'Không tìm thấy dữ liệu',
    VALIDATION: 'Dữ liệu không hợp lệ',
  },
  CONFIRM: {
    DELETE: 'Bạn có chắc muốn xóa?',
  }
};
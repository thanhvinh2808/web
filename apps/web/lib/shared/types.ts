// User Types
export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  phone?: string;
  address?: string;
  city?: string;
  district?: string;
  ward?: string;
  avatar?: string;
  dateOfBirth?: string;
  gender?: '' | 'male' | 'female' | 'other';
  createdAt: Date;
  updatedAt: Date;
}

// Product Types
export interface ProductImage {
  url: string;
  alt: string;
  isPrimary: boolean;
}

export interface VariantOption {
  name: string;
  price: number;
  stock: number;
  sku?: string;
  image?: string;
}

export interface ProductVariant {
  name: string;
  options: VariantOption[];
}

export interface ProductSpecs {
  condition?: string;
  accessories?: string;
  material?: string;
  styleCode?: string;
  colorway?: string;
  releaseDate?: Date | string;
}

export interface Product {
  _id: string;
  id?: string; // For compatibility
  name: string;
  brand?: string;
  brandId?: string;
  slug: string;
  price: number;
  originalPrice?: number;
  images: ProductImage[];
  variants?: ProductVariant[];
  description?: string;
  tags?: string[];
  categorySlug?: string;
  specs?: ProductSpecs;
  rating: number;
  reviewCount: number;
  stock: number;
  soldCount: number;
  featured: boolean;
  isNew: boolean;
  hasPromotion: boolean;
  status: 'active' | 'inactive' | 'out_of_stock';
  createdAt: Date;
  updatedAt: Date;
}

// Brand Types
export interface Brand {
  _id: string;
  name: string;
  slug: string;
  logo: string;
  description?: string;
  origin?: string;
  website?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Order Types
export interface OrderItem {
  productId: string;
  productName: string;
  productBrand?: string;
  productImage?: string;
  price: number;
  quantity: number;
  variantName?: string;
  variantOption?: string;
  sku?: string;
}

export interface CustomerInfo {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city?: string;
  district?: string;
  ward?: string;
  notes?: string;
}

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
export type PaymentStatus = 'unpaid' | 'paid' | 'refunded';
export type PaymentMethod = 'cod' | 'banking' | 'momo';

export interface Order {
  _id: string;
  userId: string;
  items: OrderItem[];
  customerInfo: CustomerInfo;
  paymentMethod: PaymentMethod;
  totalAmount: number;
  voucherCode?: string;
  discountAmount: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  cancelledAt?: Date;
  cancelledBy?: 'user' | 'admin' | 'system';
  cancelReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Category Types
export interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Contact Types
export type ContactStatus = 'pending' | 'replied' | 'closed';

export interface Contact {
  _id: string;
  fullname: string;
  email: string;
  message: string;
  status: ContactStatus;
  createdAt: Date;
  updatedAt: Date;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export interface PaginatedResponse extends ApiResponse {
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

// Auth Types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData extends LoginCredentials {
  name: string;
}

export interface AuthResponse {
  success: boolean;
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: 'user' | 'admin';
  };
}
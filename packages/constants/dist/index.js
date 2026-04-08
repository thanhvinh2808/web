"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ROUTES = exports.CONTACT_STATUS = exports.PRODUCT_STATUS = exports.USER_ROLES = exports.PAYMENT_STATUS = exports.ORDER_STATUS = exports.SOCKET_URL = exports.API_BASE_URL = void 0;
exports.API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
exports.SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';
exports.ORDER_STATUS = {
    PENDING: 'pending',
    PROCESSING: 'processing',
    SHIPPED: 'shipped',
    DELIVERED: 'delivered',
    CANCELLED: 'cancelled'
};
exports.PAYMENT_STATUS = {
    UNPAID: 'unpaid',
    PAID: 'paid',
    REFUNDED: 'refunded'
};
exports.USER_ROLES = {
    USER: 'user',
    ADMIN: 'admin'
};
exports.PRODUCT_STATUS = {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    OUT_OF_STOCK: 'out_of_stock'
};
exports.CONTACT_STATUS = {
    PENDING: 'pending',
    REPLIED: 'replied',
    CLOSED: 'closed'
};
exports.ROUTES = {
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
};

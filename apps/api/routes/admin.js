import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { isAdmin } from '../middleware/isAdmin.js';
import adminBlogRoutes from './adminBlog.js'; // Import new admin blog routes
import {
  getDashboardStats,
  getAllUsers,
  updateUserRole,
  deleteUser,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  resetUserPassword,
  globalSearch,
  getRevenueStats,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead
} from '../controller/adminController.js';
import {
  getAllVouchers,
  createVoucher,
  updateVoucher,
  deleteVoucher
} from '../controller/voucherController.js';
import bcrypt from 'bcrypt';
import User from '../models/User.js';

const router = express.Router();

// ðŸ”’ Táº¥t cáº£ routes dÆ°á»›i Ä‘Ã¢y yÃªu cáº§u admin
router.use(authenticateToken);
router.use(isAdmin);

router.use('/blogs', adminBlogRoutes); // Mount admin blog routes

// Dashboard
router.get('/stats', getDashboardStats);
router.get('/revenue', getRevenueStats);
router.get('/search', globalSearch);

// Users Management
router.get('/users', getAllUsers);
router.put('/users/:userId/role', updateUserRole);
router.delete('/users/:userId', deleteUser);
router.put('/users/:userId/password', resetUserPassword);

// Orders Management
router.get('/orders', getAllOrders);
router.get('/orders/:orderId', getOrderById);
router.put('/orders/:orderId/status', updateOrderStatus);

// ðŸŽ« Voucher Management
router.get('/vouchers', getAllVouchers);
router.post('/vouchers', createVoucher);
router.put('/vouchers/:id', updateVoucher);
router.delete('/vouchers/:id', deleteVoucher);

// ðŸ”” Notifications
router.get('/notifications', getNotifications);
router.put('/notifications/read-all', markAllNotificationsRead);
router.put('/notifications/:id/read', markNotificationRead);

export default router;

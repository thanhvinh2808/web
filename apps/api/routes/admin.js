import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { isAdmin } from '../middleware/isAdmin.js';
import {
  getDashboardStats,
  getAllUsers,
  updateUserRole,
  deleteUser,
  getAllOrders,
  updateOrderStatus,
  resetUserPassword,
  globalSearch
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

// 🔒 Tất cả routes dưới đây yêu cầu admin
router.use(authenticateToken);
router.use(isAdmin);

// Dashboard
router.get('/stats', getDashboardStats);
router.get('/search', globalSearch);

// Users Management
router.get('/users', getAllUsers);
router.put('/users/:userId/role', updateUserRole);
router.delete('/users/:userId', deleteUser);
router.put('/users/:userId/password', resetUserPassword);

// Orders Management
router.get('/orders', getAllOrders);
router.put('/orders/:orderId/status', updateOrderStatus);

// 🎫 Voucher Management
router.get('/vouchers', getAllVouchers);
router.post('/vouchers', createVoucher);
router.put('/vouchers/:id', updateVoucher);
router.delete('/vouchers/:id', deleteVoucher);

export default router;
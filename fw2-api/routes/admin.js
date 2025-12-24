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
  resetUserPassword
  
} from '../controller/adminController.js';
import bcrypt from 'bcrypt';
import User from '../models/User.js';

const router = express.Router();

// 🔒 Tất cả routes dưới đây yêu cầu admin
router.use(authenticateToken);
router.use(isAdmin);

// Dashboard
router.get('/stats', getDashboardStats);

// Users Management
router.get('/users', getAllUsers);
router.put('/users/:userId/role', updateUserRole);
router.delete('/users/:userId', deleteUser);

// Orders Management
router.get('/orders', getAllOrders);
router.put('/orders/:orderId/status', updateOrderStatus);
// Reset User Password
router.put('/users/:userId/password', async (req, res) => {
  try {
    const { userId } = req.params;
    const { password } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password phải có ít nhất 6 ký tự'
      });
    }

    // Hash password mới
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update password
    await User.findByIdAndUpdate(userId, { password: hashedPassword });

    res.json({
      success: true,
      message: 'Reset password thành công'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi reset password: ' + error.message
    });
  }
});
// 🔑 Reset Password
router.put('/users/:userId/password', resetUserPassword);
export default router;
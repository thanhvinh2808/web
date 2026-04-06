import express from 'express';
import {
  createOrder,
  getOrderById,
  cancelOrder,
  markOrderAsPaid,
} from '../controller/orderController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// ✅ FIX: Thêm authenticateToken cho createOrder
// Controller dùng req.user.id để gán userId — nếu không có auth, req.user = undefined → crash
router.post('/', authenticateToken, createOrder);

// ✅ FIX: Thêm authenticateToken cho getOrderById
// Controller kiểm tra req.user.role và req.user.id → crash nếu không có auth
router.get('/:id', authenticateToken, getOrderById);

// Protected: Hủy đơn hàng
router.put('/:id/cancel', authenticateToken, cancelOrder);

// Protected: Đánh dấu đã thanh toán (sau khi quét QR)
router.put('/:id/pay', authenticateToken, markOrderAsPaid);

export default router;
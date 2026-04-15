import express from 'express';
import {
  createOrder,
  getOrderById,
  requestCancelOrder,
  markOrderAsPaid,
  trackOrder,
} from '../controller/orderController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Public: Tra cứu nhanh đơn hàng (Cho chatbot)
router.get('/track/:orderNumber', trackOrder);

// ✅ FIX: Thêm authenticateToken cho createOrder
router.post('/', authenticateToken, createOrder);

// ✅ FIX: Thêm authenticateToken cho getOrderById
// Controller kiểm tra req.user.role và req.user.id → crash nếu không có auth
router.get('/:id', authenticateToken, getOrderById);

// Protected: Hủy đơn hàng
router.put('/:id/cancel', authenticateToken, requestCancelOrder);

// Protected: Đánh dấu đã thanh toán (sau khi quét QR)
router.put('/:id/pay', authenticateToken, markOrderAsPaid);

export default router;
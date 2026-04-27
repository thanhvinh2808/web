import express from 'express';
import {
  createOrder,
  getOrderById,
  getUserOrders,
  requestCancelOrder,
  completeOrder,
  markOrderAsPaid,
  trackOrder,
  reorder
} from '../controller/orderController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Public: Tra cứu nhanh đơn hàng (Cho chatbot)
router.get('/track/:orderNumber', trackOrder);

// Protected: Lấy danh sách đơn hàng của người dùng hiện tại
router.get('/my-orders', authenticateToken, getUserOrders);

// Protected: Tạo đơn hàng mới
router.post('/', authenticateToken, createOrder);

// Protected: Lấy thông tin sản phẩm để mua lại
router.get('/:id/reorder', authenticateToken, reorder);

// Protected: Lấy chi tiết đơn hàng
router.get('/:id', authenticateToken, getOrderById);

// Protected: Hủy đơn hàng
router.put('/:id/cancel', authenticateToken, requestCancelOrder);

// Protected: Xác nhận hoàn thành đơn hàng
router.put('/:id/complete', authenticateToken, completeOrder);

// Protected: Đánh dấu đã thanh toán (sau khi quét QR)
router.put('/:id/pay', authenticateToken, markOrderAsPaid);

export default router;
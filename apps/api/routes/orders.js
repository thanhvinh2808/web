import express from 'express';
import { createOrder, getOrderById, cancelOrder, markOrderAsPaid } from '../controller/orderController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Public: Create Order
router.post('/', createOrder);

// Protected: Get Order Detail
router.get('/:id', getOrderById); // Cho cả public/private tùy logic controller, nhưng controller check ID hợp lệ

// Protected: Cancel Order
router.put('/:id/cancel', authenticateToken, cancelOrder);

// Protected: Mark as Paid (Sau khi quét QR)
router.put('/:id/pay', authenticateToken, markOrderAsPaid);

export default router;
import express from 'express';
import Product from '../models/Product.js';
import Review from '../models/Review.js';
import { 
  addProductReview, 
  getProducts, 
  getProductById, 
  checkCanReview, 
  getProductReviews 
} from '../controller/productController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// 📋 Đánh giá sản phẩm (Reviews)
router.get('/:productId/reviews', getProductReviews);
router.get('/:productId/can-review', authenticateToken, checkCanReview);
router.post('/:productId/reviews', authenticateToken, addProductReview);

// 📋 Lấy tất cả sản phẩm (Public)
router.get('/', getProducts);

// 🔍 Lấy chi tiết sản phẩm theo ID hoặc SLUG
router.get('/:id', getProductById);

export default router;
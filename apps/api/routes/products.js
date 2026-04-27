import express from 'express';
import Product from '../models/Product.js';
import Review from '../models/Review.js';
import { addProductReview, getProducts, getProductById } from '../controller/productController.js';
import { authenticateToken } from '../middleware/auth.js';
import mongoose from 'mongoose';

const router = express.Router();

// 📋 Đánh giá sản phẩm (Reviews)
router.get('/:productId/reviews', async (req, res) => {
  try {
    const { productId } = req.params;
    const Review = mongoose.model('Review');
    const reviews = await Review.find({ productId, status: 'approved' })
      .populate('userId', 'name avatar')
      .sort({ createdAt: -1 });
    res.json({ success: true, reviews });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/:productId/reviews', authenticateToken, addProductReview);

// 📋 Lấy tất cả sản phẩm (Public)
router.get('/', getProducts);

// 🔍 Lấy chi tiết sản phẩm theo ID hoặc SLUG
router.get('/:id', getProductById);

export default router;
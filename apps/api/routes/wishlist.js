import express from 'express';
import Wishlist from '../models/Wishlist.js';
import Product from '../models/Product.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// ✅ GET: Wishlist of current user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const wishlist = await Wishlist.findOne({ userId: req.user.id })
      .populate({
        path: 'products.productId',
        select: 'name price originalPrice brand slug image images variants tags stock soldCount status'
      })
      .lean();

    if (!wishlist) {
      return res.json({ success: true, data: [] });
    }

    // Lọc bỏ sản phẩm null và chuẩn hóa dữ liệu
    const validProducts = wishlist.products
      .filter(p => p.productId)
      .map(p => {
        const prod = p.productId;
        if (!prod.image && prod.images?.length > 0) {
          prod.image = prod.images.find(img => img.isPrimary)?.url || prod.images[0].url;
        }
        return prod;
      });
    
    res.json({
      success: true,
      data: validProducts
    });
  } catch (error) {
    console.error('Wishlist GET Error:', error);
    res.status(500).json({ success: false, message: 'Không thể tải danh sách yêu thích' });
  }
});

// ✅ POST: Toggle product in wishlist (Atomic & Validated)
router.post('/toggle', authenticateToken, async (req, res) => {
  try {
    const { productId } = req.body;
    if (!productId) return res.status(400).json({ success: false, message: 'ProductId là bắt buộc' });

    // 1. Kiểm tra tồn tại
    const productExists = await Product.exists({ _id: productId });
    if (!productExists) {
      return res.status(404).json({ success: false, message: 'Sản phẩm không tồn tại' });
    }

    // 2. Atomic Toggle Logic
    const pullResult = await Wishlist.updateOne(
      { userId: req.user.id, "products.productId": productId },
      { $pull: { products: { productId } } }
    );

    if (pullResult.modifiedCount > 0) {
      return res.json({
        success: true,
        action: 'removed',
        message: 'Đã xóa khỏi yêu thích'
      });
    }

    await Wishlist.updateOne(
      { userId: req.user.id },
      { $addToSet: { products: { productId } } },
      { upsert: true }
    );

    res.json({
      success: true,
      action: 'added',
      message: 'Đã thêm vào yêu thích'
    });
  } catch (error) {
    console.error('Wishlist Toggle Error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server khi cập nhật yêu thích' });
  }
});

// ✅ DELETE: Remove specific product
router.delete('/:productId', authenticateToken, async (req, res) => {
  try {
    const { productId } = req.params;
    
    await Wishlist.updateOne(
      { userId: req.user.id },
      { $pull: { products: { productId } } }
    );

    res.json({ success: true, message: 'Đã xóa khỏi yêu thích' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server khi xóa sản phẩm' });
  }
});

export default router;

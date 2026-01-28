import express from 'express';
import Wishlist from '../models/Wishlist.js';
import Product from '../models/Product.js';
import jwt from 'jsonwebtoken';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'vinh-super-secret-key-2024-techstore-12345';

// ✅ Middleware: Authenticate
const authenticateToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ success: false, message: 'Token required' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ success: false, message: 'Invalid token' });
  }
};

// ✅ GET: Wishlist of current user
router.get('/', authenticateToken, async (req, res) => {
  try {
    let wishlist = await Wishlist.findOne({ userId: req.user.id })
      .populate({
        path: 'products.productId',
        model: 'Product'
      });

    if (!wishlist) {
      wishlist = await Wishlist.create({ userId: req.user.id, products: [] });
    }

    // Filter out null products (if a product was deleted)
    const validProducts = wishlist.products.filter(p => p.productId !== null);
    
    res.json({
      success: true,
      data: validProducts.map(p => p.productId)
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ✅ POST: Add/Toggle product in wishlist
router.post('/toggle', authenticateToken, async (req, res) => {
  try {
    const { productId } = req.body;
    if (!productId) return res.status(400).json({ success: false, message: 'ProductId required' });

    let wishlist = await Wishlist.findOne({ userId: req.user.id });
    if (!wishlist) {
      wishlist = await Wishlist.create({ userId: req.user.id, products: [] });
    }

    const index = wishlist.products.findIndex(p => p.productId.toString() === productId);

    let action = '';
    if (index === -1) {
      // Add
      wishlist.products.push({ productId });
      action = 'added';
    } else {
      // Remove
      wishlist.products.splice(index, 1);
      action = 'removed';
    }

    await wishlist.save();
    
    res.json({
      success: true,
      action,
      message: action === 'added' ? 'Đã thêm vào yêu thích' : 'Đã xóa khỏi yêu thích'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ✅ DELETE: Remove specific product
router.delete('/:productId', authenticateToken, async (req, res) => {
  try {
    const { productId } = req.params;
    const wishlist = await Wishlist.findOne({ userId: req.user.id });
    
    if (wishlist) {
      wishlist.products = wishlist.products.filter(p => p.productId.toString() !== productId);
      await wishlist.save();
    }

    res.json({ success: true, message: 'Đã xóa khỏi yêu thích' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;

import express from 'express';
import Product from '../models/Product.js';
import mongoose from 'mongoose';

const router = express.Router();

// 📋 Lấy tất cả sản phẩm (Public)
router.get('/', async (req, res) => {
  try {
    const { category, brand, tag, limit, page = 1, exclude, type } = req.query;
    const query = {};

    if (category) query.categorySlug = category;
    if (brand) query.brand = brand;
    if (tag) query.tags = tag;
    if (exclude) {
       if (mongoose.Types.ObjectId.isValid(exclude)) {
          query._id = { $ne: exclude };
       } else {
          query.slug = { $ne: exclude };
       }
    }
    
    // Hỗ trợ lọc theo loại (new/2hand) qua tag
    if (type) {
       query.tags = type.toLowerCase();
    }

    const skip = limit ? (parseInt(page) - 1) * parseInt(limit) : 0;
    
    let productQuery = Product.find(query).sort({ createdAt: -1 });
    
    if (skip) productQuery = productQuery.skip(skip);
    if (limit) productQuery = productQuery.limit(parseInt(limit));
    
    const products = await productQuery.populate('brandId', 'name logo').lean();
    const total = await Product.countDocuments(query);
    
    res.json({
      success: true, 
      data: products,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: limit ? Math.ceil(total / limit) : 1
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 🔍 Lấy chi tiết sản phẩm theo ID hoặc SLUG
router.get('/:identifier', async (req, res) => {
  try {
    const { identifier } = req.params;
    let product = null;

    console.log(`🔍 Đang tìm sản phẩm với định danh: ${identifier}`);

    // 1. Thử tìm theo ID nếu identifier là ObjectId hợp lệ
    if (mongoose.Types.ObjectId.isValid(identifier)) {
      product = await Product.findById(identifier).populate('brandId', 'name logo slug');
    }

    // 2. Nếu không tìm thấy hoặc không phải ID, thử tìm theo Slug
    if (!product) {
      product = await Product.findOne({ slug: identifier }).populate('brandId', 'name logo slug');
    }

    if (product) {
      // Đảm bảo trả về format object trực tiếp (tương thích frontend hiện tại)
      res.json(product);
    } else {
      console.warn(`❌ Không tìm thấy sản phẩm: ${identifier}`);
      res.status(404).json({ error: 'Sản phẩm không tồn tại' });
    }
  } catch (error) {
    console.error('❌ Lỗi API chi tiết sản phẩm:', error);
    res.status(500).json({ error: 'Lỗi máy chủ nội bộ' });
  }
});

export default router;

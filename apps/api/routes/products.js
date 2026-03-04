import express from 'express';
import Product from '../models/Product.js';
import mongoose from 'mongoose';

const router = express.Router();

// 📋 Lấy tất cả sản phẩm (Public)
router.get('/', async (req, res) => {
  try {
    const { category, brand, tag, limit, page = 1, exclude, type, search } = req.query;
    const query = { status: 'active' };

    // 1. Lọc theo danh mục
    if (category && category !== 'all') query.categorySlug = category;
    
    // 2. Lọc theo thương hiệu
    if (brand) query.brand = brand;
    
    // 3. Lọc theo Tag hoặc Type
    const filterTag = tag || type;
    if (filterTag && filterTag !== 'all') {
       query.tags = filterTag.toLowerCase();
    }

    // 4. Tìm kiếm nâng cao
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } }
      ];
    }

    // 5. Loại trừ sản phẩm (Related)
    if (exclude) {
       if (mongoose.Types.ObjectId.isValid(exclude)) {
          query._id = { $ne: exclude };
       } else {
          query.slug = { $ne: exclude };
       }
    }

    // ✅ LUÔN SẮP XẾP MỚI NHẤT LÊN ĐẦU (Server-side)
    let productQuery = Product.find(query).sort({ createdAt: -1 });
    
    // 6. Phân trang Server-side (Chỉ áp dụng nếu có limit)
    const total = await Product.countDocuments(query);
    if (limit && limit !== 'all') {
       const pageSize = parseInt(limit);
       const currentPage = parseInt(page);
       productQuery = productQuery.skip((currentPage - 1) * pageSize).limit(pageSize);
    }
    
    const products = await productQuery.populate('brandId', 'name logo slug').lean();
    
    res.json({
      success: true, 
      data: products,
      pagination: {
        total,
        page: parseInt(page),
        limit: limit === 'all' ? total : parseInt(limit || total),
        pages: (limit && limit !== 'all') ? Math.ceil(total / parseInt(limit)) : 1
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

    if (mongoose.Types.ObjectId.isValid(identifier)) {
      product = await Product.findById(identifier).populate('brandId', 'name logo slug');
    }

    if (!product) {
      product = await Product.findOne({ slug: identifier }).populate('brandId', 'name logo slug');
    }

    if (product) {
      res.json(product);
    } else {
      res.status(404).json({ error: 'Sản phẩm không tồn tại' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Lỗi máy chủ nội bộ' });
  }
});

export default router;
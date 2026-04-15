import Product from '../models/Product.js';
import Category from '../models/Category.js';
import { deleteFile, deleteMultipleFiles } from '../middleware/upload.js';
import mongoose from 'mongoose';

/**
 * LẤY DANH SÁCH SẢN PHẨM (CÓ PHÂN TRANG & BỘ LỌC)
 */
export const getProducts = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 12, 
      search, 
      category, 
      brand, 
      tag, 
      type,
      minPrice, 
      maxPrice, 
      sort,
      exclude // Bỏ qua sản phẩm cụ thể (dùng cho Related)
    } = req.query;

    const query = { status: 'active' };

    // 1. Tìm kiếm văn bản
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } }
      ];
    }

    // 2. Lọc theo danh mục & thương hiệu
    if (category) query.categorySlug = category;
    if (brand) query.brand = brand;
    if (exclude) query.slug = { $ne: exclude };

    // 3. Lọc theo Tag (new, 2hand, etc.)
    const filterTag = tag || type;
    if (filterTag) query.tags = filterTag.toLowerCase();

    // 4. Lọc theo giá cơ sở
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    // 5. Sắp xếp
    let sortOptions = { createdAt: -1 };
    if (sort === 'price_asc') sortOptions = { price: 1 };
    if (sort === 'price_desc') sortOptions = { price: -1 };
    if (sort === 'popular') sortOptions = { soldCount: -1 };
    if (sort === 'rating') sortOptions = { rating: -1 };

    const skip = (Number(page) - 1) * Number(limit);
    
    // Thực thi query
    const products = await Product.find(query)
      .populate('brandId', 'name logo slug') // Lấy thêm info Brand
      .sort(sortOptions)
      .skip(skip)
      .limit(Number(limit));

    const total = await Product.countDocuments(query);

    res.json({
      success: true,
      data: products,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * LẤY CHI TIẾT SẢN PHẨM THEO SLUG
 */
export const getProductBySlug = async (req, res) => {
  try {
    const product = await Product.findOne({ slug: req.params.slug, status: 'active' })
      .populate('brandId'); // Lấy full info Brand để hiện Logo/SizeGuide

    if (!product) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' });
    }

    res.json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * TẠO SẢN PHẨM MỚI (ADMIN)
 */
export const createProduct = async (req, res) => {
  try {
    const productData = req.body;

    if (!productData.name || !productData.price) {
      return res.status(400).json({ success: false, message: 'Tên và giá là bắt buộc' });
    }

    // Xử lý slug tự động
    if (!productData.slug) {
      productData.slug = productData.name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .trim();
    }

    const newProduct = new Product(productData);
    await newProduct.save();

    res.status(201).json({ success: true, message: 'Tạo sản phẩm thành công', product: newProduct });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * CẬP NHẬT SẢN PHẨM
 */
export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params; // Có thể là ID hoặc Slug
    const isId = mongoose.Types.ObjectId.isValid(id);
    const filter = isId ? { _id: id } : { slug: id };

    const updatedProduct = await Product.findOneAndUpdate(filter, req.body, { 
      new: true, 
      runValidators: true 
    });

    if (!updatedProduct) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' });
    }

    res.json({ success: true, message: 'Cập nhật thành công', product: updatedProduct });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * XÓA SẢN PHẨM
 */
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params; // Có thể là ID hoặc Slug
    const isId = mongoose.Types.ObjectId.isValid(id);
    const filter = isId ? { _id: id } : { slug: id };

    const product = await Product.findOne(filter);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' });
    }

    // Xóa file ảnh vật lý
    const allImages = [product.image, ...(product.images || [])].filter(img => typeof img === 'string');
    if (allImages.length > 0) {
      try { await deleteMultipleFiles(allImages); } catch (e) { console.warn('Lỗi xóa file ảnh:', e); }
    }

    await Product.findOneAndDelete(filter);

    res.json({ success: true, message: 'Đã xóa sản phẩm thành công' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * LẤY ĐÁNH GIÁ SẢN PHẨM
 */
export const getProductReviews = async (req, res) => {
  try {
    const { id } = req.params;
    // Giả định Review model đã tồn tại
    const Review = mongoose.model('Review');
    const reviews = await Review.find({ productId: id, status: 'approved' })
      .populate('userId', 'name avatar')
      .sort({ createdAt: -1 });

    res.json({ success: true, reviews });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

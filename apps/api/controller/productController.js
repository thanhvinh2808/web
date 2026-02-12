import Product from '../models/Product.js';
import Category from '../models/Category.js';
import { deleteFile, deleteMultipleFiles } from '../middleware/upload.js';
import mongoose from 'mongoose';

// ✅ LẤY TẤT CẢ SẢN PHẨM (CÓ PHÂN TRANG & FILTER)
export const getProducts = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 12, 
      search, 
      category, 
      brand, 
      tag, 
      type, // ✅ Hỗ trợ thêm alias 'type'
      minPrice, 
      maxPrice, 
      sort 
    } = req.query;

    const query = { status: 'active' };

    // Tìm kiếm theo tên
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    // Lọc theo danh mục (slug)
    if (category) {
      query.categorySlug = category;
    }

    // Lọc theo thương hiệu
    if (brand) {
      query.brand = brand;
    }

    // ✅ LỌC THEO TAG (Hỗ trợ cả 'tag' và 'type')
    const filterTag = tag || type; // Ưu tiên tag, fallback sang type
    if (filterTag) {
      query.tags = filterTag.toLowerCase();
    }

    // Lọc theo giá
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    // Sắp xếp
    let sortOptions = { createdAt: -1 };
    if (sort === 'price_asc') sortOptions = { price: 1 };
    if (sort === 'price_desc') sortOptions = { price: -1 };
    if (sort === 'oldest') sortOptions = { createdAt: 1 };

    const skip = (Number(page) - 1) * Number(limit);
    
    const products = await Product.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(Number(limit))
      .lean();

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

// ✅ LẤY CHI TIẾT SẢN PHẨM THEO SLUG
export const getProductBySlug = async (req, res) => {
  try {
    const product = await Product.findOne({ slug: req.params.slug, status: 'active' });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' });
    }
    res.json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ TẠO SẢN PHẨM MỚI (DÀNH CHO ADMIN)
export const createProduct = async (req, res) => {
  try {
    const productData = req.body;

    // 1. Kiểm tra các trường bắt buộc
    if (!productData.name || !productData.price) {
      return res.status(400).json({ success: false, message: 'Tên và giá là bắt buộc' });
    }

    // 2. Tự động tạo slug nếu thiếu
    if (!productData.slug) {
      productData.slug = productData.name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
    }

    // Kiểm tra slug trùng
    const existingProduct = await Product.findOne({ slug: productData.slug });
    if (existingProduct) {
      productData.slug = `${productData.slug}-${Date.now().toString().slice(-4)}`;
    }

    // 3. Xử lý Tags (Chuẩn hóa mảng)
    if (productData.tags && typeof productData.tags === 'string') {
      productData.tags = productData.tags.split(',').map(t => t.trim().toLowerCase());
    }

    // 4. Lưu vào DB
    const newProduct = new Product(productData);
    await newProduct.save();

    res.status(201).json({ success: true, message: 'Tạo sản phẩm thành công', product: newProduct });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ✅ CẬP NHẬT SẢN PHẨM
export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'ID không hợp lệ' });
    }

    // Xử lý Tags nếu có gửi lên dưới dạng string
    if (updateData.tags && typeof updateData.tags === 'string') {
      updateData.tags = updateData.tags.split(',').map(t => t.trim().toLowerCase());
    }

    const updatedProduct = await Product.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });

    if (!updatedProduct) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' });
    }

    res.json({ success: true, message: 'Cập nhật thành công', product: updatedProduct });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ✅ XÓA SẢN PHẨM (SOFT DELETE HOẶC HARD DELETE)
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' });
    }

    // Xóa ảnh liên quan (nếu có)
    if (product.images && product.images.length > 0) {
      const imageUrls = product.images.map(img => img.url);
      await deleteMultipleFiles(imageUrls);
    }
    if (product.image) {
      await deleteFile(product.image);
    }

    await Product.findByIdAndDelete(id);

    res.json({ success: true, message: 'Đã xóa sản phẩm và các tệp liên quan' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ LẤY SẢN PHẨM LIÊN QUAN
export const getRelatedProducts = async (req, res) => {
  try {
    const { slug } = req.params;
    const product = await Product.findOne({ slug }).lean();
    
    if (!product) return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });

    const related = await Product.find({
      status: 'active',
      _id: { $ne: product._id },
      $or: [
        { categorySlug: product.categorySlug },
        { brand: product.brand },
        { tags: { $in: product.tags } } // Tìm theo tag chung
      ]
    })
    .limit(4)
    .lean();

    res.json({ success: true, data: related });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

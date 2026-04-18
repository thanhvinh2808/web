import Product from '../models/Product.js';
import Category from '../models/Category.js';
import Review from '../models/Review.js'; // ✅ Thêm import Review
import { deleteFile, deleteMultipleFiles } from '../middleware/upload.js';
import mongoose from 'mongoose';

// ... (existing code)

/**
 * THÊM ĐÁNH GIÁ SẢN PHẨM (CUSTOMER)
 */
export const addProductReview = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { productId } = req.params;
    const { rating, comment, isAnonymous } = req.body;
    const userId = req.user.id;

    // 1. Kiểm tra sản phẩm
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Sản phẩm không tồn tại' });
    }

    // 2. CHẶN TRÙNG LẶP: Kiểm tra xem người dùng đã đánh giá sản phẩm này chưa
    const existingReview = await Review.findOne({ productId, userId }).session(session);
    if (existingReview) {
      return res.status(400).json({ 
        success: false, 
        message: 'Bạn đã gửi đánh giá cho sản phẩm này trước đó rồi.' 
      });
    }

    // 3. Tạo review mới
    const newReview = new Review({
      productId,
      userId,
      rating: Number(rating),
      comment: comment.trim(),
      isAnonymous: !!isAnonymous,
      status: 'approved'
    });

    await newReview.save({ session });

    // 4. Tính toán lại Rating trung bình cho sản phẩm
    const allReviews = await Review.find({ productId, status: 'approved' }).session(session);
    const totalRating = allReviews.reduce((sum, r) => sum + r.rating, 0);
    const avgRating = allReviews.length > 0 ? (totalRating / allReviews.length).toFixed(1) : rating;

    await Product.findByIdAndUpdate(productId, {
      rating: Number(avgRating)
    }, { session });

    await session.commitTransaction();
    
    res.status(201).json({ 
      success: true, 
      message: 'Cảm ơn bạn đã đánh giá sản phẩm!',
      data: newReview
    });

  } catch (error) {
    await session.abortTransaction();
    console.error('❌ Lỗi đánh giá sản phẩm:', error);
    res.status(500).json({ success: false, message: error.message });
  } finally {
    session.endSession();
  }
};

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
      exclude,
      status 
    } = req.query;

    const query = {};
    if (status !== 'all' && !req.originalUrl.includes('/api/admin/')) {
       query.status = 'active';
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } }
      ];
    }

    if (category) query.categorySlug = category;
    if (brand) query.brand = brand;
    if (exclude) query.slug = { $ne: exclude };

    const filterTag = tag || type;
    if (filterTag) query.tags = filterTag.toLowerCase();

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    let sortOptions = { createdAt: -1, _id: -1 };
    if (sort === 'price_asc') sortOptions = { price: 1 };
    else if (sort === 'price_desc') sortOptions = { price: -1 };
    else if (sort === 'popular') sortOptions = { soldCount: -1 };
    else if (sort === 'rating') sortOptions = { rating: -1 };

    const finalLimit = limit === 'all' ? 1000 : Number(limit);
    const skip = limit === 'all' ? 0 : (Number(page) - 1) * finalLimit;
    
    const products = await Product.find(query)
      .populate('brandId', 'name logo slug')
      .sort(sortOptions)
      .skip(skip)
      .limit(finalLimit);

    const total = await Product.countDocuments(query);

    res.json({
      success: true,
      data: products,
      pagination: { total, page: Number(page), limit: finalLimit, pages: Math.ceil(total / (finalLimit || 1)) }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * LẤY CHI TIẾT SẢN PHẨM (ADMIN & PUBLIC)
 * Hỗ trợ cả ID và Slug
 */
export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const isId = mongoose.Types.ObjectId.isValid(id);
    const filter = isId ? { _id: id } : { slug: id };

    const product = await Product.findOne(filter).populate('brandId', 'name logo slug');

    if (!product) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' });
    }

    res.json({ success: true, data: product });
  } catch (error) {
    console.error('❌ Lỗi lấy chi tiết sản phẩm:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * TẠO SẢN PHẨM MỚI (ADMIN)
 */
export const createProduct = async (req, res) => {
  try {
    const productData = { ...req.body };

    // 🛡️ CHỐNG LỖI 400: Dọn dẹp dữ liệu
    if (!productData.name || !productData.price) {
      return res.status(400).json({ success: false, message: 'Tên và giá là bắt buộc' });
    }

    // Xử lý brandId nếu bị trống
    if (!productData.brandId || productData.brandId === "" || productData.brandId === "null") {
      delete productData.brandId;
    }

    // 🛡️ FIX CastError: Xử lý releaseDate nếu là chuỗi rỗng
    if (productData.specs && productData.specs.releaseDate === "") {
      delete productData.specs.releaseDate;
    }

    // Tự động sinh slug nếu thiếu
    if (!productData.slug || productData.slug.trim() === "") {
      productData.slug = productData.name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[đĐ]/g, 'd')
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .trim() + '-' + Date.now();
    }

    // Định dạng lại mảng images
    if (productData.images && Array.isArray(productData.images) && productData.images.length > 0) {
      productData.images = productData.images.map((img, idx) => {
        if (typeof img === 'string') return { url: img, alt: productData.name, isPrimary: idx === 0 };
        return img;
      });
      productData.image = productData.images[0].url;
    }

    const newProduct = new Product(productData);
    await newProduct.save();

    res.status(201).json({ success: true, message: 'Tạo sản phẩm thành công', product: newProduct });
  } catch (error) {
    console.error('❌ Lỗi tạo sản phẩm:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * CẬP NHẬT SẢN PHẨM
 */
export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const isId = mongoose.Types.ObjectId.isValid(id);
    const filter = isId ? { _id: id } : { slug: id };

    const updateData = { ...req.body };
    if (!updateData.brandId || updateData.brandId === "" || updateData.brandId === "null") {
       delete updateData.brandId;
    }

    // 🛡️ FIX CastError: Xử lý releaseDate nếu là chuỗi rỗng
    if (updateData.specs && updateData.specs.releaseDate === "") {
      delete updateData.specs.releaseDate;
    }

    // Định dạng lại mảng images khi cập nhật
    if (updateData.images && Array.isArray(updateData.images) && updateData.images.length > 0) {
      updateData.images = updateData.images.map((img, idx) => {
        if (typeof img === 'string') return { url: img, alt: updateData.name || 'product', isPrimary: idx === 0 };
        return img;
      });
      updateData.image = updateData.images[0].url;
    }

    const updatedProduct = await Product.findOneAndUpdate(filter, updateData, { 
      new: true, 
      runValidators: true 
    });

    if (!updatedProduct) return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' });

    res.json({ success: true, message: 'Cập nhật thành công', product: updatedProduct });
  } catch (error) {
    console.error('❌ Lỗi cập nhật sản phẩm:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * XÓA SẢN PHẨM (ADMIN)
 */
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    
    // 1. Xác định filter (ID hoặc Slug)
    const isId = mongoose.Types.ObjectId.isValid(id);
    const filter = isId ? { _id: id } : { slug: id };

    // 2. Lấy thông tin sản phẩm trước khi xóa để lấy danh sách ảnh
    // Sử dụng .lean() để tránh các getter gây lỗi URL
    const product = await Product.findOne(filter).lean();
    
    if (!product) {
      return res.status(404).json({ 
        success: false, 
        message: 'Sản phẩm không tồn tại hoặc đã bị xóa trước đó' 
      });
    }

    // 3. Thực hiện xóa trong Database TRƯỚC
    const deletedProduct = await Product.findOneAndDelete(filter);
    
    if (!deletedProduct) {
      throw new Error('Không thể thực hiện lệnh xóa sản phẩm trong database');
    }

    // 4. Thu thập ảnh và xóa (Sử dụng kiểm tra mảng cực kỳ chặt chẽ)
    const imagePaths = new Set();
    
    if (product.image) imagePaths.add(product.image);

    // Kiểm tra mảng images
    if (product.images && Array.isArray(product.images)) {
      product.images.forEach(img => {
        if (img) {
          const url = typeof img === 'string' ? img : img.url;
          if (url) imagePaths.add(url);
        }
      });
    }

    // Kiểm tra mảng variants và options
    if (product.variants && Array.isArray(product.variants)) {
      product.variants.forEach(v => {
        if (v && v.options && Array.isArray(v.options)) {
          v.options.forEach(opt => {
            if (opt && opt.image) imagePaths.add(opt.image);
          });
        }
      });
    }

    const finalPaths = [...imagePaths].filter(Boolean);
    
    // Xóa ảnh ở chế độ "fire and forget" - không đợi nó xong để tránh block response
    if (finalPaths.length > 0) {
      deleteMultipleFiles(finalPaths).catch(err => 
        console.error('⚠️ Lỗi xóa ảnh hậu kỳ:', err.message)
      );
    }

    return res.json({ 
      success: true, 
      message: `Đã xóa thành công sản phẩm: ${product.name}` 
    });

  } catch (error) {
    console.error('❌ CRITICAL DELETE ERROR:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Lỗi hệ thống khi xóa sản phẩm',
      error: error.message,
      stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined
    });
  }
};

export const getProductBySlug = async (req, res) => {
  try {
    const product = await Product.findOne({ slug: req.params.slug }).populate('brandId');
    if (!product) return res.status(404).json({ success: false, message: 'Không tìm thấy' });
    res.json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getProductReviews = async (req, res) => {
  try {
    const Review = mongoose.model('Review');
    const reviews = await Review.find({ productId: req.params.id, status: 'approved' }).populate('userId', 'name avatar').sort({ createdAt: -1 });
    res.json({ success: true, reviews });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

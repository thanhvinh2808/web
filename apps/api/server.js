// ✅ COMPLETE VERSION - server.js (With ALL Admin Routes)
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import path from 'path';

// Models
import User from './models/User.js';
import Order from './models/Order.js';
import Product from './models/Product.js';
import Category from './models/Category.js';
import Contact from './models/Contact.js';
import Blog from './models/Blog.js';
import Voucher from './models/Voucher.js';
import Review from './models/Review.js';
// Middleware
import { 
  uploadSingle, 
  uploadMultiple, 
  handleUploadError, 
  deleteFile 
} from './middleware/upload.js';
import { authenticateToken } from './middleware/auth.js';

// Services
import { 
  sendNewOrderEmail, 
  sendNewContactEmail, 
  sendReplyEmail 
} from './services/emailService.js';

import { createNotification } from './controller/adminController.js';

// ✅ Routes
import adminRoutes from './routes/admin.js';
import tradeInRoutes from './routes/tradeIn.js';
import blogRoutes from './routes/blog.js';
import wishlistRoutes from './routes/wishlist.js';
// ✅ Routes mới
import brandRoutes from './routes/brands.js';
import addressRoutes from './routes/addresses.js';
import sizeGuideRoutes from './routes/sizeGuides.js';
import orderRoutes from './routes/orders.js'; // ✅ Imported Order Routes
import authRoutes from './routes/auth.js'; // ✅ Auth Routes
import notificationRoutes from './routes/notifications.js';
import productRoutes from './routes/products.js';

import { getJwtSecret } from './config/secrets.js';

// ✅ Load environment variables
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

// ✅ App setup
const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = getJwtSecret();

// ✅ Create HTTP server
const server = createServer(app);

// ✅ Middleware - NO DUPLICATES
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/trade-in', tradeInRoutes);
app.use('/api/blogs', blogRoutes);
app.use('/api/wishlist', wishlistRoutes);
// ✅ Register New Routes
app.use('/api/brands', brandRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/size-guides', sizeGuideRoutes);
app.use('/api/orders', orderRoutes); // ✅ Use Order Routes
app.use('/api/notifications', notificationRoutes);
app.use('/api/products', productRoutes);
app.use('/api', authRoutes); // ✅ Use Auth Routes

// ✅ Socket.io setup
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

// ✅ Set global io - ONLY ONCE
global.io = io;

// ✅ Socket.io events
io.on('connection', (socket) => {
  console.log('✅ User connected:', socket.id);

  socket.on('joinUserRoom', (userId) => {
    socket.join(`user:${userId}`);
    console.log(`👤 User ${userId} joined their room`);
  });

  socket.on('joinAdminRoom', () => {
    socket.join('admin');
    console.log('👑 Admin joined admin room');
  });

  socket.on('disconnect', () => {
    console.log('❌ User disconnected:', socket.id);
  });
});

// ✅ Connect MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected successfully');
    console.log(`📊 Database: ${mongoose.connection.name}`);
    
    // Admin creation should be handled via script: npm run create:admin
    // await createDefaultAdmin(); 
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    console.error('💡 Check MONGODB_URI in .env file');
    process.exit(1);
  }
};

// ✅ Utility: Create slug
function createSlug(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

// ✅ Create default admin
const createDefaultAdmin = async () => {
  try {
    const adminEmail = 'admin@footmark.com';
    const existingAdmin = await User.findOne({ email: adminEmail });
    
    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await User.create({
        name: 'Admin',
        email: adminEmail,
        password: hashedPassword,
        role: 'admin'
      });
      console.log('✅ Default admin created');
      console.log('📧 Email: admin@footmark.com');
      console.log('🔐 Password: admin123');
      console.log('⚠️  Change password after login!');
    }
  } catch (error) {
    console.error('❌ Error creating admin:', error);
  }
};

// ✅ Connect database
connectDB();

// ✅ Mongoose events
mongoose.connection.on('disconnected', () => {
  console.log('⚠️ MongoDB disconnected');
});

mongoose.connection.on('reconnected', () => {
  console.log('✅ MongoDB reconnected');
});

// ============================================ 
// MIDDLEWARE
// ============================================ 

// ✅ Require admin
const requireAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user || user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access only'
      });
    }
    
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// ============================================ 
// ROUTES
// ============================================ 

// Health check
app.get('/', (req, res) => {
  res.json({
    message: '🚀 Server is running!',
    socketConnected: io ? true : false 
  }); 
});

// Admin verify
app.get('/api/admin/verify', authenticateToken, requireAdmin, (req, res) => {
  res.json({
    success: true, 
    user: {
      id: req.user.id,
      email: req.user.email,
      role: req.user.role
    }
  });
});

// ============================================ 
// AUTHROUTES (Moved to routes/auth.js)
// ============================================





// ============================================ 
// REVIEW ROUTES
// ============================================ 

// ✅ GET REVIEWS FOR A PRODUCT
app.get('/api/products/:productId/reviews', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.productId)) {
       return res.json({ success: true, reviews: [] });
    }
    const reviews = await Review.find({ productId: req.params.productId })
      .populate('userId', 'name avatar')
      .sort({ createdAt: -1 });
    res.json({ success: true, reviews });
  } catch (error) {
    console.error("Get Reviews Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ✅ CHECK IF USER CAN REVIEW
app.get('/api/products/:productId/can-review', authenticateToken, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.productId)) {
       return res.json({ canReview: false, reason: 'INVALID_ID' });
    }
    const userId = req.user.id;
    const productId = req.params.productId;

    // 1. Kiểm tra đã review chưa
    const existingReview = await Review.findOne({ userId, productId });
    if (existingReview) {
      return res.json({ canReview: false, reason: 'ALREADY_REVIEWED' });
    }

    // 2. Kiểm tra đã mua và đơn hàng hoàn thành chưa
    // Lưu ý: items.productId trong Order đang lưu ID hoặc slug tùy logic đặt hàng
    const completedOrder = await Order.findOne({
      userId,
      status: { $in: ['processing', 'shipped', 'delivered', 'completed'] }, // ✅ Allow reviewing sooner for testing
      'items.productId': productId
    });

    if (!completedOrder) {
      return res.json({ canReview: false, reason: 'NOT_PURCHASED' });
    }

    res.json({ canReview: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ✅ SUBMIT A REVIEW
app.post('/api/products/:productId/reviews', authenticateToken, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const productId = req.params.productId;
    const userId = req.user.id;

    // Re-validate purchase
    const completedOrder = await Order.findOne({
      userId,
      status: { $in: ['processing', 'shipped', 'delivered', 'completed'] },
      'items.productId': productId
    });

    if (!completedOrder) {
      return res.status(403).json({ success: false, message: 'Bạn cần hoàn thành đơn hàng để đánh giá' });
    }

    const review = await Review.create({
      userId,
      productId,
      rating,
      comment,
      isPurchased: true
    });

    // 🔔 Notify Admin via Socket.io
    const io = req.app.get('socketio');
    if (io) {
      const product = await Product.findById(productId);
      io.emit('newNotification', {
        type: 'review',
        message: `Đánh giá mới ${rating}⭐ cho sản phẩm ${product?.name || 'giày'}`,
        relatedId: productId,
        createdAt: new Date()
      });
    }

    res.status(201).json({ success: true, review });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Bạn đã đánh giá sản phẩm này rồi' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================ 
// USER ROUTES (Moved to routes/auth.js)
// ============================================



// ============================================ 
// ADDRESS ROUTES (Moved to routes/auth.js & routes/addresses.js)
// ============================================

// ============================================ 
// BANK ROUTES (Moved to routes/auth.js)
// ============================================

// ============================================ 
// ORDER ROUTES (Moved to routes/orders.js & routes/auth.js)
// ============================================

// ============================================ 
// PRODUCT ROUTES (PUBLIC)
// ============================================ 

// Routes are now handled by routes/products.js

// ============================================ 
// ADMIN PRODUCT ROUTES
// ============================================ 

// Get all products (admin)
app.get('/api/admin/products', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const products = await Product.find()
      .sort({ createdAt: -1, _id: -1 })
      .lean();
    
    res.json({
      success: true, 
      data: products,
      total: products.length
    });
  } catch (error) {
    console.error('❌ Error fetching products:', error);
    res.status(500).json({
      success: false, 
      message: error.message 
    });
  }
});

// Create product (admin)
app.post('/api/admin/products', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const {
      name, brand, slug, price, originalPrice, rating, description,
      categorySlug, stock, images, image, specs, soldCount,
      isNew, hasPromotion, featured, variants, tags
    } = req.body;

    if (!name || !price || !slug) {
      return res.status(400).json({
        success: false,
        message: 'Name, price, and slug are required'
      });
    }

    // Process images
    let processedImages = [];
    if (images && Array.isArray(images) && images.length > 0) {
      processedImages = images.map((img, index) => ({
        url: typeof img === 'string' ? img : img.url,
        alt: (typeof img === 'object' && img.alt) ? img.alt : name,
        isPrimary: index === 0 || (typeof img === 'object' && img.isPrimary) || false
      }));
    } else if (image) {
      processedImages = [{
        url: image,
        alt: name,
        isPrimary: true
      }];
    }

    // Process variants
    let processedVariants = [];
    if (variants && Array.isArray(variants) && variants.length > 0) {
      processedVariants = variants.map(variant => ({
        name: variant.name,
        options: variant.options.map(opt => ({
          name: opt.name,
          price: parseFloat(opt.price),
          stock: parseInt(opt.stock) || 0,
          sku: opt.sku || '',
          image: opt.image || ''
        }))
      }));
    }

    const productData = {
      name: name.trim(),
      brand: brand?.trim() || '',
      slug: slug.trim(),
      price: parseFloat(price),
      originalPrice: originalPrice ? parseFloat(originalPrice) : parseFloat(price),
      rating: rating || 5,
      description: description?.trim() || '',
      categorySlug: categorySlug?.trim() || '',
      stock: parseInt(stock) || 0,
      images: processedImages,
      image: processedImages.length > 0 ? processedImages[0].url : '',
      specs: specs || {},
      soldCount: soldCount || 0,
      isNew: isNew || false,
      hasPromotion: hasPromotion || false,
      featured: featured || false,
      tags: tags || [],
      variants: processedVariants
    };
    
    const product = await Product.create(productData);
    
    console.log('✅ Product created:', product.slug);
    
    res.status(201).json({
      success: true, 
      message: 'Product created successfully',
      data: product 
    });
    
  } catch (error) {
    console.error('❌ Error creating product:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false, 
        message: 'Slug already exists' 
      });
    }
    
    res.status(500).json({
      success: false, 
      message: error.message 
    });
  }
});

// Update product (admin)
app.put('/api/admin/products/:slug', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { 
      name, brand, slug, price, originalPrice, rating, description,
      categorySlug, stock, images, image, specs, soldCount,
      isNew, hasPromotion, featured, variants, tags
    } = req.body;

    // Process images
    let processedImages = [];
    if (images && Array.isArray(images) && images.length > 0) {
      processedImages = images.map((img, index) => ({
        url: typeof img === 'string' ? img : img.url,
        alt: (typeof img === 'object' && img.alt) ? img.alt : name,
        isPrimary: index === 0 || (typeof img === 'object' && img.isPrimary) || false
      }));
    } else if (image) {
      processedImages = [{
        url: image,
        alt: name,
        isPrimary: true
      }];
    }

    // Process variants
    let processedVariants = [];
    if (variants && Array.isArray(variants) && variants.length > 0) {
      processedVariants = variants.map(variant => ({
        name: variant.name,
        options: variant.options.map(opt => ({
          name: opt.name,
          price: parseFloat(opt.price),
          stock: parseInt(opt.stock) || 0,
          sku: opt.sku || '',
          image: opt.image || ''
        }))
      }));
    }

    const updateData = {
      name: name?.trim(),
      brand: brand?.trim(),
      slug: slug?.trim(),
      price: price ? parseFloat(price) : undefined,
      originalPrice: originalPrice ? parseFloat(originalPrice) : undefined,
      rating: rating || 5,
      description: description?.trim(),
      categorySlug: categorySlug?.trim(),
      stock: stock !== undefined ? parseInt(stock) : undefined,
      images: processedImages.length > 0 ? processedImages : undefined,
      image: processedImages.length > 0 ? processedImages[0].url : undefined,
      specs: specs,
      soldCount: soldCount,
      isNew: isNew,
      hasPromotion: hasPromotion,
      featured: featured,
      tags: tags,
      variants: processedVariants
    };

    Object.keys(updateData).forEach(key => 
      updateData[key] === undefined && delete updateData[key]
    );
    
    const product = await Product.findOneAndUpdate(
      { slug: req.params.slug },
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!product) {
      return res.status(404).json({
        success: false, 
        message: 'Product not found' 
      });
    }
    
    console.log('✅ Product updated:', product.slug);
    
    res.json({
      success: true,
      message: 'Product updated successfully',
      data: product 
    });
    
  } catch (error) {
    console.error('❌ Error updating product:', error);
    res.status(500).json({
      success: false, 
      message: error.message 
    });
  }
});

// Delete product (admin)
app.delete('/api/admin/products/:slug', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const product = await Product.findOneAndDelete({ slug: req.params.slug });
    
    if (!product) {
      return res.status(404).json({
        success: false, 
        message: 'Product not found' 
      });
    }
    
    console.log('🗑️ Product deleted:', product.slug);
    
    res.json({
      success: true, 
      message: 'Product deleted successfully' 
    });
    
  } catch (error) {
    console.error('❌ Error deleting product:', error);
    res.status(500).json({
      success: false, 
      message: error.message 
    });
  }
});

// ============================================ 
// CATEGORY ROUTES (PUBLIC)
// ============================================ 

// Get all categories (public)
app.get('/api/categories', async (req, res) => {
  try {
    const categories = await Category.find().sort({ createdAt: -1 });
    res.json(categories);
  } catch (error) {
    console.error('❌ Error fetching categories:', error);
    res.status(500).json({
      success: false, 
      message: error.message 
    });
  }
});

// Get category by slug (public)
app.get('/api/categories/:slug', async (req, res) => {
  try {
    const category = await Category.findOne({ slug: req.params.slug });
    
    if (!category) {
      return res.status(404).json({
        success: false, 
        error: 'Category not found'
      });
    }
    
    res.json({
      success: true,
      data: category
    });
    
  } catch (error) {
    console.error('❌ Error fetching category:', error);
    res.status(500).json({
      success: false, 
      message: error.message 
    });
  }
});

// ============================================ 
// ADMIN CATEGORY ROUTES
// ============================================ 

// Create category (admin)
app.post('/api/admin/categories', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { name, slug, description } = req.body;
    
    if (!name || name.trim() === '') {
      return res.status(400).json({
        success: false, 
        message: 'Name required' 
      });
    }

    const categorySlug = slug || createSlug(name);

    const existingCategory = await Category.findOne({ slug: categorySlug });
    
    if (existingCategory) {
      return res.status(400).json({
        success: false, 
        message: 'Category already exists' 
      });
    }
    
    const category = await Category.create({
      name: name.trim(), 
      slug: categorySlug,
      description: description?.trim() || '' 
    });
    
    console.log('✅ Category created:', category.slug);
    
    res.status(201).json({
      success: true, 
      message: 'Category created successfully',
      data: category 
    });
    
  } catch (error) {
    console.error('❌ Error creating category:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false, 
        message: 'Category already exists' 
      });
    }
    
    res.status(500).json({
      success: false, 
      message: error.message 
    });
  }
});

// Update category (admin)
app.put('/api/admin/categories/:slug', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { slug } = req.params;
    const { name, description } = req.body;
    
    if (!name || name.trim() === '') {
      return res.status(400).json({
        success: false, 
        message: 'Name required' 
      });
    }
    
    const category = await Category.findOne({ slug });
    
    if (!category) {
      return res.status(404).json({
        success: false, 
        message: 'Category not found' 
      });
    }
    
    const newSlug = createSlug(name);
    
    if (newSlug !== slug) {
      const existingCategory = await Category.findOne({ slug: newSlug });
      if (existingCategory) {
        return res.status(400).json({
          success: false, 
          message: 'Category name already exists' 
        });
      }
    }
    
    category.name = name.trim();
    category.slug = newSlug;
    category.description = description?.trim() || '';
    
    await category.save();
    
    console.log('✅ Category updated:', newSlug);
    
    res.json({
      success: true, 
      message: 'Category updated successfully',
      data: category 
    });
    
  } catch (error) {
    console.error('❌ Error updating category:', error);
    res.status(500).json({
      success: false, 
      message: error.message 
    });
  }
});

// Delete category (admin)
app.delete('/api/admin/categories/:slug', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { slug } = req.params;
    
    const result = await Category.deleteOne({ slug });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false, 
        message: 'Category not found' 
      });
    }
    
    console.log('🗑️ Category deleted:', slug);
    
    res.json({
      success: true, 
      message: 'Category deleted successfully' 
    });
    
  } catch (error) {
    console.error('❌ Error deleting category:', error);
    res.status(500).json({
      success: false, 
      message: error.message 
    });
  }
});

// ============================================ 
// UPLOADROUTES (ADMIN)
// ============================================ 

// Upload single image
app.post('/api/upload/single', authenticateToken, requireAdmin, uploadSingle, handleUploadError, (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }
    
    // Support both Cloudinary (req.file.path is URL) and Local (construct path)
    const fileUrl = (req.file.path && req.file.path.startsWith('http')) 
      ? req.file.path 
      : `/uploads/products/${req.file.filename}`;
    
    console.log('✅ Upload single image:', fileUrl);
    
    res.json({
      success: true,
      message: 'Image uploaded successfully',
      data: {
        url: fileUrl,
        filename: req.file.filename,
        size: req.file.size,
        mimetype: req.file.mimetype
      }
    });
  } catch (error) {
    console.error('❌ Upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Upload error: ' + error.message
    });
  }
});

// Upload multiple images
app.post('/api/upload/multiple', authenticateToken, requireAdmin, uploadMultiple, handleUploadError, (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }
    
    const fileUrls = req.files.map(file => ({
      url: (file.path && file.path.startsWith('http')) 
        ? file.path 
        : `/uploads/products/${file.filename}`,
      filename: file.filename,
      size: file.size,
      mimetype: file.mimetype
    }));
    
    console.log(`✅ Upload ${req.files.length} images`);
    
    res.json({
      success: true,
      message: `Uploaded ${req.files.length} images successfully`,
      data: fileUrls
    });
  } catch (error) {
    console.error('❌ Upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Upload error: ' + error.message
    });
  }
});

// Delete image
app.delete('/api/upload/:filename', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = `uploads/products/${filename}`;
    
    // Note: For Cloudinary, this simple filename delete might not work unless we store public_ids differently.
    // This maintains backward compatibility for local files.
    const deleted = await deleteFile(filePath);
    
    if (deleted) {
      res.json({
        success: true,
        message: 'Image deleted successfully'
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }
  } catch (error) {
    console.error('❌ Delete error:', error);
    res.status(500).json({
      success: false,
      message: 'Delete error: ' + error.message
    });
  }
});

// ============================================ 
// ADMIN ORDER ROUTES
// ============================================ 

// Get all orders (admin)
app.get('/api/admin/orders', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 50, status } = req.query;
    
    const query = {};
    if (status && ['pending', 'processing', 'shipped', 'delivered', 'cancelled'].includes(status)) {
      query.status = status;
    }
    
    const orders = await Order.find(query)
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .lean();
    
    const total = await Order.countDocuments(query);
    
    res.json({
      success: true,
      data: orders,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit))
      }
    });
    
  } catch (error) {
    console.error('❌ Error fetching orders:', error);
    res.status(500).json({
      success: false,
      message: 'Server error: ' + error.message
    });
  }
});

// Get order by ID (admin)
app.get('/api/admin/orders/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID'
      });
    }

    const order = await Order.findById(id)
      .populate('userId', 'name email')
      .lean();

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.json({
      success: true,
      order: order
    });

  } catch (error) {
    console.error('❌ Error fetching order:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Update order status (admin)
app.put('/api/admin/orders/:id/status', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID'
      });
    }
    
    const order = await Order.findById(id).populate('userId', 'name email');
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    order.status = status;

    if (status === 'delivered') {
      if (order.paymentStatus !== undefined) {
        order.paymentStatus = 'paid';
      }
      if (order.isPaid !== undefined) {
        order.isPaid = true;
      }
      console.log(`💳 Auto-paid for order #${order._id}`);
    }

    await order.save();

    // 🔔 Create Notification for User
    if (order.userId) {
      const NotificationModel = mongoose.model('Notification');
      const statusLabels = {
        'pending': 'Chờ xử lý',
        'processing': 'Đang chuẩn bị hàng',
        'shipped': 'Đang giao hàng',
        'delivered': 'Giao hàng thành công',
        'cancelled': 'Đã hủy'
      };

      await NotificationModel.create({
        user_id: order.userId._id,
        type: 'order',
        title: 'Cập nhật đơn hàng',
        message: `Đơn hàng #${order._id.toString().slice(-6).toUpperCase()} đã được cập nhật trạng thái: ${statusLabels[status] || status}`,
        referenceId: order._id,
        referenceModel: 'Order'
      });
    }
    
    if (global.io) {
      const updateData = {
        orderId: order._id,
        status: order.status,
        paymentStatus: order.paymentStatus || (order.isPaid ? 'paid' : 'unpaid'),
        isPaid: order.isPaid,
        order: order
      };

      if (order.userId) {
        global.io.to(`user:${order.userId._id}`).emit('orderStatusUpdated', updateData);
      }
      
      global.io.to('admin').emit('orderStatusUpdated', updateData);
    }
    
    res.json({
      success: true,
      message: status === 'delivered' 
        ? 'Status and payment updated' 
        : 'Status updated',
      order: order
    });
    
  } catch (error) {
    console.error('❌ Error updating order:', error);
    res.status(500).json({
      success: false,
      message: 'Server error: ' + error.message
    });
  }
});

// Delete order (admin)
app.delete('/api/admin/orders/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID'
      });
    }
    
    const order = await Order.findByIdAndDelete(id);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Order deleted successfully'
    });
    
  } catch (error) {
    console.error('❌ Error deleting order:', error);
    res.status(500).json({
      success: false,
      message: 'Server error: ' + error.message
    });
  }
});

// ============================================ 
// ADMIN CONTACT ROUTES
// ============================================ 

// Get all contacts (admin)
app.get('/api/admin/contacts', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 50, status } = req.query;
    
    const query = {};
    if (status && ['pending', 'replied', 'closed'].includes(status)) {
      query.status = status;
    }
    
    const contacts = await Contact.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await Contact.countDocuments(query);

    res.json({
      success: true,
      data: contacts,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('❌ Error fetching contacts:', error);
    res.status(500).json({
      success: false,
      error: 'Server error' 
    });
  }
});

// Update contact status (admin)
app.patch('/api/admin/contacts/:id/status', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'replied', 'closed'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status' 
      });
    }

    const contact = await Contact.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    );

    if (!contact) {
      return res.status(404).json({
        success: false,
        error: 'Contact not found' 
      });
    }

    res.json({
      success: true, 
      message: 'Status updated',
      data: contact 
    });

  } catch (error) {
    console.error('❌ Error updating contact:', error);
    res.status(500).json({
      success: false,
      error: 'Server error' 
    });
  }
});

// Reply to contact (admin)
app.post('/api/admin/contacts/:id/reply', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { replyMessage } = req.body;

    if (!replyMessage || replyMessage.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Reply message required' 
      });
    }

    const contact = await Contact.findById(id);

    if (!contact) {
      return res.status(404).json({
        success: false,
        error: 'Contact not found' 
      });
    }

    try {
      await sendReplyEmail(contact.email, contact.fullname, replyMessage);
      console.log(`📧 Reply email sent to ${contact.email}`);
    } catch (emailError) {
      console.error('⚠️ Email error:', emailError.message);
      return res.status(500).json({
        success: false,
        error: 'Failed to send email: ' + emailError.message 
      });
    }

    contact.status = 'replied';
    await contact.save();

    // 🔔 Create Notification for User if they exist
    const targetUser = await User.findOne({ email: contact.email.toLowerCase() });
    if (targetUser) {
      const NotificationModel = mongoose.model('Notification');
      await NotificationModel.create({
        user_id: targetUser._id,
        type: 'contact',
        title: 'Phản hồi liên hệ',
        message: `Admin đã phản hồi tin nhắn của bạn: "${replyMessage.substring(0, 50)}${replyMessage.length > 50 ? '...' : ''}"`,
        referenceId: contact._id,
        referenceModel: 'Contact'
      });

      // Emit socket event if user is online
      if (global.io) {
        global.io.to(`user:${targetUser._id}`).emit('newNotification', {
          type: 'contact',
          title: 'Phản hồi liên hệ',
          message: 'Admin đã phản hồi tin nhắn của bạn',
          createdAt: new Date()
        });
      }
    }

    res.json({
      success: true, 
      message: 'Reply sent successfully',
      data: contact 
    });

  } catch (error) {
    console.error('❌ Error sending reply:', error);
    res.status(500).json({
      success: false,
      error: 'Server error' 
    });
  }
});

// Delete contact (admin)
app.delete('/api/admin/contacts/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const contact = await Contact.findByIdAndDelete(id);

    if (!contact) {
      return res.status(404).json({
        success: false,
        error: 'Contact not found' 
      });
    }

    res.json({
      success: true, 
      message: 'Contact deleted',
      data: contact 
    });

  } catch (error) {
    console.error('❌ Error deleting contact:', error);
    res.status(500).json({
      success: false,
      error: 'Server error' 
    });
  }
});

// ============================================ 
// ADMIN USER ROUTES
// ============================================ 

// Get all users (admin)
app.get('/api/admin/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const users = await User.find({}, '-password').sort({ createdAt: -1 });
    
    res.json({
      success: true,
      total: users.length,
      data:users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error: ' + error.message
    });
  }
});

// Update user role (admin)
app.patch('/api/admin/users/:id/role', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { role } = req.body;
    
    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role'
      });
    }
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    console.log(`✅ Updated role for ${user.email} to ${role}`);
    
    res.json({
      success: true,
      message: 'Role updated',
      user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error: ' + error.message
    });
  }
});

// ============================================ 
// CONTACT ROUTES (PUBLIC)
// ============================================ 

// Submit contact (public)
app.post('/api/contacts', async (req, res) => {
  try {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        error: 'All fields required' 
      });
    }

    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email' 
      });
    }

    const newContact = new Contact({
      fullname: name,
      email: email.toLowerCase().trim(),
      message: message.trim()
    });

    await newContact.save();

    // 🔔 Notify Admin
    await createNotification('contact', `Liên hệ mới từ ${newContact.fullname}`, newContact._id, 'Contact');

    try {
      await sendNewContactEmail(newContact);
      console.log('📧 Contact email sent to admin');
    } catch (emailError) {
      console.error('⚠️ Email error:', emailError.message);
    }

    res.json({
      success: true, 
      message: "Thank you for contacting us!",
      contactId: newContact._id
    });

  } catch (error) {
    console.error("❌ Error saving contact:", error);
    res.status(500).json({
      success: false,
      error: 'Server error' 
    });
  }
});

// ============================================ 
// VOUCHERROUTES (PUBLIC)
// ============================================ 

// Get active vouchers
app.get('/api/vouchers', async (req, res) => {
  try {
    const currentDate = new Date();
    
    const vouchers = await Voucher.find({
      isActive: true,
      startDate: { $lte: currentDate },
      endDate: { $gte: currentDate }
    }).sort({ createdAt: -1 });

    res.json(vouchers);
  } catch (error) {
    console.error('❌ Error fetching vouchers:', error);
    res.status(500).json({
      success: false, 
      message: error.message 
    });
  }
});

// ============================================ 
// ORDER ROUTES (Moved to routes/orders.js & routes/auth.js)
// ============================================

// Use admin routes
app.use('/api/admin', adminRoutes);

// Use blog routes
app.use('/api/blogs', blogRoutes);

// ============================================ 
// ABOUT ROUTE (PUBLIC)
// ============================================ 

app.get('/api/about', (req, res) => {
  res.json({
    title: 'Về FootMark',
    description: 'FootMark là hệ thống bán lẻ giày sneakers và streetwear chính hãng uy tín với đa dạng các dòng sản phẩm từ New đến Secondhand tuyển chọn.',
    mission: 'Mang đến những đôi giày chất lượng và phong cách nhất cho cộng đồng yêu sneakers Việt Nam'
  });
});

// ✅ Start server
server.listen(PORT, () => {
  console.log(`\n🚀 Server is running on port ${PORT}`);
  console.log(`🔗 API URL: http://localhost:${PORT}`);
  console.log(`🔌 Socket.io is ready\n`);
});

export default app;

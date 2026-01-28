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
// Middleware
import { 
  uploadSingle, 
  uploadMultiple, 
  handleUploadError, 
  deleteFile 
} from './middleware/upload.js';

// Services
import { 
  sendNewOrderEmail, 
  sendNewContactEmail, 
  sendReplyEmail 
} from './services/emailService.js';

// Routes
import adminRoutes from './routes/admin.js';
import tradeInRoutes from './routes/tradeIn.js';
import blogRoutes from './routes/blog.js';

// ✅ Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), 'apps/api/.env') });

// ✅ App setup
const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'vinh-super-secret-key-2024-techstore-12345';

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
    
    await createDefaultAdmin();
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

// ✅ Authenticate token
const authenticateToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Token required'
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role
    };
    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      message: 'Invalid token'
    });
  }
};

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
// AUTHROUTES
// ============================================ 

// Register
app.post('/api/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'All fields required'
      });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const emailRegex = /^[^S@]+S[^S@]+S.[^S@]+$/;
    
    if (!emailRegex.test(trimmedEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email'
      });
    }

    if (password.trim().length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      });
    }

    const existingUser = await User.findOne({ email: trimmedEmail });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already in use'
      });
    }

    const hashedPassword = await bcrypt.hash(password.trim(), 10);

    const newUser = await User.create({
      name: name.trim(),
      email: trimmedEmail,
      password: hashedPassword,
      role: 'user'
    });

    const token = jwt.sign(
      {
        id: newUser._id, 
        email: newUser.email,
        role: newUser.role 
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role
      }
    });

  } catch (error) {
    console.error('❌ Register error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error: ' + error.message
    });
  }
});

// Login
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'All fields required'
      });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: trimmedEmail });
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const isPasswordValid = await bcrypt.compare(password.trim(), user.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const token = jwt.sign(
      {
        id: user._id, 
        email: user.email,
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error('❌ Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error: ' + error.message
    });
  }
});

// ✅ FORGOT PASSWORD
app.post('/api/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email required' });

    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Generate random 6-digit OTP
    const token = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Save to DB
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    // In thực tế sẽ dùng nodemailer gửi email
    // Ở đây chúng ta log ra console để test
    console.log(`\n📧 [EMAIL SERVICE] Reset Password OTP for ${email}: ${token}\n`);

    res.json({ success: true, message: 'OTP sent to your email' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ✅ RESET PASSWORD
app.post('/api/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ success: false, message: 'All fields required' });
    }

    const user = await User.findOne({
      email: email.trim().toLowerCase(),
      resetPasswordToken: otp,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword.trim(), 10);
    
    user.password = hashedPassword;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    res.json({ success: true, message: 'Password reset successful' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Logout
app.post('/api/logout', authenticateToken, async (req, res) => {
  try {
    console.log(`👋 User ${req.user.email} logged out`);
    
    res.json({
      success: true,
      message: 'Logout successful' 
    });
  } catch (error) {
    console.error('❌ Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Logout error: ' + error.message 
    });
  }
});

// ============================================ 
// USER ROUTES
// ============================================ 

// Get current user
app.get('/api/user/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false, 
        message: 'User not found' 
      });
    }
    
    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      address: user.address,
      city: user.city,
      district: user.district,
      ward: user.ward,
      role: user.role,
      addresses: user.addresses,
      bankAccounts: user.bankAccounts,
      createdAt: user.createdAt
    });
    
  } catch (error) {
    console.error('❌ Error getting user:', error);
    res.status(500).json({
      success: false, 
      message: 'Server error' 
    });
  }
});

// Update user info
app.put('/api/user/update', authenticateToken, async (req, res) => {
  try {
    const { 
      name, 
      phone, 
      address, 
      dateOfBirth, 
      gender, 
      city, 
      district, 
      ward,
      avatar 
    } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Name required'
      });
    }

    if (name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Name must be at least 2 characters'
      });
    }

    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.name = name.trim();
    user.phone = phone?.trim() || '';
    user.address = address?.trim() || '';
    user.dateOfBirth = dateOfBirth || '';
    user.gender = gender || '';
    user.city = city?.trim() || '';
    user.district = district?.trim() || '';
    user.ward = ward?.trim() || '';
    
    if (avatar !== undefined) {
      user.avatar = avatar;
    }

    await user.save();

    const updatedUser = {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      address: user.address,
      dateOfBirth: user.dateOfBirth,
      gender: user.gender,
      city: user.city,
      district: user.district,
      ward: user.ward,
      avatar: user.avatar,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };

    res.json({
      success: true,
      message: 'Profile updated',
      ...updatedUser
    });

  } catch (error) {
    console.error('❌ Error updating user:', error);
    res.status(500).json({
      success: false,
      message: 'Server error: ' + error.message
    });
  }
});

// ✅ CHANGE PASSWORD
app.put('/api/user/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Mật khẩu hiện tại không đúng' });
    }

    // Validate new password
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Mật khẩu mới phải có ít nhất 6 ký tự' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.json({ success: true, message: 'Đổi mật khẩu thành công' });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ✅ ADDRESS: ADD NEW
app.post('/api/user/addresses', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const newAddress = req.body; // { name, phone, city, district, ward, address, isDefault } 
    
    // Nếu là địa chỉ đầu tiên hoặc được set default -> Reset các default khác
    if (user.addresses.length === 0 || newAddress.isDefault) {
      user.addresses.forEach(a => a.isDefault = false);
      newAddress.isDefault = true;
      
      // Sync với thông tin gốc để Checkout hoạt động
      user.name = newAddress.name;
      user.phone = newAddress.phone;
      user.city = newAddress.city;
      user.district = newAddress.district;
      user.ward = newAddress.ward;
      user.address = newAddress.address;
    }

    user.addresses.push(newAddress);
    await user.save();

    res.json({ success: true, message: 'Thêm địa chỉ thành công', addresses: user.addresses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ✅ ADDRESS: SET DEFAULT
app.put('/api/user/addresses/:addressId/default', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const addressId = req.params.addressId;
    
    // Reset all defaults
    user.addresses.forEach(a => a.isDefault = false);
    
    // Set new default
    const addr = user.addresses.id(addressId);
    if (addr) {
      addr.isDefault = true;
      
      // Sync root fields
      user.name = addr.name;
      user.phone = addr.phone;
      user.city = addr.city;
      user.district = addr.district;
      user.ward = addr.ward;
      user.address = addr.address;
      
      await user.save();
      res.json({ success: true, message: 'Đã đặt làm mặc định', addresses: user.addresses });
    } else {
      res.status(404).json({ success: false, message: 'Không tìm thấy địa chỉ' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ✅ ADDRESS: DELETE
app.delete('/api/user/addresses/:addressId', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    user.addresses.pull(req.params.addressId);
    await user.save();
    res.json({ success: true, message: 'Đã xóa địa chỉ', addresses: user.addresses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ✅ BANK: ADD NEW
app.post('/api/user/banks', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const newBank = req.body;
    
    if (user.bankAccounts.length === 0) newBank.isDefault = true;
    
    user.bankAccounts.push(newBank);
    await user.save();
    res.json({ success: true, message: 'Thêm ngân hàng thành công', bankAccounts: user.bankAccounts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ✅ BANK: DELETE
app.delete('/api/user/banks/:bankId', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    user.bankAccounts.pull(req.params.bankId);
    await user.save();
    res.json({ success: true, message: 'Đã xóa tài khoản ngân hàng', bankAccounts: user.bankAccounts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get user orders
app.get('/api/user/orders', authenticateToken, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .lean();
    
    res.json({
      success: true,
      data: orders,
      total: orders.length
    });
    
  } catch (error) {
    console.error('❌ Error fetching orders:', error);
    res.status(500).json({
      success: false,
      message: 'Server error: ' + error.message
    });
  }
});

// ============================================ 
// PRODUCT ROUTES (PUBLIC)
// ============================================ 

// Get all products (public)
app.get('/api/products', async (req, res) => {
  try {
    const products = await Product.find()
      .sort({ createdAt: -1 })
      .lean();
    
    res.json({
      success: true, 
      data: products 
    });
  } catch (error) {
    console.error('❌ Error fetching products:', error);
    res.status(500).json({
      success: false, 
      message: error.message 
    });
  }
});

// Get product by slug (public)
app.get('/api/products/:slug', async (req, res) => {
  try {
    const product = await Product.findOne({ slug: req.params.slug });
    
    if (product) {
      res.json(product);
    } else {
      res.status(404).json({ error: 'Product not found' });
    }
  } catch (error) {
    console.error('❌ Error fetching product:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ============================================ 
// ADMIN PRODUCT ROUTES
// ============================================ 

// Get all products (admin)
app.get('/api/admin/products', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const products = await Product.find()
      .sort({ createdAt: -1 })
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
      isNew, hasPromotion, featured, variants
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
      isNew, hasPromotion, featured, variants
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
    
    const fileUrl = `/uploads/products/${req.file.filename}`;
    
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
      url: `/uploads/products/${file.filename}`,
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
app.delete('/api/upload/:filename', authenticateToken, requireAdmin, (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = `uploads/products/${filename}`;
    
    const deleted = deleteFile(filePath);
    
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
// ORDERROUTES (PUBLIC/USER)
// ============================================ 

// Create order
app.post('/api/orders', async (req, res) => {
  try {
    const orderData = req.body;

    if (!orderData.items || orderData.items.length === 0) {
      return res.status(400).json({
        success: false, 
        message: 'Order must have at least 1 item' 
      });
    }

    if (!orderData.customerInfo || !orderData.userId) {
      return res.status(400).json({
        success: false, 
        message: 'Missing customer info or userId' 
      });
    }

    // Check stock
    for (const item of orderData.items) {
      const product = await Product.findById(item.productId);
      
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product ${item.productId} not found`
        });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `"${product.name}" insufficient stock. Available: ${product.stock}, Required: ${item.quantity}`
        });
      }
    }

    // Update stock
    for (const item of orderData.items) {
      await Product.findByIdAndUpdate(
        item.productId,
        { $inc: { stock: -item.quantity } }
      );
    }

    const newOrder = new Order(orderData);
    const savedOrder = await newOrder.save();

    // ✅ Thông báo Socket cho Admin
    if (global.io) {
      global.io.to('admin').emit('newOrder', savedOrder);
      console.log('🚀 Socket: New order notification sent to admin');
    }

    try {
      await sendNewOrderEmail(savedOrder);
      console.log('📧 Order email sent to admin');
    } catch (emailError) {
      console.error('⚠️ Email error:', emailError.message);
    }

    res.status(201).json({
      success: true,
      message: 'Order created',
      order: savedOrder
    }); 

  } catch (error) {
    console.error('❌ Error creating order:', error);
    res.status(500).json({
      success: false,
      message: 'Server error: ' + error.message
    });
  }
});

// Get order by ID
app.get('/api/orders/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID'
      });
    }
    
    const order = await Order.findById(req.params.id).populate('userId', 'name email');
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    res.json({
      success: true,
      order
    });
    
  } catch (error) {
    console.error('❌ Error fetching order:', error);
    res.status(500).json({
      success: false,
      message: 'Server error: ' + error.message
    });
  }
});

// Cancel order (user)
app.put('/api/orders/:id/cancel', authenticateToken, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID'
      });
    }
    
    const { cancelReason } = req.body;
    const order = await Order.findById(req.params.id).populate('userId', 'name email');
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (order.userId._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    if (!['pending', 'processing'].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel order with status "${order.status}"`
      });
    }

    order.status = 'cancelled';
    order.cancelledAt = new Date();
    order.cancelledBy = 'user';
    order.cancelReason = cancelReason || 'No reason';

    // Restore stock
    for (const item of order.items) {
      await Product.findByIdAndUpdate(
        item.productId,
        { $inc: { stock: item.quantity } }
      );
    }

    await order.save();
    
    if (global.io) {
      const updateData = {
        orderId: order._id,
        status: 'cancelled',
        cancelledAt: order.cancelledAt,
        cancelledBy: 'user',
        cancelReason: order.cancelReason,
        order: order
      };

      global.io.to(`user:${req.user.id}`).emit('orderStatusUpdated', updateData);
      global.io.to('admin').emit('orderCancelled', {
        ...updateData,
        userName: order.userId.name
      });
    }
    
    res.json({
      success: true,
      message: 'Order cancelled',
      order: order
    });
    
  } catch (error) {
    console.error('❌ Error cancelling order:', error);
    res.status(500).json({
      success: false,
      message: 'Server error: ' + error.message
    });
  }
});

// Use admin routes
app.use('/api/admin', adminRoutes);

// Use blog routes
app.use('/api/blogs', blogRoutes);

// ============================================ 
// ABOUT ROUTE (PUBLIC)
// ============================================ 

app.get('/api/about', (req, res) => {
  res.json({
    title: 'Về TechStore',
    description: 'TechStore là cửa hàng công nghệ uy tín với hơn 10 năm kinh nghiệm trong ngành. Chúng tôi cung cấp các sản phẩm chất lượng cao với giá cả hợp lý.',
    mission: 'Mang đến những sản phẩm công nghệ tốt nhất cho người tiêu dùng Việt Nam'
  });
});

// ✅ Start server
server.listen(PORT, () => {
  console.log(`\n🚀 Server is running on port ${PORT}`);
  console.log(`🔗 API URL: http://localhost:${PORT}`);
  console.log(`🔌 Socket.io is ready\n`);
});

export default app;

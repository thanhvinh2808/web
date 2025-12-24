// backend/server.js
import express, { json } from 'express';
import cors from 'cors';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// kêt nói mongoDB
import mongoose from 'mongoose';
import dotenv from 'dotenv';
// 
import User from './models/User.js';
import Order from './models/Order.js';
import adminRoutes from './routes/admin.js';
import Product from './models/Product.js';
import Category from './models/Category.js';
import Contact from './models/Contact.js';
import { AwardIcon } from 'lucide-react';
import { Server } from 'socket.io';
import http from 'http';
import { sendNewOrderEmail, sendNewContactEmail, sendReplyEmail } from './services/emailService.js';
import { 
  uploadSingle, 
  uploadMultiple, 
  handleUploadError, 
  deleteFile 
} from './middleware/upload.js';
// ✅ Load biến môi trường từ file .env
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'vinh-super-secret-key-2024-techstore-12345';
const uri = "mongodb+srv://admin:vothanhvinh2808@atlascluster.gpdnuc9.mongodb.net/?appName=AtlasCluster";
const server = http.createServer(app);

// Middleware
app.use(cors());
app.use(json());
app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));
app.use('/api/uploads', express.static('uploads'));

// ✅ Socket.io với CORS
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
    allowedHeaders: ["*"]
  },
  transports: ['websocket', 'polling']
});

const connectedUsers = new Map();


global.io = io;

app.use(express.json());

// Socket.io connection
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

global.io = io;

// ✅ Kết nối MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected successfully');
    console.log(`📊 Database: ${mongoose.connection.name}`);
    
    // ✅ Tự động tạo admin mặc định nếu chưa có
    await createDefaultAdmin();
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    console.error('💡 Kiểm tra lại MONGODB_URI trong file .env');
    process.exit(1);
  }
};


// Thêm function này vào đầu file backend
function createSlug(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Bỏ dấu tiếng Việt
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '') // Chỉ giữ chữ, số, space, dấu gạch
    .trim()
    .replace(/\s+/g, '-') // Thay space bằng -
    .replace(/-+/g, '-'); // Loại bỏ -- liên tiếp
}
// ✅ HÀM TẠO ADMIN MẶC ĐỊNH
const createDefaultAdmin = async () => {
  try {
    const adminEmail = 'admin@techstore.com';
    const existingAdmin = await User.findOne({ email: adminEmail });
    
    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await User.create({
        name: 'Admin',
        email: adminEmail,
        password: hashedPassword,
        role: 'admin'
      });
      console.log('✅ Đã tạo tài khoản admin mặc định');
      console.log('📧 Email: admin@techstore.com');
      console.log('🔐 Password: admin123');
      console.log('⚠️  Hãy đổi mật khẩu ngay sau khi đăng nhập!');
    }
  } catch (error) {
    console.error('❌ Lỗi khi tạo admin:', error);
  }
};

// Kết nối database khi khởi động
connectDB();

// Xử lý khi mất kết nối
mongoose.connection.on('disconnected', () => {
  console.log('⚠️ MongoDB disconnected');
});

mongoose.connection.on('reconnected', () => {
  console.log('✅ MongoDB reconnected');
});

// Helper function to read JSON files
const readJSON = (filename) => {
  const filePath = join(__dirname, 'data', filename);
  try {
    const data = readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Lỗi khi đọc file ${filename}:`, error);
    return [];
  }
};

// ✅ MIDDLEWARE XÁC THỰC TOKEN
const authenticateToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Yêu cầu token xác thực'
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      message: 'Token không hợp lệ'
    });
  }
};

// ✅ MIDDLEWARE KIỂM TRA ADMIN
const requireAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user || user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Chỉ admin mới có quyền truy cập'
      });
    }
    
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Lỗi server'
    });
  }
};
const verifyAdmin = requireAdmin;
const authMiddleware = authenticateToken;
const isAdmin = requireAdmin;

// --- CÁC ROUTE (TUYẾN ĐƯỜNG) API ---
// ✅ Thêm endpoint verify cho admin
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



app.get('/', (req, res) => {
  res.json({ 
    message: '🚀 Server is running!',
    socketConnected: io ? true : false 
  }); 
});
app.use('/api/admin', adminRoutes);
const SERVER_PORT = process.env.PORT || 5000;
server.listen(SERVER_PORT, () => {
  console.log(`🚀 Server running on port ${SERVER_PORT}`);
  console.log(`🔌 Socket.io ready at http://localhost:${SERVER_PORT}`);
});
// 1. Route cho trang chủ
// Route lấy sản phẩm từ MongoDB
// Route lấy sản phẩm từ MongoDB cho trang chủ
// Route cho trang chủ - Lấy tất cả sản phẩm (không filter featured)
// Route lấy thông tin user hiện tại (dùng cho AuthContext)
app.get('/api/', authenticateToken, async (req, res) => {
  try {
     console.log('👤 GET /api/user/me - Fetching user info for:', req.user.email);
    const userId = req.user.id;
    
    const user = await User.findById(userId).select('-password');
    
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
      createdAt: user.createdAt
    });
    
  } catch (error) {
    console.error('❌ Error getting user info:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});
// ✅ CẬP NHẬT THÔNG TIN USER
app.put('/api/user/update', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
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

    console.log('🔄 Updating user info for:', req.user.email);
    console.log('📝 Update data:', { name, phone, city, district, ward });

    // ✅ Validate: name là required
    if (!name || name.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Tên không được để trống'
      });
    }

    // ✅ Validate name length
    if (name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Tên phải có ít nhất 2 ký tự'
      });
    }

    // ✅ Tìm user
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy user'
      });
    }

    // ✅ Cập nhật thông tin (chỉ các field được phép)
    user.name = name.trim();
    user.phone = phone?.trim() || '';
    user.address = address?.trim() || '';
    user.dateOfBirth = dateOfBirth || '';
    user.gender = gender || '';
    user.city = city?.trim() || '';
    user.district = district?.trim() || '';
    user.ward = ward?.trim() || '';
    
    // ✅ Chỉ update avatar nếu có (để tránh ghi đè)
    if (avatar !== undefined) {
      user.avatar = avatar;
    }

    // ✅ Lưu vào database
    await user.save();

    console.log('✅ User info updated successfully for:', user.email);

    // ✅ Trả về thông tin đã cập nhật (không bao gồm password)
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
      message: 'Cập nhật thông tin thành công',
      ...updatedUser // ✅ Trả về flat object để frontend dễ xử lý
    });

  } catch (error) {
    console.error('❌ Error updating user info:', error);
    
    // ✅ Xử lý lỗi validation từ Mongoose
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Dữ liệu không hợp lệ: ' + Object.values(error.errors).map(e => e.message).join(', ')
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi cập nhật thông tin: ' + error.message
    });
  }
});
app.post('/api/upload/single', authenticateToken, requireAdmin, uploadSingle, handleUploadError, (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Không có file nào được upload'
      });
    }
    
    const fileUrl = `/uploads/products/${req.file.filename}`;
    
    console.log('✅ Upload single image:', fileUrl);
    
    res.json({
      success: true,
      message: 'Upload ảnh thành công',
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
      message: 'Lỗi khi upload ảnh: ' + error.message
    });
  }
});

// 📤 Upload multiple images
app.post('/api/upload/multiple', authenticateToken, requireAdmin, uploadMultiple, handleUploadError, (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Không có file nào được upload'
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
      message: `Upload ${req.files.length} ảnh thành công`,
      data: fileUrls
    });
  } catch (error) {
    console.error('❌ Upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi upload ảnh: ' + error.message
    });
  }
});

// 🗑️ Xóa ảnh
app.delete('/api/upload/:filename', authenticateToken, requireAdmin, (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = `uploads/products/${filename}`;
    
    const deleted = deleteFile(filePath);
    
    if (deleted) {
      res.json({
        success: true,
        message: 'Xóa ảnh thành công'
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy file'
      });
    }
  } catch (error) {
    console.error('❌ Delete error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa ảnh: ' + error.message
    });
  }
});

app.get('/api/product', async (req, res) => {
  try {
    console.log('📦 GET /api/product - Fetching all products...');
    
    // ✅ Lấy TẤT CẢ sản phẩm (không filter featured)
    const products = await Product.find({})
      .sort({ createdAt: -1 })
      .lean(); // .lean() để tối ưu performance
    
    console.log(`✅ Found ${products.length} products`);

    // ✅ PHẢI CÓ return
    return res.json({
      success: true,
      total: products.length,
      featured: products  // ✅ Trả về tất cả sản phẩm trong key "featured"
    });
    
  } catch (error) {
    console.error('❌ Error fetching products:', error);
    
    // ✅ PHẢI CÓ return
    return res.status(500).json({ 
      success: false,
      error: 'Lỗi server khi lấy dữ liệu từ MongoDB',
      message: error.message
    });
  }
});
// 2. Routes cho Products
// GET - Lấy tất cả products
app.get('/api/admin/products', authenticateToken, requireAdmin, async (req, res) => {
  try {
    console.log('=== GET PRODUCTS REQUEST ===');
    console.log('User:', req.user);
    
    const products = await Product.find().sort({ createdAt: -1 });
    
    console.log('Found products:', products.length);
    
    res.json({ 
      success: true, 
      data: products 
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});
// Hoặc GET không cần authentication (cho public)
app.get('/api/products', async (req, res) => {
  try {
    // Query từ MongoDB (giống route admin)
    const products = await Product.find().sort({ createdAt: -1 });
    
    res.json({ success: true, data: products });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

app.get('/api/products/:slug', async (req, res) => {
  try {
    // Tìm product theo slug trong MongoDB
    const product = await Product.findOne({ slug: req.params.slug });
    
    if (product) {
      res.json(product);
    } else {
      res.status(404).json({ error: 'Không tìm thấy sản phẩm' });
    }
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Lỗi server khi lấy chi tiết sản phẩm' });
  }
});


app.get('/api/products/categories/:slug', (req, res) => {
  try {
    const products = readJSON('products.json');
    const categoryProducts = products.filter(p => p.categorySlug === req.params.slug);
    res.json(categoryProducts);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi server khi lọc sản phẩm theo danh mục' });
  }
});
//Create product
app.post('/api/admin/products', authenticateToken, requireAdmin, async (req, res) => {
  try {
    console.log('Creating product with variants:', req.body);
    
    const {
      name,
      brand,
      slug,
      price,
      originalPrice,
      rating,
      description,
      categorySlug,
      stock,
      images, // Array của images
      image, // Single image (backward compatible)
      specs,
      soldCount,
      isNew,
      hasPromotion,
      featured,
      variants // Array của variants
    } = req.body;

    // Validation
    if (!name || !price || !slug) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin bắt buộc (name, price, slug)'
      });
    }

    // Xử lý images
    let processedImages = [];
    
    if (images && Array.isArray(images) && images.length > 0) {
      // Nếu có array images
      processedImages = images.map((img, index) => ({
        url: typeof img === 'string' ? img : img.url,
        alt: (typeof img === 'object' && img.alt) ? img.alt : name,
        isPrimary: index === 0 || (typeof img === 'object' && img.isPrimary) || false
      }));
    } else if (image) {
      // Backward compatible: convert single image thành array
      processedImages = [{
        url: image,
        alt: name,
        isPrimary: true
      }];
    }

    // Xử lý variants
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

    // Tạo product data
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
    console.log('✅ Product created with', processedImages.length, 'images and', processedVariants.length, 'variants');
    
    res.status(201).json({ 
      success: true, 
      message: 'Tạo sản phẩm thành công',
      data: product 
    });
    
  } catch (error) {
    console.error('❌ Error creating product:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({ 
        success: false, 
        message: 'Slug đã tồn tại. Vui lòng chọn slug khác.' 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// UPDATE - Cập nhật sản phẩm
app.put('/api/admin/products/:slug', authenticateToken, requireAdmin, async (req, res) => {
  try {
    console.log('Updating product:', req.params.slug);
    console.log('Update data:', req.body);
    
    const { 
      name,
      brand,
      slug,
      price,
      originalPrice,
      rating,
      description,
      categorySlug,
      stock,
      images,
      image,
      specs,
      soldCount,
      isNew,
      hasPromotion,
      featured,
      variants
    } = req.body;

    // Xử lý images
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

    // Xử lý variants
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

    // Xóa các field undefined
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
        message: 'Không tìm thấy sản phẩm' 
      });
    }
    
    console.log('✅ Product updated successfully');
    res.json({ 
      success: true,
      message: 'Cập nhật sản phẩm thành công',
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

// DELETE - Xóa sản phẩm theo SLUG
app.delete('/api/admin/products/:slug', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const product = await Product.findOneAndDelete({ slug: req.params.slug });
    
    if (!product) {
      return res.status(404).json({ 
        success: false, 
        message: 'Không tìm thấy sản phẩm với slug này' 
      });
    }
    
    res.json({ success: true, message: 'Xóa sản phẩm thành công' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
// 3. Routes cho Categories
app.get('/api/categories', async (req, res) => {
  try {
    console.log('📦 GET /api/categories - Fetching from MongoDB...');
    const categories = await Category.find().sort({ createdAt: -1 });
    console.log('✅ Found', categories.length, 'categories');
    res.json(categories);
  } catch (error) {
    console.error('❌ Error fetching categories:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Lỗi server khi lấy danh sách danh mục',
      message: error.message 
    });
  }
});
//lấy danh mục theo slug
app.get('/api/categories/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    console.log('📦 GET /api/categories/:slug - Fetching category with slug:', slug);
    
    const category = await Category.findOne({ slug: slug });
    
    if (!category) {
      console.log('❌ Category not found with slug:', slug);
      return res.status(404).json({ 
        success: false, 
        error: 'Không tìm thấy danh mục',
        message: `Danh mục với slug "${slug}" không tồn tại`
      });
    }
    
    console.log('✅ Found category:', category.name);
    res.json({
      success: true,
      data: category
    });
    
  } catch (error) {
    console.error('❌ Error fetching category:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Lỗi server khi lấy danh mục',
      message: error.message 
    });
  }
});
// CREATE - Thêm danh mục mới
app.post('/api/admin/categories', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { name,slug, description } = req.body;
    
    // ✅ Validation: Kiểm tra name có tồn tại không
    if (!name || name.trim() === '') {
      return res.status(400).json({ 
        success: false, 
        message: 'Tên danh mục không được để trống' 
      });
    }
     const categorySlug = slug || name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[đĐ]/g, 'd')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
    // ✅ Kiểm tra danh mục đã tồn tại chưa (theo name)
    const existingCategory = await Category.findOne({ 
      slug: categorySlug
    });
    
    if (existingCategory) {
      return res.status(400).json({ 
        success: false, 
        message: 'Danh mục này đã tồn tại' 
      });
    }
    
    // ✅ Tạo danh mục mới
    const category = await Category.create({ 
      name: name.trim(), 
      slug: categorySlug,
      description: description?.trim() || '' 
    });
    
    console.log('✅ Tạo danh mục thành công:', category.slug);
    
    res.status(201).json({ // ✅ Dùng 201 cho CREATE
      success: true, 
      message: 'Tạo danh mục thành công',
      data: category 
    });
    
  } catch (error) {
    console.error('❌ Lỗi khi tạo danh mục:', error);
    
    // ✅ Xử lý lỗi duplicate key (nếu có unique constraint)
    if (error.code === 11000) {
      return res.status(400).json({ 
        success: false, 
        message: 'Danh mục đã tồn tại (trùng slug)' 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});
// UPDATE - Cập nhật danh mục theo SLUG
app.put('/api/admin/categories/:slug', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { slug } = req.params;
    const { name, description } = req.body;
    
    console.log('🔄 Updating category:', slug);
    
    if (!name || name.trim() === '') {
      return res.status(400).json({ 
        success: false, 
        message: 'Tên danh mục không được để trống' 
      });
    }
    
    // Tìm category
    const category = await Category.findOne({ slug });
    
    if (!category) {
      return res.status(404).json({ 
        success: false, 
        message: 'Không tìm thấy danh mục' 
      });
    }
    
    // Tạo slug mới nếu tên thay đổi
    const newSlug = name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[đĐ]/g, 'd')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
    
    // Kiểm tra slug mới có trùng không (nếu khác slug cũ)
    if (newSlug !== slug) {
      const existingCategory = await Category.findOne({ slug: newSlug });
      if (existingCategory) {
        return res.status(400).json({ 
          success: false, 
          message: 'Tên danh mục này đã tồn tại' 
        });
      }
    }
    
    // Update
    category.name = name.trim();
    category.slug = newSlug;
    category.description = description?.trim() || '';
    
    await category.save();
    
    console.log('✅ Updated category:', newSlug);
    
    res.json({ 
      success: true, 
      message: 'Cập nhật danh mục thành công',
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

// DELETE - Xóa danh mục theo SLUG
app.delete('/api/admin/categories/:slug', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { slug } = req.params;
    
    console.log('🗑️  Deleting category:', slug);
    
    // Xóa category
    const result = await Category.deleteOne({ slug });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Không tìm thấy danh mục' 
      });
    }
    
    console.log('✅ Deleted category:', slug);
    
    res.json({ 
      success: true, 
      message: 'Xóa danh mục thành công' 
    });
    
  } catch (error) {
    console.error('❌ Error deleting category:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});
// 4. Routes cho Blog
app.get('/api/blog', (req, res) => {
  try {
    const blogs = readJSON('blogs.json');
    res.json(blogs);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi server khi lấy Blog' });
  }
});

app.get('/api/blog/:slug', (req, res) => {
  try {
    const blogs = readJSON('blogs.json');
    const blog = blogs.find(b => b.slug === req.params.slug);
    if (blog) {
      res.json(blog);
    } else {
      res.status(404).json({ error: 'Không tìm thấy blog' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Lỗi server khi lấy chi tiết blog' });
  }
});

// 5. Routes cho About & Contact
app.get('/api/about', (req, res) => {
  try {
    const abouts = readJSON('abouts.json');
    res.json(abouts);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi server khi lấy thông tin giới thiệu' });
  }
});
// 📋 Lấy tất cả liên hệ (có phân trang và filter)
app.post('/api/admin/contacts', authenticateToken, requireAdmin, async (req, res) => {
  
  const { name, email, message } = req.body;
   
})

app.get('/api/admin/contacts', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 50, status } = req.query;
    
    // Build query
    const query = {};
    if (status && ['pending', 'replied', 'closed'].includes(status)) {
      query.status = status;
    }
    
    // Fetch contacts với phân trang
    const contacts = await Contact.find(query)
      .sort({ createdAt: -1 }) // Mới nhất trước
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    // Đếm tổng số
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
      error: 'Lỗi server khi lấy danh sách liên hệ' 
    });
  }
});

// 📊 Lấy thống kê liên hệ
app.get('/api/admin/contacts/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const stats = await Contact.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const result = {
      total: await Contact.countDocuments(),
      pending: 0,
      replied: 0,
      closed: 0
    };

    stats.forEach(stat => {
      result[stat._id] = stat.count;
    });

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('❌ Error fetching contact stats:', error);
    res.status(500).json({ 
      success: false,
      error: 'Lỗi server' 
    });
  }
});

// 🔍 Lấy chi tiết 1 liên hệ
app.get('/api/admin/contacts/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const contact = await Contact.findById(id);
    
    if (!contact) {
      return res.status(404).json({ 
        success: false,
        error: 'Không tìm thấy liên hệ' 
      });
    }

    res.json({
      success: true,
      data: contact
    });

  } catch (error) {
    console.error('❌ Error fetching contact:', error);
    res.status(500).json({ 
      success: false,
      error: 'Lỗi server' 
    });
  }
});

// ✏️ Cập nhật trạng thái liên hệ
app.patch('/api/admin/contacts/:id/status', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate status
    if (!['pending', 'replied', 'closed'].includes(status)) {
      return res.status(400).json({ 
        success: false,
        error: 'Trạng thái không hợp lệ. Chỉ chấp nhận: pending, replied, closed' 
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
        error: 'Không tìm thấy liên hệ' 
      });
    }

    res.json({ 
      success: true, 
      message: 'Cập nhật trạng thái thành công',
      data: contact 
    });

  } catch (error) {
    console.error('❌ Error updating contact status:', error);
    res.status(500).json({ 
      success: false,
      error: 'Lỗi server khi cập nhật trạng thái' 
    });
  }
});

// 🗑️ Xóa liên hệ
app.delete('/api/admin/contacts/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const contact = await Contact.findByIdAndDelete(id);

    if (!contact) {
      return res.status(404).json({ 
        success: false,
        error: 'Không tìm thấy liên hệ' 
      });
    }

    res.json({ 
      success: true, 
      message: 'Xóa liên hệ thành công',
      data: contact 
    });

  } catch (error) {
    console.error('❌ Error deleting contact:', error);
    res.status(500).json({ 
      success: false,
      error: 'Lỗi server khi xóa liên hệ' 
    });
  }
});

// 📧 Gửi email phản hồi (nếu bạn có email service)
app.post('/api/admin/contacts/:id/reply', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { replyMessage } = req.body;

    if (!replyMessage || replyMessage.trim() === '') {
      return res.status(400).json({ 
        success: false,
        error: 'Vui lòng nhập nội dung phản hồi' 
      });
    }

    const contact = await Contact.findById(id);

    if (!contact) {
      return res.status(404).json({ 
        success: false,
        error: 'Không tìm thấy liên hệ' 
      });
    }

    // ✅ GỬI EMAIL PHẢN HỒI CHO KHÁCH HÀNG
    try {
      await sendReplyEmail(contact.email, contact.fullname, replyMessage);
      console.log(`📧 Đã gửi email phản hồi cho ${contact.email}`);
    } catch (emailError) {
      console.error('⚠️ Không thể gửi email phản hồi:', emailError.message);
      return res.status(500).json({ 
        success: false,
        error: 'Không thể gửi email phản hồi: ' + emailError.message 
      });
    }

    // Cập nhật status thành replied
    contact.status = 'replied';
    await contact.save();

    res.json({ 
      success: true, 
      message: 'Gửi email phản hồi thành công',
      data: contact 
    });

  } catch (error) {
    console.error('❌ Error sending reply:', error);
    res.status(500).json({ 
      success: false,
      error: 'Lỗi server khi gửi phản hồi' 
    });
  }
});

// 🗑️ Xóa hàng loạt liên hệ
app.post('/api/admin/contacts/bulk-delete', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ 
        success: false,
        error: 'Danh sách ID không hợp lệ' 
      });
    }

    const result = await Contact.deleteMany({ _id: { $in: ids } });

    res.json({ 
      success: true, 
      message: `Đã xóa ${result.deletedCount} liên hệ`,
      deletedCount: result.deletedCount
    });

  } catch (error) {
    console.error('❌ Error bulk deleting contacts:', error);
    res.status(500).json({ 
      success: false,
      error: 'Lỗi server khi xóa hàng loạt' 
    });
  }
});

// ============================================
// API CHO NGƯỜI DÙNG - Gửi liên hệ
// ============================================

// 📮 Gửi liên hệ mới (không cần auth)
app.post('/api/contacts', async (req, res) => {
  try {
    const { name, email, message } = req.body;

    // Validation
    if (!name || !email || !message) {
      return res.status(400).json({ 
        success: false,
        error: 'Vui lòng điền đầy đủ thông tin' 
      });
    }

    // Validate email format
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        success: false,
        error: 'Email không hợp lệ' 
      });
    }

    // Tạo contact mới
    const newContact = new Contact({
      fullname: name,
      email: email.toLowerCase().trim(),
      message: message.trim()
    });

    // Lưu vào database
    await newContact.save();

    console.log("✅ Nhận liên hệ mới:", { 
      id: newContact._id,
      name, 
      email, 
      message 
    });

    // ✅ GỬI EMAIL CHO ADMIN
    try {
      await sendNewContactEmail(newContact);
      console.log('📧 Đã gửi email thông báo liên hệ cho admin');
    } catch (emailError) {
      console.error('⚠️ Không thể gửi email:', emailError.message);
      // Không throw error, vẫn trả về contact thành công
    }

    res.json({ 
      success: true, 
      message: "Cảm ơn bạn đã liên hệ! Chúng tôi sẽ phản hồi sớm nhất.",
      contactId: newContact._id
    });

  } catch (error) {
    console.error("❌ Lỗi khi lưu liên hệ:", error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        success: false,
        error: 'Dữ liệu không hợp lệ',
        details: Object.values(error.errors).map(e => e.message)
      });
    }

    res.status(500).json({ 
      success: false,
      error: 'Lỗi server khi gửi liên hệ' 
    });
  }
});

// 6. Routes cho FAQs
app.get('/api/faq', (req, res) => {
  try {
    const faqs = readJSON('faqs.json');
    res.json(faqs);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi server khi lấy danh sách FAQs' });
  }
});

// 7. Routes cho Cart (tạm thời vẫn dùng RAM)
let cart = [];

app.get('/api/cart', (req, res) => {
  res.json(cart);
});

app.post('/api/cart', (req, res) => {
  const product = req.body;
  cart.push(product);
  res.json({ success: true, cart });
});

// ✅ 8. ĐĂNG KÝ - Với MongoDB và Role
// ✅ 8. ĐĂNG KÝ - Với MongoDB và Role (Improved)
app.post('/api/register', async (req, res) => {
  try {
    console.log('📝 Register request:', req.body);
    
    const { name, email, password, role } = req.body;
    
    // ✅ Validate input
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng điền đầy đủ thông tin'
      });
    }

    // ✅ Trim và lowercase email
    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPassword = password.trim();

    // ✅ Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Email không hợp lệ'
      });
    }

    // ✅ Validate độ dài password
    if (trimmedPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu phải có ít nhất 6 ký tự'
      });
    }

    console.log('🔍 Checking email:', trimmedEmail);

    // ✅ Kiểm tra email đã tồn tại
    const existingUser = await User.findOne({ email: trimmedEmail });
    if (existingUser) {
      console.log('❌ Email đã tồn tại:', trimmedEmail);
      return res.status(400).json({
        success: false,
        message: 'Email đã được sử dụng'
      });
    }

    // ✅ Hash mật khẩu
    console.log('🔐 Hashing password...');
    const hashedPassword = await bcrypt.hash(trimmedPassword, 10);

    // ✅ Tạo user mới
    const newUser = await User.create({
      name: trimmedName,
      email: trimmedEmail,
      password: hashedPassword,
      role: role || 'user'
    });

    console.log('✅ User created:', { 
      id: newUser._id, 
      name: newUser.name, 
      email: newUser.email,
      role: newUser.role
    });

    // ✅ Tạo token ngay sau khi đăng ký
    const token = jwt.sign(
      { 
        id: newUser._id, 
        email: newUser.email,
        role: newUser.role 
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // ✅ Trả về token và user info
    return res.status(201).json({
      success: true,
      message: 'Đăng ký thành công',
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
    console.error('Error stack:', error.stack);
    
    // ✅ Xử lý lỗi duplicate email
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Email đã được sử dụng'
      });
    }
    
    // ✅ Xử lý lỗi validation từ Mongoose
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Dữ liệu không hợp lệ: ' + Object.values(error.errors).map(e => e.message).join(', ')
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'Lỗi server: ' + error.message
    });
  }
});

// ✅ 9. ĐĂNG NHẬP - Với MongoDB và Role
app.post('/api/login', async (req, res) => {
  try {
    console.log('🔐 Login request:', { email: req.body.email });
    
    const { email, password } = req.body;
    
    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng điền đầy đủ thông tin'
      });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPassword = password.trim();

    // ✅ Tìm user trong MongoDB
    const user = await User.findOne({ email: trimmedEmail });
    
    if (!user) {
      console.log('❌ Email không tồn tại:', trimmedEmail);
      return res.status(401).json({
        success: false,
        message: 'Email hoặc mật khẩu không đúng'
      });
    }

    // Kiểm tra mật khẩu
    console.log('🔐 Checking password...');
    const isPasswordValid = await bcrypt.compare(trimmedPassword, user.password);
    
    if (!isPasswordValid) {
      console.log('❌ Mật khẩu sai');
      return res.status(401).json({
        success: false,
        message: 'Email hoặc mật khẩu không đúng'
      });
    }

    // Tạo JWT token với role
    const token = jwt.sign(
      { 
        id: user._id, 
        email: user.email,
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: '15m' }
    );

    console.log('✅ Đăng nhập thành công:', user.role);

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
      message: 'Lỗi server: ' + error.message
    });
  }
});
// ✅ THÊM ROUTE LOGOUT Ở ĐÂY
app.post('/api/logout', authenticateToken, async (req, res) => {
  try {
    console.log(`👋 User ${req.user.email} logged out`);
    
    res.json({ 
      success: true,
      message: 'Đăng xuất thành công' 
    });
  } catch (error) {
    console.error('❌ Logout error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Lỗi khi đăng xuất: ' + error.message 
    });
  }
});

// ✅ 10. Health check - Kiểm tra kết nối MongoDB
app.get('/api/health', async (req, res) => {
  try {
    const userCount = await User.countDocuments();
    const users = await User.find({}, 'email name role createdAt').limit(10).sort({ createdAt: -1 });
    
    res.json({ 
      status: 'OK',
      mongodb: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
      database: mongoose.connection.name,
      users: userCount,
      recentUsers: users.map(u => ({
        email: u.email,
        name: u.name,
        role: u.role,
        createdAt: u.createdAt
      }))
    });
    if (pm.response.code === 200) {
    const jsonData = pm.response.json();
    pm.environment.set("token", jsonData.token);
    console.log("Token saved:", jsonData.token);
}
  } catch (error) {
    res.status(500).json({ 
      status: 'ERROR',
      mongodb: 'Disconnected',
      error: error.message 
    });
  }
});

// ✅ 11. ROUTE ADMIN - Lấy danh sách tất cả users (Chỉ admin)
app.get('/api/admin/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const users = await User.find({}, '-password').sort({ createdAt: -1 });
    
    res.json({
      success: true,
      total: users.length,
      users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server: ' + error.message
    });
  }
});

// ✅ 12. ROUTE ADMIN - Cập nhật role user (Chỉ admin)
app.patch('/api/admin/users/:id/role', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { role } = req.body;
    
    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Role không hợp lệ. Chỉ chấp nhận "user" hoặc "admin"'
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
        message: 'Không tìm thấy user'
      });
    }
    
    console.log(`✅ Đã cập nhật role cho ${user.email} thành ${role}`);
    
    res.json({
      success: true,
      message: 'Cập nhật role thành công',
      user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server: ' + error.message
    });
  }
});

// ✅ 13. Xóa tất cả users (CHỈ DÙNG CHO DEVELOPMENT)
app.delete('/api/users/reset', async (req, res) => {
  try {
    const result = await User.deleteMany({});
    console.log('🗑️ Đã xóa tất cả users:', result.deletedCount);
    res.json({ 
      success: true, 
      message: `Đã xóa ${result.deletedCount} users`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('❌ Error deleting users:', error);
    res.status(500).json({ 
      success: false,
      error: 'Lỗi khi xóa users: ' + error.message 
    });
  }
});

// ✅ 14. Lấy thông tin user theo ID
app.get('/api/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy user'
      });
    }
    
    res.json({
      success: true,
      user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server: ' + error.message
    });
  }
});

// ✅ 15. ROUTE TẠO ĐƠN HÀNG
app.post('/api/orders', async (req, res) => {
  try {
    const orderData = req.body;

    if (!orderData.items || orderData.items.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Đơn hàng phải có ít nhất 1 sản phẩm' 
      });
    }
    if (!orderData.customerInfo || !orderData.userId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Thiếu thông tin khách hàng hoặc userId' 
      });
    }

    // ✅ KIỂM TRA VÀ TRỪ STOCK TRƯỚC KHI TẠO ĐỚN
    for (const item of orderData.items) {
      const product = await Product.findById(item.productId);
      
      
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Không tìm thấy sản phẩm ${item.productId}`
        });
      }
      if (product.price !== item.price) {
        return res.status(400).json({
          success: false,
          message: `Sản phẩm "${product.name}" giá đã có thay đổi`
        });
      }
      if (product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Sản phẩm "${product.name}" không đủ hàng. Còn ${product.stock}, yêu cầu ${item.quantity}`
        });
      }
     
    }

    // ✅ TRỪ STOCK SAU KHI KIỂM TRA XONG
    for (const item of orderData.items) {
      await Product.findByIdAndUpdate(
        item.productId,
        { $inc: { stock: -item.quantity } }
      );
    }

    // Tạo đơn hàng
    const newOrder = new Order(orderData);
    const savedOrder = await newOrder.save();

    console.log('✅ Đơn hàng đã được tạo:', savedOrder._id || savedOrder.id);

    // ✅ GỬI EMAIL CHO ADMIN
    try {
      await sendNewOrderEmail(savedOrder);
      console.log('📧 Đã gửi email thông báo đơn hàng cho admin');
    } catch (emailError) {
      console.error('⚠️ Không thể gửi email:', emailError.message);
    }

    res.status(201).json({
      success: true,
      message: 'Đặt hàng thành công',
      order: savedOrder
    }); 

  } catch (error) {
    console.error('❌ Lỗi khi tạo đơn hàng:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi tạo đơn hàng: ' + error.message
    });
  }
});
// ✅ 16. LẤY CHI TIẾT ĐƠN HÀNG THEO ID (cho cả user và admin)
app.get('/api/orders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID đơn hàng không hợp lệ'
      });
    }
    
    const order = await Order.findById(id).populate('userId', 'name email');
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng'
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
      message: 'Lỗi server khi lấy đơn hàng: ' + error.message
    });
  }
});

// ✅ 17. CẬP NHẬT TRẠNG THÁI ĐƠN HÀNG (chỉ admin)
app.put('/api/admin/orders/:id/status', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID đơn hàng không hợp lệ'
      });
    }
    
    const order = await Order.findById(id).populate('userId', 'name email');
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng'
      });
    }

    order.status = status;

    // ✅ HỖ TRỢ CẢ 2: isPaid VÀ paymentStatus
    if (status === 'delivered') {
      // Nếu có paymentStatus field
      if (order.paymentStatus !== undefined) {
        order.paymentStatus = 'paid';
      }
      // Nếu có isPaid field (backward compatibility)
      if (order.isPaid !== undefined) {
        order.isPaid = true;
      }
      console.log(`💳 Tự động chuyển sang "Đã thanh toán" cho đơn hàng #${order._id}`);
    }

    await order.save();
    
    // Socket.io emit
    if (global.io) {
      const updateData = {
        orderId: order._id,
        status: order.status,
        // Gửi cả 2 để client tương thích
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
        ? 'Cập nhật trạng thái và thanh toán thành công' 
        : 'Cập nhật trạng thái thành công',
      order: order
    });
    
  } catch (error) {
    console.error('❌ Error updating order status:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server: ' + error.message
    });
  }
});
// ✅ 18. USER HỦY ĐƠN HÀNG (cập nhật)
app.put('/api/orders/:id/cancel', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId || req.user.id;
    const { cancelReason } = req.body; // ✅ Nhận cancelReason từ body
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID đơn hàng không hợp lệ'
      });
    }
    
    const order = await Order.findById(id).populate('userId', 'name email');
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng'
      });
    }

    if (order.userId._id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền hủy đơn hàng này'
      });
    }

    const allowedStatuses = ['pending', 'processing'];
    if (!allowedStatuses.includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: `Không thể hủy đơn hàng ở trạng thái "${order.status}". Chỉ có thể hủy đơn hàng đang chờ xử lý.`
      });
    }

    // ✅ Sử dụng method cancel từ model
    order.status = 'cancelled';
    order.cancelledAt = new Date();
    order.cancelledBy = 'user';
    order.cancelReason = cancelReason || 'Không có lý do'; // ✅ Lưu lý do hủy

    // Hoàn lại số lượng sản phẩm vào kho
    for (const item of order.items) {
      await Product.findByIdAndUpdate(
        item.productId,
        { $inc: { stock: item.quantity } }
      );
    }

    await order.save();
    
    console.log(`❌ User ${userId} đã hủy đơn hàng #${order._id} - Lý do: ${cancelReason}`);
    
    // Socket.io emit
    if (global.io) {
      const updateData = {
        orderId: order._id,
        status: 'cancelled',
        cancelledAt: order.cancelledAt,
        cancelledBy: 'user',
        cancelReason: order.cancelReason,
        order: order
      };

      global.io.to(`user:${userId}`).emit('orderStatusUpdated', updateData);
      global.io.to('admin').emit('orderCancelled', {
        ...updateData,
        userName: order.userId.name
      });
    }
    
    res.json({
      success: true,
      message: 'Đơn hàng đã được hủy thành công',
      order: order
    });
    
  } catch (error) {
    console.error('❌ Error cancelling order:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server: ' + error.message
    });
  }
});
// ✅ 18. LẤY TẤT CẢ ĐƠN HÀNG (chỉ admin)
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
      message: 'Lỗi server khi lấy danh sách đơn hàng: ' + error.message
    });
  }
});
// Lấy chi tiết một đơn hàng cụ thể
app.get('/api/admin/orders/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    console.log(`📦 Fetching admin order detail for ID: ${id}`);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID đơn hàng không hợp lệ'
      });
    }

    const order = await Order.findById(id)
      .populate('userId', 'name email')
      .lean();

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng với ID này.'
      });
    }

    console.log('✅ Admin order found');

    res.json({
      success: true,
      order: order
    });

  } catch (error) {
    console.error('❌ Error fetching admin order detail:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy chi tiết đơn hàng.'
    });
  }
});

// ✅ 19. LẤY ĐƠN HÀNG CỦA USER (cần authentication)
app.get('/api/user/orders', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const orders = await Order.find({ userId })
      .sort({ createdAt: -1 })
      .lean();
    
    res.json({
      success: true,
      data: orders,
      total: orders.length
    });
    
  } catch (error) {
    console.error('❌ Error fetching user orders:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy đơn hàng: ' + error.message
    });
  }
});

// ✅ 20. XÓA ĐƠN HÀNG (chỉ admin)
app.delete('/api/admin/orders/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID đơn hàng không hợp lệ'
      });
    }
    
    const order = await Order.findByIdAndDelete(id);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng'
      });
    }
    
    res.json({
      success: true,
      message: 'Xóa đơn hàng thành công'
    });
    
  } catch (error) {
    console.error('❌ Error deleting order:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi xóa đơn hàng: ' + error.message
    });
  }
});
// Thêm endpoint này để migrate data
app.get('/api/admin/migrate-categories', authenticateToken, requireAdmin, async (req, res) => {
  try {
    console.log('🔄 Fetching categories from MongoDB...');
    
    // Đọc categories từ MongoDB thay vì JSON
    const categoriesFromMongoDB = await Category.find().sort({ createdAt: -1 });
    console.log('📦 Found', categoriesFromMongoDB.length, 'categories in MongoDB');
    
    // Trả về danh sách categories
    res.json({ 
      success: true, 
      message: 'Fetched categories from MongoDB',
      data: categoriesFromMongoDB,
      total: categoriesFromMongoDB.length
    });
    
  } catch (error) {
    console.error('❌ Error fetching categories:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// --- KẾT THÚC CÁC ROUTE ---

// Xử lý lỗi 404
app.use((req, res) => {
  res.status(404).json({ error: 'Route không tồn tại' });
});

// Xử lý lỗi chung
app.use((err, req, res, next) => {
  console.error('❌ Server error:', err);
  res.status(500).json({ error: 'Lỗi server' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📁 Static files served from /uploads`);
  console.log(`🔐 Upload routes: /api/upload/single, /api/upload/multiple`);
});
// ✅ COMPLETE VERSION - server.js (With ALL Admin Routes)
// Load .env BEFORE any config/service imports (ES module hoisting)
import './env.js';

import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';

// Models
import User from './models/User.js';
import Order from './models/Order.js';
import Product from './models/Product.js';
import Brand from './models/Brand.js'; // ✅ Added
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
import { trackOrder } from './controller/orderController.js';

// ✅ Routes Imports
import authRoutes from './routes/auth.js'; 
import adminRoutes from './routes/admin.js';
import uploadRoutes from './routes/upload.js'; // ✅ Upload routes imported
import tradeInRoutes from './routes/tradeIn.js';
import blogRoutes from './routes/blog.js';
import wishlistRoutes from './routes/wishlist.js';
import brandRoutes from './routes/brands.js';
import categoryRoutes from './routes/categories.js';
import addressRoutes from './routes/addresses.js';
import sizeGuideRoutes from './routes/sizeGuides.js';
import orderRoutes from './routes/orders.js'; 
import notificationRoutes from './routes/notifications.js';
import productRoutes from './routes/products.js';
import vnpayRoutes from './routes/vnpay.js';
import chatRoutes from './routes/chat.js';

import { errorHandler, notFoundHandler } from './middleware/errorHandler.js'; // ✅ Added

import { getJwtSecret } from './config/secrets.js';
import { getVnpay } from './config/vnpay.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ App setup
const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = getJwtSecret();

// ✅ Create HTTP server
const server = createServer(app);

// ✅ CORS setup
const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001'
].filter(Boolean);

const isLocalOrigin = (origin) => {
  if (!origin) return false;
  try {
    const u = new URL(origin);
    return u.hostname === 'localhost' || u.hostname === '127.0.0.1';
  } catch {
    return false;
  }
};

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || isLocalOrigin(origin)) {
      callback(null, origin || true);
    } else {
      callback(null, true);
    }
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  credentials: true,
  optionsSuccessStatus: 204
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// ✅ Tĩnh (Static Files)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/uploads/products', express.static(path.join(__dirname, 'uploads/products')));

// ✅ Socket.io setup
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || isLocalOrigin(origin)) {
        callback(null, origin || true);
      } else {
        callback(null, true);
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

global.io = io;

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
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
};
connectDB();

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

// ✅ Middleware: Require admin
const requireAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access only' });
    }
    next();
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ============================================ 
// API ROUTES
// ============================================ 

app.get('/', (req, res) => {
  res.json({ message: '🚀 Server is running!', socketConnected: !!io }); 
});

// 1. Auth & Upload (Phải để lên đầu)
app.use('/api', authRoutes);
app.use('/api/upload', uploadRoutes); // ✅ Moved up for priority

// 2. Admin Routes
app.use('/api/admin', adminRoutes);
app.get('/api/admin/verify', authenticateToken, requireAdmin, (req, res) => {
  res.json({ success: true, user: { id: req.user.id, email: req.user.email, role: req.user.role } });
});

// 3. Feature Routes
app.use('/api/chat', chatRoutes);
app.use('/api/trade-in', tradeInRoutes);
app.use('/api/blogs', blogRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/brands', brandRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/user/addresses', addressRoutes);
app.use('/api/size-guides', sizeGuideRoutes);
app.use('/api/orders', orderRoutes); 
app.use('/api/notifications', notificationRoutes);
app.use('/api/products', productRoutes);
app.use('/api/vnpay', vnpayRoutes);

// 4. Other
app.get('/api/about', (req, res) => {
  res.json({
    title: 'Về FootMark',
    description: 'FootMark là hệ thống bán lẻ giày sneakers...',
  });
});

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
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/contacts', async (req, res) => {
  try {
    const { name, email, message } = req.body;
    const newContact = new Contact({ fullname: name, email: email.toLowerCase().trim(), message: message.trim() });
    await newContact.save();
    await createNotification('contact', `Liên hệ mới từ ${newContact.fullname}`, newContact._id, 'Contact');
    res.json({ success: true, message: "Thank you!" });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.get('/api/track-order/:orderNumber', trackOrder);

// ✅ 404 & Error Handler (Must be at the end)
app.use(notFoundHandler);
app.use(errorHandler);

// ✅ Start server
server.listen(PORT, () => {
  console.log(`\n🚀 Server is running on port ${PORT}`);
  console.log(`🔗 API URL: http://localhost:${PORT}\n`);
  getVnpay();
});

export default app;

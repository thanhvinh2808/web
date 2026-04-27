// ✅ FINAL OPTIMIZED VERSION - server.js
import './env.js';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';

// Models
import Voucher from './models/Voucher.js';
import Contact from './models/Contact.js';

// Middleware
import { authenticateToken } from './middleware/auth.js';
import { isAdmin } from './middleware/isAdmin.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

// ✅ Routes Imports
import authRoutes from './routes/auth.js'; 
import adminRoutes from './routes/admin.js';
import uploadRoutes from './routes/upload.js';
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

import { createNotification } from './controller/adminController.js';
import { trackOrder } from './controller/orderController.js';
import { getVnpay } from './config/vnpay.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
const server = createServer(app);

// ✅ CORS (Thoáng hơn để tránh lỗi 403 do CORS)
app.use(cors({
  origin: true, 
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// ✅ Tĩnh (Static Files) - FIX 404 IMAGES
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/uploads/products', express.static(path.join(__dirname, 'uploads/products')));
app.use('/uploads/profiles', express.static(path.join(__dirname, 'uploads/profiles')));

// ✅ Socket.io
const io = new Server(server, { cors: { origin: '*' } });
global.io = io;
io.on('connection', (socket) => {
  socket.on('joinUserRoom', (userId) => socket.join(`user:${userId}`));
  socket.on('joinAdminRoom', () => socket.join('admin'));
});

// ✅ Connect MongoDB
mongoose.connect(process.env.MONGODB_URI).then(() => console.log('✅ MongoDB connected'));

// ============================================ 
// API ROUTES
// ============================================ 

app.get('/', (req, res) => res.json({ status: 'running' }));

// 1. PUBLIC ROUTES
app.use('/api', authRoutes); // Login/Register
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/brands', brandRoutes);
app.use('/api/blogs', blogRoutes);
app.use('/api/size-guides', sizeGuideRoutes);
app.get('/api/track-order/:orderNumber', trackOrder);

// 2. USER PROTECTED ROUTES
app.use('/api/orders', authenticateToken, orderRoutes);
app.use('/api/wishlist', authenticateToken, wishlistRoutes);
app.use('/api/chat', authenticateToken, chatRoutes);
app.use('/api/trade-in', authenticateToken, tradeInRoutes);
app.use('/api/user/addresses', authenticateToken, addressRoutes);
app.use('/api/notifications', authenticateToken, notificationRoutes);
app.use('/api/upload', authenticateToken, uploadRoutes);
app.use('/api/vnpay', authenticateToken, vnpayRoutes);

// 3. ADMIN PROTECTED ROUTES - FIX 403
// Đảm bảo bọc toàn bộ group route admin bằng middleware
app.use('/api/admin', authenticateToken, isAdmin, adminRoutes);

// 4. OTHER
app.get('/api/vouchers', async (req, res) => {
  try {
    const vouchers = await Voucher.find({ isActive: true });
    res.json(vouchers);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/contacts', async (req, res) => {
  try {
    const newContact = new Contact(req.body);
    await newContact.save();
    createNotification('contact', `Liên hệ mới từ ${newContact.fullname}`, newContact._id, 'Contact');
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: 'Server error' }); }
});

app.use(notFoundHandler);
app.use(errorHandler);

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  getVnpay();
});

export default app;
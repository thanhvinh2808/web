import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { isAdmin } from '../middleware/isAdmin.js';
import adminBlogRoutes from './adminBlog.js'; 
import { uploadSingle, handleUploadError } from '../middleware/upload.js';

import {
  getDashboardStats,
  getAllUsers,
  updateUserRole,
  deleteUser,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  resetUserPassword,
  globalSearch,
  getRevenueStats,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead
} from '../controller/adminController.js';

import {
  approveCancelOrder,
  rejectCancelOrder
} from '../controller/orderController.js';
import {
  getAllVouchers,
  createVoucher,
  updateVoucher,
  deleteVoucher
} from '../controller/voucherController.js';

import {
  createCategory,
  updateCategory,
  deleteCategory
} from '../controller/categoryController.js';

import {
  getBrands,
  createBrand,
  updateBrand,
  deleteBrand
} from '../controller/brandController.js';

import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
} from '../controller/productController.js';

const router = express.Router();

// 🔒 Yêu cầu admin
router.use(authenticateToken);
router.use(isAdmin);

router.use('/blogs', adminBlogRoutes); 

// Verify
router.get('/verify', (req, res) => {
  res.json({ success: true, user: req.user });
});

// Dashboard
router.get('/stats', getDashboardStats);
router.get('/revenue', getRevenueStats);
router.get('/search', globalSearch);

// Users Management
router.get('/users', getAllUsers);
router.put('/users/:userId/role', updateUserRole);
router.delete('/users/:userId', deleteUser);
router.put('/users/:userId/password', resetUserPassword);

// Orders Management
router.get('/orders', getAllOrders);
router.get('/orders/:orderId', getOrderById);
router.put('/orders/:orderId/status', updateOrderStatus);
router.put('/orders/:id/approve-cancel', approveCancelOrder);
router.put('/orders/:id/reject-cancel', rejectCancelOrder);

// 🎫 Voucher Management
router.get('/vouchers', getAllVouchers);
router.post('/vouchers', createVoucher);
router.put('/vouchers/:id', updateVoucher);
router.delete('/vouchers/:id', deleteVoucher);

// 📂 Category Management
router.post('/categories', createCategory);
router.put('/categories/:slug', updateCategory);
router.delete('/categories/:slug', deleteCategory);

// 🏷️ Brand Management
router.get('/brands', getBrands);
router.post('/brands', createBrand);
router.put('/brands/:id', updateBrand);
router.delete('/brands/:id', deleteBrand);

// 👟 Product Management
router.get('/products', getProducts);
router.get('/products/:id', getProductById);
router.post('/products', createProduct);
router.put('/products/:id', updateProduct);
router.delete('/products/:id', deleteProduct);

// 📁 Upload Management (Direct for reliability)
router.post('/upload-single', uploadSingle, (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'Không có file được tải lên' });
  
  const fileUrl = (req.file.path && req.file.path.startsWith('http')) 
    ? req.file.path 
    : `/uploads/products/${req.file.filename}`;
    
  res.json({ 
    success: true, 
    data: { url: fileUrl, filename: req.file.filename } 
  });
}, handleUploadError);

// 🔔 Notifications
router.get('/notifications', getNotifications);
router.put('/notifications/read-all', markAllNotificationsRead);
router.put('/notifications/:id/read', markNotificationRead);

export default router;

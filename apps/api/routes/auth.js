import express from 'express';
import { 
  register, 
  login, 
  logout, 
  getMe, 
  updateProfile, 
  changePassword, 
  forgotPassword, 
  resetPassword 
} from '../controller/authController.js';
import * as addressController from '../controller/addressController.js';
import * as orderController from '../controller/orderController.js';
import { authenticateToken } from '../middleware/auth.js';
import User from '../models/User.js'; // Cho Bank (nếu chưa tách controller)

const router = express.Router();

// ============================
// AUTH ROUTES
// ============================
router.post('/register', register);
router.post('/login', login);
router.post('/logout', authenticateToken, logout);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// ============================
// USER PROFILE ROUTES
// ============================
router.get('/user/me', authenticateToken, getMe); 
router.put('/user/update', authenticateToken, updateProfile);
router.put('/user/change-password', authenticateToken, changePassword);

// ============================
// USER ADDRESS ROUTES
// ============================
// Frontend: /api/user/addresses
router.get('/user/addresses', authenticateToken, addressController.getAddresses);
router.post('/user/addresses', authenticateToken, addressController.addAddress);
router.put('/user/addresses/:id/default', authenticateToken, addressController.setDefaultAddress);
router.delete('/user/addresses/:id', authenticateToken, addressController.deleteAddress);

// ============================
// USER ORDER ROUTES
// ============================
// Frontend: /api/user/orders
router.get('/user/orders', authenticateToken, orderController.getUserOrders);

// ============================
// USER BANK ROUTES (Inline Logic tạm thời hoặc chuyển vào controller)
// ============================
// Frontend: /api/user/banks
router.post('/user/banks', authenticateToken, async (req, res) => {
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

router.delete('/user/banks/:bankId', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    user.bankAccounts.pull(req.params.bankId);
    await user.save();
    res.json({ success: true, message: 'Đã xóa tài khoản ngân hàng', bankAccounts: user.bankAccounts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});


// Verify token (Legacy support)
router.get('/verify-token', authenticateToken, getMe); 

export default router;
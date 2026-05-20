import express from 'express';
import { 
  register, 
  login, 
  logout, 
  getMe, 
  updateProfile, 
  changePassword, 
  forgotPassword, 
  resetPassword,
  googleLogin,
  addBankAccount,
  deleteBankAccount
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
router.post('/google-login', googleLogin);
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
// USER ORDER ROUTES
// ============================
router.get('/user/orders', authenticateToken, orderController.getUserOrders);

// ============================
// USER BANK ROUTES
// ============================
// Frontend: /api/user/banks
router.post('/user/banks', authenticateToken, addBankAccount);
router.delete('/user/banks/:bankId', authenticateToken, deleteBankAccount);


// Verify token (Legacy support)
router.get('/verify-token', authenticateToken, getMe); 

export default router;
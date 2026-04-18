import express from 'express';
const router = express.Router();
import { 
  getAllCategories, 
  createCategory, 
  updateCategory, 
  deleteCategory 
} from '../controller/categoryController.js';
import { authenticateToken } from '../middleware/auth.js';
import { isAdmin } from '../middleware/isAdmin.js';

// Public routes
router.get('/', getAllCategories);

// Admin routes
router.post('/admin', authenticateToken, isAdmin, createCategory);
router.put('/admin/:slug', authenticateToken, isAdmin, updateCategory);
router.delete('/admin/:slug', authenticateToken, isAdmin, deleteCategory);

export default router;

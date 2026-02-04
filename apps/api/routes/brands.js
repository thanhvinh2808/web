import express from 'express';
import * as brandController from '../controller/brandController.js';
import { authenticateToken } from '../middleware/auth.js';
import { isAdmin as requireAdmin } from '../middleware/isAdmin.js';

const router = express.Router();

// Public Routes
router.get('/', brandController.getBrands);
router.get('/:slug', brandController.getBrandBySlug);

// Admin Routes (Protected)
router.post('/', authenticateToken, requireAdmin, brandController.createBrand);
router.put('/:id', authenticateToken, requireAdmin, brandController.updateBrand);
router.delete('/:id', authenticateToken, requireAdmin, brandController.deleteBrand);

export default router;

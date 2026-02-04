import express from 'express';
import * as sizeGuideController from '../controller/sizeGuideController.js';
import { authenticateToken } from '../middleware/auth.js';
import { isAdmin as requireAdmin } from '../middleware/isAdmin.js';

const router = express.Router();

// Public: Lấy bảng size của brand
router.get('/:brandId', sizeGuideController.getSizeGuide);

// Admin: Tạo hoặc cập nhật bảng size
router.post('/', authenticateToken, requireAdmin, sizeGuideController.upsertSizeGuide);

export default router;

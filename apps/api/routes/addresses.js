import express from 'express';
import * as addressController from '../controller/addressController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Tất cả API Address đều cần đăng nhập
router.use(authenticateToken);

router.get('/', addressController.getAddresses);
router.post('/', addressController.addAddress);
router.put('/:id', addressController.updateAddress);
router.delete('/:id', addressController.deleteAddress);
router.put('/:id/default', addressController.setDefaultAddress);

export default router;

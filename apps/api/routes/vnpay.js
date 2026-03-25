import express from 'express';
import {
  createPaymentUrl,
  handleIpn,
  handleReturn,
} from '../controller/vnpayController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.post('/create-payment', authenticateToken, createPaymentUrl);

router.get('/ipn', handleIpn);

router.get('/return', handleReturn);

export default router;

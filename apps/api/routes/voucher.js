import express from 'express';
import Voucher from '../models/Voucher.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js'; // Sửa đường dẫn import

const router = express.Router();

// 1. GET ALL VALID VOUCHERS (Cho người dùng chọn)
router.get('/', async (req, res) => {
  try {
    const now = new Date();
    const vouchers = await Voucher.find({
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now },
      $expr: { $lt: ["$usedCount", "$usageLimit"] }
    }).sort({ endDate: 1 });

    res.json({ success: true, data: vouchers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 2. CHECK VOUCHER VALIDITY (Khi áp dụng)
router.post('/apply', async (req, res) => {
  try {
    const { code, orderTotal } = req.body;
    const voucher = await Voucher.findOne({ 
      code: code.toUpperCase(), 
      isActive: true 
    });

    if (!voucher) {
      return res.status(404).json({ success: false, message: 'Mã giảm giá không tồn tại' });
    }

    const now = new Date();
    if (now < new Date(voucher.startDate) || now > new Date(voucher.endDate)) {
      return res.status(400).json({ success: false, message: 'Mã giảm giá đã hết hạn' });
    }

    if (voucher.usedCount >= voucher.usageLimit) {
      return res.status(400).json({ success: false, message: 'Mã giảm giá đã hết lượt sử dụng' });
    }

    if (orderTotal < voucher.minOrderValue) {
      return res.status(400).json({ 
        success: false, 
        message: `Đơn hàng tối thiểu phải từ ${voucher.minOrderValue.toLocaleString('vi-VN')}₫` 
      });
    }

    // Tính toán số tiền giảm
    let discountAmount = 0;
    if (voucher.discountType === 'fixed') {
      discountAmount = voucher.discountValue;
    } else {
      discountAmount = (orderTotal * voucher.discountValue) / 100;
      if (voucher.maxDiscount > 0 && discountAmount > voucher.maxDiscount) {
        discountAmount = voucher.maxDiscount;
      }
    }

    res.json({
      success: true,
      data: {
        code: voucher.code,
        discountAmount: discountAmount,
        type: voucher.discountType
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 3. CREATE VOUCHER (Admin)
router.post('/admin', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const newVoucher = await Voucher.create(req.body);
    res.status(201).json({ success: true, data: newVoucher });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
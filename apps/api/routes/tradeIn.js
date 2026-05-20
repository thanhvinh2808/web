import express from 'express';
import TradeIn from '../models/TradeIn.js';
import Voucher from '../models/Voucher.js';
import User from '../models/User.js';
import { uploadMultiple } from '../middleware/upload.js';
import { sendTradeInUpdateEmail, sendTradeInVoucherEmail } from '../services/emailService.js';
import { authenticateToken } from '../middleware/auth.js';
import { isAdmin } from '../middleware/isAdmin.js';
import { createAdminNotification } from '../utils/helpers.js';
import crypto from 'crypto';

const router = express.Router();

// Tạo yêu cầu Trade-In mới (Có thể đặt khi chưa đăng nhập)
router.post('/', uploadMultiple, async (req, res) => {
  try {
    const { 
      name, phone, productName, brand, 
      condition, note, expectedPrice
    } = req.body;

    // Validation cơ bản
    if (!name || !phone || !productName || !brand || !condition) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng điền đầy đủ các trường bắt buộc'
      });
    }

    // Xử lý ảnh upload
    let imageUrls = [];
    if (req.files && req.files.length > 0) {
      imageUrls = req.files.map(file => 
        (file.path && file.path.startsWith('http')) 
          ? file.path 
          : `/uploads/products/${file.filename}`
      );
    }

    // Lấy userId từ token nếu user đã đăng nhập (không bắt buộc)
    const userId = req.user?.id || null;

    const newTradeIn = new TradeIn({
      userId,
      contactInfo: {
        name,
        phone,
      },
      description: `Ghi chú: ${note || ''}`,
      productName,
      brand,
      condition,
      images: imageUrls, 
      expectedPrice: Number(expectedPrice) || 0, 
      status: 'pending'
    });

    await newTradeIn.save();

    // ✅ Bắn socket cho Admin
    if (global.io) {
      global.io.to('admin').emit('newTradeIn', {
        id: newTradeIn._id,
        name,
        productName,
        brand,
        expectedPrice: Number(expectedPrice) || 0,
        createdAt: newTradeIn.createdAt
      });
    }

    // ✅ Tạo thông báo cho Admin
    await createAdminNotification({
      type: 'contact', 
      title: 'Yêu cầu Trade-In mới',
      message: `Khách hàng ${name} muốn đổi giày ${productName}. Giá mong muốn: ${Number(expectedPrice).toLocaleString()}₫`,
      referenceId: newTradeIn._id,
      referenceModel: 'TradeIn',
      userId: userId
    });

    res.status(201).json({
      success: true,
      message: 'Gửi yêu cầu thành công! Chúng tôi sẽ liên hệ sớm.',
      data: newTradeIn
    });

  } catch (error) {
    console.error('TradeIn Error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server: ' + error.message
    });
  }
});

// Lấy danh sách Trade-In của chính user hiện tại
router.get('/my-requests', authenticateToken, async (req, res) => {
    try {
        const items = await TradeIn.find({ userId: req.user.id })
            .sort({ createdAt: -1 });
        res.json({ success: true, data: items });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Lấy danh sách Trade-In (Admin Only)
router.get('/', authenticateToken, isAdmin, async (req, res) => {
    try {
        const items = await TradeIn.find()
            .populate('userId', 'name email')
            .sort({ createdAt: -1 });
        res.json({ success: true, data: items });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Admin trả lời / Cập nhật trạng thái
router.put('/:id/reply', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { status, finalPrice, adminNote } = req.body;

        const tradeIn = await TradeIn.findById(id).populate('userId', 'name email');
        if (!tradeIn) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy yêu cầu' });
        }

        const previousStatus = tradeIn.status;

        // Cập nhật thông tin
        if (status) tradeIn.status = status;
        if (finalPrice !== undefined) tradeIn.finalPrice = finalPrice;
        if (adminNote) tradeIn.adminNote = adminNote;

        await tradeIn.save();

        // ✅ REAL-TIME: Thông báo ngay cho khách hàng qua Socket
        if (global.io && tradeIn.userId) {
          global.io.to(`user:${tradeIn.userId._id || tradeIn.userId}`).emit('tradeInStatusUpdated', {
            id: tradeIn._id,
            status: tradeIn.status,
            finalPrice: tradeIn.finalPrice,
            adminNote: adminNote || tradeIn.adminNote,
            message: `Yêu cầu Trade-in của bạn đã được cập nhật: ${tradeIn.status.toUpperCase()}`
          });
        }

        // 🎟️ WOW FEATURE: TỰ ĐỘNG TẠO VOUCHER KHI TRADE-IN HOÀN TẤT
        let generatedVoucher = null;
        if (status === 'completed' && previousStatus !== 'completed' && tradeIn.finalPrice > 0) {
          try {
            const voucherCode = `FTM-TRADE-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
            const expiryDate = new Date();
            expiryDate.setDate(expiryDate.getDate() + 90); // Hiệu lực 90 ngày

            generatedVoucher = await Voucher.create({
              code: voucherCode,
              description: `Voucher Trade-In - Thu mua ${tradeIn.productName} (${tradeIn.brand})`,
              discountType: 'fixed',
              discountValue: tradeIn.finalPrice,
              maxDiscount: 0,
              minOrderValue: 0,
              startDate: new Date(),
              endDate: expiryDate,
              usageLimit: 1,          // Chỉ dùng được 1 lần
              usedCount: 0,
              isActive: true
            });

            // Gửi email voucher cho khách hàng
            if (tradeIn.userId?.email) {
              await sendTradeInVoucherEmail({
                toEmail: tradeIn.userId.email,
                customerName: tradeIn.userId.name || tradeIn.contactInfo?.name || 'Quý khách',
                voucherCode: generatedVoucher.code,
                voucherValue: generatedVoucher.discountValue,
                expiryDate: generatedVoucher.endDate,
                productName: tradeIn.productName
              });
            }

            console.log(`✅ [Trade-In] Tự động tạo Voucher ${voucherCode} (${tradeIn.finalPrice.toLocaleString()}đ) cho khách ${tradeIn.userId?.email}`);
          } catch (voucherErr) {
            console.error('⚠️ Lỗi tự động tạo voucher Trade-In:', voucherErr.message);
            // Không làm sập luồng chính nếu tạo voucher lỗi
          }
        }

        // Gửi email thông báo trạng thái thông thường
        try {
            if (tradeIn.userId && tradeIn.userId.email) {
                await sendTradeInUpdateEmail(tradeIn, adminNote);
            } else {
                console.log('⚠️ Không tìm thấy email user để gửi thông báo TradeIn');
            }
        } catch (emailErr) {
            console.error('⚠️ Gửi mail thất bại:', emailErr);
        }

        res.json({ 
            success: true, 
            message: status === 'completed' 
              ? `Đã hoàn tất Trade-In${generatedVoucher ? ` và tự động tạo Voucher ${generatedVoucher.code} cho khách!` : ''}` 
              : 'Đã cập nhật và gửi email cho khách',
            data: tradeIn,
            voucher: generatedVoucher ? {
              code: generatedVoucher.code,
              value: generatedVoucher.discountValue,
              expiryDate: generatedVoucher.endDate
            } : null
        });

    } catch (error) {
        console.error('TradeIn Update Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

export default router;
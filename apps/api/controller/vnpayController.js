import {
  ProductCode,
  VnpLocale,
  IpnFailChecksum,
  IpnOrderNotFound,
  IpnInvalidAmount,
  InpOrderAlreadyConfirmed,
  IpnUnknownError,
  IpnSuccess,
} from 'vnpay';
import { getVnpay } from '../config/vnpay.js';
import Order from '../models/Order.js';
import { createNotification } from './adminController.js';
import { sendNewOrderEmail } from '../services/emailService.js';

/**
 * POST /api/vnpay/create-payment
 * Generate VNPay payment URL for an existing order.
 * Body: { orderId }
 */
export const createPaymentUrl = async (req, res) => {
  try {
    const vnpay = getVnpay();
    if (!vnpay) {
      return res.status(503).json({
        success: false,
        message: 'VNPay chưa được cấu hình trên server',
      });
    }

    const { orderId } = req.body;
    if (!orderId) {
      return res.status(400).json({ success: false, message: 'Thiếu orderId' });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
    }

    if (order.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Không có quyền' });
    }

    if (order.paymentStatus === 'paid') {
      return res.status(400).json({ success: false, message: 'Đơn hàng đã được thanh toán' });
    }

    const clientIp =
      req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
      req.socket?.remoteAddress ||
      req.ip ||
      '127.0.0.1';

    // ✅ FIX: Dùng order._id làm txnRef chính (unique và không chứa ký tự đặc biệt)
    const txnRef = order._id.toString();

    const paymentUrl = vnpay.buildPaymentUrl({
      vnp_Amount: order.totalAmount,
      vnp_IpAddr: clientIp,
      vnp_TxnRef: txnRef,
      vnp_OrderInfo: `Thanh toan don hang ${order.orderNumber}`,
      vnp_OrderType: ProductCode.Other,
      vnp_ReturnUrl: process.env.VNPAY_RETURN_URL || 'http://localhost:3000/payment/vnpay-return',
      vnp_Locale: VnpLocale.VN,
    });

    return res.json({ success: true, paymentUrl });
  } catch (error) {
    console.error('❌ VNPay createPaymentUrl error:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/vnpay/ipn
 * VNPay server-to-server IPN callback. NO authentication.
 * This is the authoritative payment confirmation.
 */
export const handleIpn = async (req, res) => {
  try {
    const vnpay = getVnpay();
    if (!vnpay) {
      console.error('❌ VNPay IPN Error: VNPay config not found');
      return res.json(IpnUnknownError);
    }

    const verify = vnpay.verifyIpnCall(req.query);
    console.log('📡 VNPay IPN Received:', {
      txnRef: verify.vnp_TxnRef,
      amount: verify.vnp_Amount,
      isSuccess: verify.isSuccess,
      isVerified: verify.isVerified
    });

    if (!verify.isVerified) {
      console.error('❌ VNPay IPN Error: Invalid Checksum');
      return res.json(IpnFailChecksum);
    }

    if (!verify.isSuccess) {
      console.error('❌ VNPay IPN Error: Transaction Failed according to VNPay');
      return res.json(IpnUnknownError);
    }

    // ✅ FIX: txnRef bây giờ trực tiếp là order._id
    const orderId = verify.vnp_TxnRef;
    const order = await Order.findById(orderId);

    if (!order) {
      console.error(`❌ VNPay IPN Error: Order ${orderId} not found`);
      return res.json(IpnOrderNotFound);
    }

    // VNPay gửi vnp_Amount đã nhân 100, cần chia 100 để so sánh nếu library không tự làm
    // Tuy nhiên, vnpay-node library thường trả về giá trị thực tế nếu được cấu hình đúng.
    // Chúng ta kiểm tra giá trị vnp_Amount từ verify.
    if (verify.vnp_Amount !== order.totalAmount) {
      console.error(`❌ VNPay IPN Error: Invalid Amount. Expected ${order.totalAmount}, got ${verify.vnp_Amount}`);
      return res.json(IpnInvalidAmount);
    }

    if (order.paymentStatus === 'paid') {
      console.log(`ℹ️ VNPay IPN: Order ${order.orderNumber} already confirmed`);
      return res.json(InpOrderAlreadyConfirmed);
    }

    // Cập nhật trạng thái thanh toán
    order.paymentStatus = 'paid';
    order.isPaid = true;
    order.paidAt = new Date();
    order.vnpayTransactionId = verify.vnp_TransactionNo?.toString() || orderId;

    if (order.status === 'pending') {
      order.status = 'processing';
    }

    await order.save();

    // ✅ Gửi thông báo & Email
    if (typeof createNotification === 'function') {
        createNotification(
          'order',
          `Đơn hàng VNPay mới #${order._id.toString().slice(-6).toUpperCase()} - ${order.totalAmount.toLocaleString('vi-VN')}đ`,
          order._id,
          'Order'
        ).catch(err => console.error('Lỗi thông báo:', err));
    }

    sendNewOrderEmail(order).catch(err => console.error('Lỗi gửi email:', err));

    if (global.io) {
      const updateData = {
        orderId: order._id,
        status: order.status,
        paymentStatus: 'paid',
        isPaid: true,
      };
      global.io.to(`user:${order.userId}`).emit('orderStatusUpdated', updateData);
      global.io.to('admin').emit('orderStatusUpdated', updateData);
      global.io.to('admin').emit('newOrder', order);
    }

    console.log(`✅ VNPay IPN SUCCESS: Order ${order.orderNumber} updated to PAID`);
    return res.json(IpnSuccess);
  } catch (error) {
    console.error('❌ VNPay IPN Exception:', error.message);
    return res.json(IpnUnknownError);
  }
};

/**
 * GET /api/vnpay/return
 * Called when user is redirected back from VNPay.
 */
export const handleReturn = async (req, res) => {
  try {
    const vnpay = getVnpay();
    if (!vnpay) {
      return res.json({ success: false, message: 'VNPay chưa được cấu hình' });
    }

    const verify = vnpay.verifyReturnUrl(req.query);
    console.log('🔙 VNPay Return Received:', {
      txnRef: verify.vnp_TxnRef,
      isSuccess: verify.isSuccess
    });

    if (!verify.isVerified) {
      return res.json({
        success: false,
        message: 'Xác thực dữ liệu thất bại',
        isVerified: false,
      });
    }

    const orderId = verify.vnp_TxnRef;
    const order = await Order.findById(orderId);

    if (order && verify.isSuccess && order.paymentStatus !== 'paid') {
      order.paymentStatus = 'paid';
      order.isPaid = true;
      order.paidAt = new Date();
      order.vnpayTransactionId = verify.vnp_TransactionNo?.toString() || orderId;
      if (order.status === 'pending') order.status = 'processing';
      await order.save();

      console.log(`✅ VNPay Return: Order ${order.orderNumber} updated via Return URL`);

      if (typeof createNotification === 'function') {
        createNotification(
          'order',
          `Đơn hàng VNPay mới #${order._id.toString().slice(-6).toUpperCase()} - ${order.totalAmount.toLocaleString('vi-VN')}đ`,
          order._id,
          'Order'
        ).catch(err => console.error('Lỗi thông báo:', err));
      }
      sendNewOrderEmail(order).catch(err => console.error('Lỗi gửi email:', err));
      if (global.io) {
        const updateData = { orderId: order._id, status: order.status, paymentStatus: 'paid', isPaid: true };
        global.io.to(`user:${order.userId}`).emit('orderStatusUpdated', updateData);
        global.io.to('admin').emit('orderStatusUpdated', updateData);
        global.io.to('admin').emit('newOrder', order);
      }
    }

    return res.json({
      success: verify.isSuccess,
      isVerified: verify.isVerified,
      message: verify.isSuccess ? 'Thanh toán thành công' : 'Thanh toán thất bại',
      orderNumber: order?.orderNumber || 'N/A',
      orderId: order?._id || null,
      amount: verify.vnp_Amount,
      transactionNo: verify.vnp_TransactionNo,
      bankCode: verify.vnp_BankCode,
      payDate: verify.vnp_PayDate,
    });
  } catch (error) {
    console.error('❌ VNPay return error:', error.message);
    return res.json({ success: false, message: 'Lỗi xác thực thanh toán' });
  }
};

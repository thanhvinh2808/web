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

    const txnRef = `${order.orderNumber}-${Date.now()}`;

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
      return res.json(IpnUnknownError);
    }

    const verify = vnpay.verifyIpnCall(req.query);

    if (!verify.isVerified) {
      return res.json(IpnFailChecksum);
    }

    if (!verify.isSuccess) {
      return res.json(IpnUnknownError);
    }

    const txnRef = verify.vnp_TxnRef;
    const lastDash = txnRef.lastIndexOf('-');
    const orderNumber = txnRef.substring(0, lastDash);

    const order = await Order.findOne({ orderNumber });

    if (!order) {
      return res.json(IpnOrderNotFound);
    }

    if (verify.vnp_Amount !== order.totalAmount) {
      return res.json(IpnInvalidAmount);
    }

    if (order.paymentStatus === 'paid') {
      return res.json(InpOrderAlreadyConfirmed);
    }

    order.paymentStatus = 'paid';
    order.isPaid = true;
    order.paidAt = new Date();
    order.vnpayTransactionId = verify.vnp_TransactionNo?.toString() || txnRef;

    if (order.status === 'pending') {
      order.status = 'processing';
    }

    await order.save();

    if (global.io) {
      const updateData = {
        orderId: order._id,
        status: order.status,
        paymentStatus: order.paymentStatus,
        isPaid: true,
      };
      global.io.to(`user:${order.userId}`).emit('orderStatusUpdated', updateData);
      global.io.to('admin').emit('orderStatusUpdated', updateData);
    }

    console.log(`✅ VNPay IPN: Order ${order.orderNumber} paid successfully`);
    return res.json(IpnSuccess);
  } catch (error) {
    console.error('❌ VNPay IPN error:', error.message);
    return res.json(IpnUnknownError);
  }
};

/**
 * GET /api/vnpay/return
 * Called when user is redirected back from VNPay.
 * Verifies params and returns JSON result (UI-only, not authoritative).
 */
export const handleReturn = async (req, res) => {
  try {
    const vnpay = getVnpay();
    if (!vnpay) {
      return res.json({ success: false, message: 'VNPay chưa được cấu hình' });
    }

    const verify = vnpay.verifyReturnUrl(req.query);

    if (!verify.isVerified) {
      return res.json({
        success: false,
        message: 'Xác thực dữ liệu thất bại',
        isVerified: false,
      });
    }

    const txnRef = verify.vnp_TxnRef;
    const lastDash = txnRef.lastIndexOf('-');
    const orderNumber = txnRef.substring(0, lastDash);

    const order = await Order.findOne({ orderNumber }).lean();

    return res.json({
      success: verify.isSuccess,
      isVerified: verify.isVerified,
      message: verify.isSuccess ? 'Thanh toán thành công' : 'Thanh toán thất bại',
      orderNumber,
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

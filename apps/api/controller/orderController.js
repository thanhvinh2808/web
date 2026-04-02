import Order from '../models/Order.js';
import Product from '../models/Product.js';
import { createNotification } from './adminController.js';
import { sendNewOrderEmail } from '../services/emailService.js';
import mongoose from 'mongoose';
import { ProductCode, VnpLocale } from 'vnpay';
import { getVnpay } from '../config/vnpay.js';

/**
 * TẠO ĐƠN HÀNG (CREATE ORDER)
 * Quy trình: Xác minh giá -> Trừ kho Atomic -> Lưu đơn -> Rollback nếu lỗi
 * Có cơ chế Retry khi gặp Write Conflict (MongoDB Transaction)
 */
export const createOrder = async (req, res) => {
  const MAX_RETRIES = 3;
  let attempt = 0;

  while (attempt < MAX_RETRIES) {
    attempt++;
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const { items, customerInfo, paymentMethod, shippingFee, discountAmount, voucherCode, note } = req.body;

      if (!items || !Array.isArray(items) || items.length === 0) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ success: false, message: 'Giỏ hàng trống' });
      }

      const productIds = items.filter(i => i.productId).map(i => i.productId);
      const dbProducts = await Product.find({ _id: { $in: productIds } }).session(session);
      
      const trustedItems = [];
      let grandTotal = 0;

      // 1. XÁC MINH GIÁ & BIẾN THỂ
      for (const item of items) {
        if (!item.productId) continue;

        const product = dbProducts.find(p => p._id.toString() === item.productId.toString());
        if (!product) throw new Error(`Sản phẩm ${item.productId} không tồn tại.`);

        let selectedVariantName = null;
        const selectedOptions = {};

        if (item.variant && item.variant.name) {
          let optionFound = false;
          product.variants.forEach(v => {
            if (v.options.some(opt => opt.name === item.variant.name)) {
              selectedOptions[v.name] = item.variant.name;
              selectedVariantName = v.name;
              optionFound = true;
            }
          });
          
          if (!optionFound) {
            throw new Error(`Biến thể "${item.variant.name}" không hợp lệ cho sản phẩm "${product.name}".`);
          }
        }

        const price = product.calculatePrice(selectedOptions);
        const quantity = Math.max(1, parseInt(item.quantity) || 1);
        grandTotal += price * quantity;

        trustedItems.push({
          productId: product._id,
          productName: product.name,
          productImage: product.image,
          productBrand: product.brand,
          price,
          quantity,
          variant: item.variant?.name ? { name: item.variant.name } : undefined,
          variantGroupName: selectedVariantName
        });
      }

      const finalTotal = grandTotal + (parseInt(shippingFee) || 0) - (parseInt(discountAmount) || 0);

      // 2. TRỪ KHO ATOMIC
      for (const item of trustedItems) {
        let filter, update, arrayFilters = [];

        if (item.variant && item.variant.name) {
          filter = {
            _id: item.productId,
            'variants': {
              $elemMatch: {
                name: item.variantGroupName,
                'options.name': item.variant.name,
                'options.stock': { $gte: item.quantity }
              }
            }
          };
          update = {
            $inc: {
              'variants.$[var].options.$[opt].stock': -item.quantity,
              'variants.$[var].options.$[opt].soldCount': item.quantity,
              'soldCount': item.quantity
            }
          };
          arrayFilters = [
            { 'var.name': item.variantGroupName },
            { 'opt.name': item.variant.name }
          ];
        } else {
          filter = {
            _id: item.productId,
            stock: { $gte: item.quantity }
          };
          update = {
            $inc: { 
              stock: -item.quantity, 
              soldCount: item.quantity
            }
          };
        }

        const updatedProduct = await Product.findOneAndUpdate(filter, update, {
          arrayFilters,
          new: true,
          session
        });

        if (!updatedProduct) {
          throw new Error(`Sản phẩm "${item.productName}" (${item.variant?.name || 'Tiêu chuẩn'}) vừa hết hàng hoặc không đủ số lượng.`);
        }
      }

      // 3. LƯU ĐƠN HÀNG
      const finalOrderData = {
        customerInfo,
        paymentMethod,
        shippingFee,
        discountAmount,
        voucherCode,
        note,
        userId: req.user ? req.user.id : null,
        items: trustedItems.map(({ variantGroupName, ...rest }) => rest),
        totalAmount: Math.max(0, finalTotal),
        status: 'pending',
        paymentStatus: 'unpaid',
      };

      const [savedOrder] = await Order.create([finalOrderData], { session });

      // 4. XÁC NHẬN GIAO DỊCH
      await session.commitTransaction();
      session.endSession();

      // 5. XỬ LÝ SAU KHI ĐẶT HÀNG (Ngoài Transaction)
      if (savedOrder.paymentMethod === 'cod') {
        if (typeof createNotification === 'function') {
          createNotification('order', `Đơn hàng mới #${savedOrder._id.toString().slice(-6).toUpperCase()}`, savedOrder._id, 'Order').catch(() => {});
        }
        sendNewOrderEmail(savedOrder).catch(() => {});
        if (global.io) global.io.to('admin').emit('newOrder', savedOrder);
      }

      // VNPay Integration
      const vnpayInstance = getVnpay();
      if (savedOrder.paymentMethod === 'vnpay' && vnpayInstance) {
        const clientIp = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || '127.0.0.1';
        const paymentUrl = vnpayInstance.buildPaymentUrl({
          vnp_Amount: savedOrder.totalAmount,
          vnp_IpAddr: clientIp,
          vnp_TxnRef: `${savedOrder._id.toString()}`,
          vnp_OrderInfo: `Thanh toan don hang ${savedOrder.orderNumber}`,
          vnp_OrderType: ProductCode.Other,
          vnp_ReturnUrl: process.env.VNPAY_RETURN_URL || 'http://localhost:3000/payment/vnpay-return',
          vnp_Locale: VnpLocale.VN,
        });
        return res.status(201).json({ success: true, message: 'Đặt hàng thành công', order: savedOrder, paymentUrl });
      }

      return res.status(201).json({ success: true, message: 'Đặt hàng thành công', order: savedOrder });

    } catch (error) {
      await session.abortTransaction();
      session.endSession();

      const isTransientError = 
        error.hasErrorLabel && 
        (error.hasErrorLabel('TransientTransactionError') || error.hasErrorLabel('UnknownTransactionCommitResult'));
      
      const isWriteConflict = error.message.includes('Write conflict');

      if ((isTransientError || isWriteConflict) && attempt < MAX_RETRIES) {
        console.warn(`⚠️ Transaction retry attempt ${attempt}/${MAX_RETRIES} due to: ${error.message}`);
        await new Promise(resolve => setTimeout(resolve, 100 * attempt)); // Exponential backoff
        continue;
      }
      
      console.error('❌ Order Creation Failed:', error.message);
      return res.status(400).json({ success: false, message: error.message || 'Lỗi xử lý đơn hàng' });
    }
  }
};

/**
 * CẬP NHẬT TRẠNG THÁI ĐƠN HÀNG (ADMIN)
 */
export const updateOrderStatus = async (req, res) => {
  try {
    const { status, paymentStatus } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });

    const oldStatus = order.status;
    order.status = status || order.status;

    // Tự động cập nhật paymentStatus khi giao hàng thành công (COD)
    if (status === 'delivered' && order.paymentStatus === 'unpaid') {
      order.paymentStatus = 'paid';
      order.isPaid = true;
      order.paidAt = new Date();
    }

    if (paymentStatus) {
      order.paymentStatus = paymentStatus;
      if (paymentStatus === 'paid') {
        order.isPaid = true;
        order.paidAt = order.paidAt || new Date();
      }
    }

    await order.save();

    // Thông báo cho người dùng qua Socket
    if (global.io) {
      global.io.to(`user:${order.userId}`).emit('orderStatusUpdated', {
        orderId: order._id,
        status: order.status,
        paymentStatus: order.paymentStatus
      });
    }

    return res.json({ success: true, message: 'Cập nhật trạng thái thành công', order });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * TRA CỨU NHANH ĐƠN HÀNG (PUBLIC - Cho Chatbot)
 */
export const trackOrder = async (req, res) => {
  try {
    const { orderNumber } = req.params;
    if (!orderNumber) return res.status(400).json({ success: false, message: 'Thiếu mã đơn hàng' });

    const searchStr = orderNumber.toUpperCase();

    // Sử dụng aggregation để có thể search được 8 ký tự cuối của ID (chuyển ObjectId -> String)
    const results = await Order.aggregate([
      {
        $addFields: {
          idStr: { $toString: "$_id" }
        }
      },
      {
        $match: {
          $or: [
            { orderNumber: searchStr },
            { idStr: { $regex: orderNumber + '$', $options: 'i' } }, // Khớp 8 ký tự cuối
            { idStr: orderNumber.toLowerCase() } // Khớp toàn bộ ID
          ]
        }
      },
      {
        $project: {
          orderNumber: 1,
          status: 1,
          paymentStatus: 1,
          totalAmount: 1,
          customerInfo: 1,
          items: 1,
          createdAt: 1
        }
      },
      { $limit: 1 }
    ]);

    const order = results[0];

    if (!order) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
    }

    return res.json({
      success: true,
      data: {
        orderNumber: order.orderNumber || order._id.toString().slice(-8).toUpperCase(),
        status: order.status,
        paymentStatus: order.paymentStatus,
        totalAmount: order.totalAmount,
        customerName: order.customerInfo?.fullName || 'Khách hàng',
        itemCount: order.items?.length || 0,
        date: order.createdAt
      }
    });
  } catch (error) {
    console.error('Track Order Error:', error);
    return res.status(500).json({ success: false, message: 'Lỗi server khi tra cứu đơn hàng' });
  }
};

/**
 * LẤY DANH SÁCH ĐƠN HÀNG CỦA NGƯỜI DÙNG
 */
export const getUserOrders = async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .lean();

    return res.json({
      success: true,
      data: orders,
      total: orders.length,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Lỗi server: ' + error.message });
  }
};

/**
 * LẤY CHI TIẾT ĐƠN HÀNG
 */
export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('userId', 'name email');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
    }

    // Bảo mật: Chỉ chủ đơn hoặc Admin mới được xem
    if (req.user.role !== 'admin' && order.userId?._id.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Không có quyền truy cập' });
    }

    return res.json({ success: true, order });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Lỗi server: ' + error.message });
  }
};

/**
 * HỦY ĐƠN HÀNG (CÓ HOÀN KHO - TRANSACTIONAL)
 */
export const cancelOrder = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const { reason } = req.body;

    // 1. Tìm đơn hàng (Sử dụng session)
    const order = await Order.findOne({ _id: id, userId: req.user.id }).session(session);

    if (!order) {
      throw new Error('Không tìm thấy đơn hàng');
    }

    // Kiểm tra trạng thái có được phép hủy không
    const forbiddenStatuses = ['shipped', 'delivered', 'cancelled', 'completed'];
    if (forbiddenStatuses.includes(order.status)) {
      throw new Error(`Không thể hủy đơn hàng đang ở trạng thái: ${order.status}`);
    }

    // 2. HOÀN KHO ATOMIC (Chạy trong Transaction)
    if (order.items && order.items.length > 0) {
      for (const item of order.items) {
        let filter, update, arrayFilters = [];

        if (item.variant && item.variant.name) {
          // Hoàn kho cho sản phẩm có Variant
          // Chúng ta dùng $[var] và $[opt] để xác định chính xác option trong variant
          filter = { _id: item.productId };
          update = {
            $inc: {
              'variants.$[var].options.$[opt].stock': item.quantity,
              'variants.$[].options.$[opt].soldCount': -item.quantity
            }
          };
          // Vì khi lưu đơn ta đã lưu variant.name, ta sẽ tìm option có name đó trong bất kỳ variant group nào
          arrayFilters = [
            { 'var.options.name': item.variant.name },
            { 'opt.name': item.variant.name }
          ];
        } else {
          // Hoàn kho cho sản phẩm đơn giản
          filter = { _id: item.productId };
          update = {
            $inc: { stock: item.quantity, soldCount: -item.quantity }
          };
        }

        const result = await Product.updateOne(filter, update, { arrayFilters, session });
        
        if (result.matchedCount === 0) {
          console.warn(`Cảnh báo: Không tìm thấy sản phẩm ${item.productId} để hoàn kho.`);
        }
      }
    }

    // 3. Cập nhật trạng thái đơn hàng
    order.status = 'cancelled';
    order.cancelReason = reason || 'Người dùng hủy';
    await order.save({ session });

    // 4. Xác nhận Transaction
    await session.commitTransaction();
    session.endSession();

    // Thông báo cho Admin qua Socket
    if (global.io) {
      global.io.to('admin').emit('orderStatusUpdated', { 
        orderId: order._id, 
        status: 'cancelled',
        message: `Đơn hàng #${order._id.toString().slice(-6).toUpperCase()} đã bị hủy`
      });
    }

    return res.json({ success: true, message: 'Hủy đơn hàng và hoàn kho thành công', order });

  } catch (error) {
    // Rollback nếu có lỗi
    await session.abortTransaction();
    session.endSession();
    
    console.error('❌ Cancel Order Error:', error.message);
    return res.status(400).json({ success: false, message: error.message || 'Lỗi khi hủy đơn hàng' });
  }
};

/**
 * ĐÁNH DẤU ĐÃ THANH TOÁN (MARK AS PAID)
 */
export const markOrderAsPaid = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });

    if (order.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Không có quyền thực hiện' });
    }

    if (order.paymentStatus === 'paid') {
      return res.status(400).json({ success: false, message: 'Đơn hàng đã được thanh toán' });
    }

    order.paymentStatus = 'paid';
    order.isPaid = true;
    order.paidAt = new Date();

    if (order.status === 'pending') order.status = 'processing';

    await order.save();

    // ✅ CHỈ GỬI THÔNG BÁO CHO ADMIN & EMAIL CHO KHÁCH SAU KHI ĐÃ THANH TOÁN XONG (Đối với Banking/VNPay)
    if (order.paymentMethod !== 'cod') {
        if (typeof createNotification === 'function') {
            createNotification(
              'order',
              `Đơn hàng mới đã thanh toán #${order._id.toString().slice(-6).toUpperCase()} - ${order.totalAmount.toLocaleString('vi-VN')}đ`,
              order._id,
              'Order'
            ).catch(err => console.error('Lỗi thông báo:', err));
        }
    
        sendNewOrderEmail(order).catch(err => console.error('Lỗi gửi email:', err));
        
        if (global.io) {
            global.io.to('admin').emit('newOrder', order);
        }
    }

    // Thông báo cho người dùng qua Socket
    if (global.io) {
      const updateData = {
        orderId: order._id,
        status: order.status,
        paymentStatus: order.paymentStatus,
        isPaid: true
      };
      global.io.to(`user:${order.userId}`).emit('orderStatusUpdated', updateData);
      global.io.to('admin').emit('orderStatusUpdated', updateData);
    }

    return res.json({ success: true, message: 'Thanh toán thành công', order });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Lỗi server: ' + error.message });
  }
};
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Voucher from '../models/Voucher.js';
import { createNotification } from './adminController.js';
import { createAdminNotification } from '../utils/helpers.js';
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

        // Ưu tiên lấy ảnh của biến thể nếu có, nếu không lấy ảnh chính của sản phẩm
        let displayImage = product.image;
        if (item.variant && item.variant.name) {
          product.variants.forEach(v => {
            const opt = v.options.find(o => o.name === item.variant.name);
            if (opt && opt.image) {
              displayImage = opt.image;
            }
          });
        }

        // CHUẨN HÓA ĐƯỜNG DẪN ẢNH (Đảm bảo luôn có prefix nếu là file nội bộ)
        if (displayImage && !displayImage.startsWith('http') && !displayImage.startsWith('/uploads')) {
          displayImage = `/uploads/products/${displayImage}`;
        }

        trustedItems.push({
          productId: product._id,
          productName: product.name,
          productImage: displayImage,
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

      // 4. CẬP NHẬT LƯỢT DÙNG VOUCHER (NẾU CÓ)
      if (voucherCode) {
        const updatedVoucher = await Voucher.findOneAndUpdate(
          { 
            code: voucherCode.toUpperCase(),
            isActive: true,
            endDate: { $gte: new Date() }
          },
          { $inc: { usedCount: 1 } },
          { session, new: true }
        );

        if (!updatedVoucher) {
          throw new Error('Mã giảm giá không hợp lệ hoặc đã hết hạn.');
        }

        if (updatedVoucher.usedCount > updatedVoucher.usageLimit) {
          throw new Error('Mã giảm giá đã hết lượt sử dụng.');
        }
      }

      // 5. XÁC NHẬN GIAO DỊCH
      await session.commitTransaction();
      session.endSession();

      // 6. XỬ LÝ SAU KHI ĐẶT HÀNG (Ngoài Transaction)
      if (savedOrder.paymentMethod === 'cod') {
        createAdminNotification({
          type: 'order',
          title: 'Đơn hàng mới (COD)',
          message: `Đơn hàng #${savedOrder._id.toString().slice(-6).toUpperCase()} - ${savedOrder.totalAmount.toLocaleString('vi-VN')}₫`,
          referenceId: savedOrder._id,
          referenceModel: 'Order',
          userId: savedOrder.userId
        }).catch(() => {});

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

    // ✅ FOOTMARK: Admin không được phép hủy đơn hàng của khách
    if (status === 'cancelled' && req.user?.role === 'admin') {
       return res.status(403).json({ 
          success: false, 
          message: 'Admin không được phép hủy đơn hàng của khách.' 
       });
    }

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

    // Bảo mật
    if (req.user.role !== 'admin' && order.userId?._id.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Không có quyền truy cập' });
    }

    return res.json({ success: true, order });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Lỗi server: ' + error.message });
  }
};

/**
 * YÊU CẦU HỦY ĐƠN HÀNG (USER)
 */
export const requestCancelOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const order = await Order.findOne({ _id: id, userId: req.user.id });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
    }

    const cancellableStatuses = ['pending', 'processing'];
    if (!cancellableStatuses.includes(order.status)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Đơn hàng đã được giao hoặc đang vận chuyển, không thể yêu cầu hủy.' 
      });
    }

    order.status = 'cancellation_requested';
    order.cancelReason = reason || 'Người dùng yêu cầu hủy';
    order.cancelledBy = 'user';
    await order.save();

    // 1. LƯU THÔNG BÁO VÀO DATABASE CHO ADMIN
    await createNotification(
      'order', 
      `Đơn hàng #${order.orderNumber} có yêu cầu hủy mới. Lý do: ${order.cancelReason}`,
      order._id,
      'Order',
      'Yêu cầu hủy đơn hàng'
    );

    // 2. SOCKET REAL-TIME (Dành cho UI cập nhật trạng thái đơn)
    if (global.io) {
      global.io.to('admin').emit('orderStatusUpdated', { 
        orderId: order._id, 
        status: 'cancellation_requested',
        message: `Yêu cầu hủy mới cho đơn hàng #${order.orderNumber}`
      });
    }

    return res.json({ 
      success: true, 
      message: 'Đã gửi yêu cầu hủy đơn hàng. Vui lòng chờ Admin xác nhận.', 
      order 
    });

  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * ADMIN DUYỆT HỦY ĐƠN HÀNG (ADMIN)
 */
export const approveCancelOrder = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const order = await Order.findById(id).session(session);

    if (!order) {
      throw new Error('Không tìm thấy đơn hàng');
    }

    if (order.status !== 'cancellation_requested') {
      throw new Error('Đơn hàng không ở trong trạng thái yêu cầu hủy');
    }

    // 1. HOÀN KHO ATOMIC
    if (order.items && order.items.length > 0) {
      for (const item of order.items) {
        let filter, update, arrayFilters = [];

        if (item.variant && item.variant.name) {
          filter = { _id: item.productId };
          update = {
            $inc: {
              'variants.$[var].options.$[opt].stock': item.quantity,
              'variants.$[].options.$[opt].soldCount': -item.quantity
            }
          };
          arrayFilters = [
            { 'var.options.name': item.variant.name },
            { 'opt.name': item.variant.name }
          ];
        } else {
          filter = { _id: item.productId };
          update = {
            $inc: { stock: item.quantity, soldCount: -item.quantity }
          };
        }

        await Product.updateOne(filter, update, { arrayFilters, session });
      }
    }

    // 2. Cập nhật trạng thái cuối (Logic chính theo yêu cầu)
    // Nếu đơn đó đã chuyển khoản (isPaid) thì hãy để là đã hoàn tiền (refunded) 
    // Còn nếu chưa chuyển khoản thì chỉ để đã hủy (cancelled) thoi
    if (order.isPaid || order.paymentStatus === 'paid') {
      order.status = 'refunded';
    } else {
      order.status = 'cancelled';
    }

    // 3. HOÀN LẠI LƯỢT DÙNG VOUCHER (NẾU CÓ)
    if (order.voucherCode) {
      await Voucher.findOneAndUpdate(
        { code: order.voucherCode.toUpperCase() },
        { $inc: { usedCount: -1 } },
        { session }
      );
    }

    order.cancelledAt = new Date();
    await order.save({ session });

    await session.commitTransaction();
    session.endSession();

    // Thông báo cho User
    if (global.io) {
      global.io.to(`user:${order.userId}`).emit('orderStatusUpdated', { 
        orderId: order._id, 
        status: order.status,
        message: `Đơn hàng #${order.orderNumber} đã được Admin duyệt hủy.`
      });
    }

    return res.json({ success: true, message: 'Đã duyệt hủy đơn hàng và hoàn kho.', order });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    return res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * ADMIN TỪ CHỐI HỦY ĐƠN HÀNG (ADMIN)
 */
export const rejectCancelOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
    }

    if (order.status !== 'cancellation_requested') {
      return res.status(400).json({ success: false, message: 'Đơn hàng không yêu cầu hủy' });
    }

    // Quay lại trạng thái đang xử lý
    order.status = 'processing';
    await order.save();

    // Thông báo cho User
    if (global.io) {
      global.io.to(`user:${order.userId}`).emit('orderStatusUpdated', { 
        orderId: order._id, 
        status: 'processing',
        message: `Yêu cầu hủy đơn hàng #${order.orderNumber} đã bị từ chối.`
      });
    }

    return res.json({ success: true, message: 'Đã từ chối yêu cầu hủy đơn hàng.', order });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
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
        createAdminNotification({
          type: 'order',
          title: 'Đơn hàng mới đã thanh toán',
          message: `Đơn hàng #${order._id.toString().slice(-6).toUpperCase()} đã thanh toán thành công - ${order.totalAmount.toLocaleString('vi-VN')}₫`,
          referenceId: order._id,
          referenceModel: 'Order',
          userId: order.userId
        }).catch(() => {});
    
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
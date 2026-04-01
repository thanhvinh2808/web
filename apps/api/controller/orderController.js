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
 */
export const createOrder = async (req, res) => {
  const processedItems = []; // Danh sách để rollback nếu có lỗi xảy ra giữa chừng

  try {
    const { items, ...orderInfo } = req.body;

    // 1. Kiểm tra đầu vào
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Giỏ hàng trống' });
    }

    const trustedItems = [];
    let grandTotal = 0;

    // 2. XÁC MINH GIÁ (Zero Trust Price Verification)
    for (const item of items) {
      if (!item.productId) continue;

      const product = await Product.findById(item.productId);
      if (!product) {
        throw new Error(`Sản phẩm ${item.productId} không tồn tại.`);
      }

      // Xác định các option được chọn để tính giá chuẩn từ Server
      const selectedOptions = {};
      if (item.variant && item.variant.name) {
        // Tìm xem option name này thuộc Variant nào trong DB
        let optionFound = false;
        product.variants.forEach(v => {
          if (v.options.some(opt => opt.name === item.variant.name)) {
            selectedOptions[v.name] = item.variant.name;
            optionFound = true;
          }
        });
        
        if (!optionFound) {
          throw new Error(`Biến thể "${item.variant.name}" không hợp lệ cho sản phẩm "${product.name}".`);
        }
      }

      // Tính giá cuối cùng (Base + Surcharges) từ Model
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
        selectedOptions // Lưu trữ để phục vụ logic trừ kho
      });
    }

    // 3. TRỪ KHO ATOMIC (Atomic Stock Deduction)
    for (const item of trustedItems) {
      let filter, update, arrayFilters = [];

      if (item.variant && item.variant.name) {
        // Trừ kho cho sản phẩm có Variant
        filter = {
          _id: item.productId,
          'variants.options': {
            $elemMatch: {
              name: item.variant.name,
              stock: { $gte: item.quantity } // Đảm bảo đủ hàng ở cấp độ option
            }
          }
        };
        update = {
          $inc: {
            'variants.$[].options.$[opt].stock': -item.quantity,
            'variants.$[].options.$[opt].soldCount': item.quantity
          }
        };
        arrayFilters = [{ 'opt.name': item.variant.name }];
      } else {
        // Trừ kho cho sản phẩm đơn giản
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
        runValidators: true
      });

      if (!updatedProduct) {
        throw new Error(`Sản phẩm "${item.productName}" (${item.variant?.name || 'Tiêu chuẩn'}) không đủ số lượng tồn kho.`);
      }

      // Đánh dấu đã trừ kho thành công để rollback nếu cần
      processedItems.push(item);
    }

    // 4. LƯU ĐƠN HÀNG
    const finalOrderData = {
      ...orderInfo,
      userId: req.user ? req.user.id : null,
      items: trustedItems.map(({ selectedOptions, ...rest }) => rest), // Loại bỏ dữ liệu thừa
      totalAmount: grandTotal,
      status: 'pending',
      paymentStatus: 'unpaid',
    };

    const savedOrder = await Order.create(finalOrderData);

    // 5. XỬ LÝ SAU KHI ĐẶT HÀNG (Thông báo, Email...)
    // ✅ CHỈ GỬI THÔNG BÁO NGAY NẾU LÀ COD (Thanh toán khi nhận hàng)
    // Đối với Banking/VNPay, sẽ gửi sau khi markOrderAsPaid được gọi (khi tiền đã vào)
    if (savedOrder.paymentMethod === 'cod') {
      if (typeof createNotification === 'function') {
        createNotification(
          'order',
          `Đơn hàng mới #${savedOrder._id.toString().slice(-6).toUpperCase()} - ${grandTotal.toLocaleString('vi-VN')}đ`,
          savedOrder._id,
          'Order'
        ).catch(err => console.error('Lỗi thông báo:', err));
      }

      sendNewOrderEmail(savedOrder).catch(err => console.error('Lỗi gửi email:', err));

      if (global.io) {
        global.io.to('admin').emit('newOrder', savedOrder);
      }
    }

    // 6. VNPay: generate payment URL if paymentMethod is vnpay
    const vnpayInstance = getVnpay();
    if (savedOrder.paymentMethod === 'vnpay' && vnpayInstance) {
      const clientIp =
        req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
        req.socket?.remoteAddress ||
        req.ip ||
        '127.0.0.1';

      const txnRef = `${savedOrder.orderNumber}-${Date.now()}`;

      const paymentUrl = vnpayInstance.buildPaymentUrl({
        vnp_Amount: savedOrder.totalAmount,
        vnp_IpAddr: clientIp,
        vnp_TxnRef: txnRef,
        vnp_OrderInfo: `Thanh toan don hang ${savedOrder.orderNumber}`,
        vnp_OrderType: ProductCode.Other,
        vnp_ReturnUrl: process.env.VNPAY_RETURN_URL || 'http://localhost:3000/payment/vnpay-return',
        vnp_Locale: VnpLocale.VN,
      });

      return res.status(201).json({
        success: true,
        message: 'Đặt hàng thành công',
        order: savedOrder,
        paymentUrl,
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Đặt hàng thành công',
      order: savedOrder,
    });

  } catch (error) {
    console.error('❌ Lỗi tạo đơn hàng:', error.message);

    // ⚠️ HOÀN KHO (Rollback) - Trả lại hàng nếu có lỗi xảy ra sau khi đã trừ kho
    if (processedItems.length > 0) {
      console.log('🔄 Đang hoàn kho cho đơn hàng thất bại...');
      for (const item of processedItems) {
        try {
          if (item.variant && item.variant.name) {
            await Product.updateOne(
              { _id: item.productId },
              {
                $inc: {
                  'variants.$[].options.$[opt].stock': item.quantity,
                  'variants.$[].options.$[opt].soldCount': -item.quantity,
                },
              },
              { arrayFilters: [{ 'opt.name': item.variant.name }] }
            );
          } else {
            await Product.updateOne(
              { _id: item.productId },
              { $inc: { stock: item.quantity, soldCount: -item.quantity } }
            );
          }
        } catch (rollbackError) {
          console.error(`CỰC KỲ NGHIÊM TRỌNG: Lỗi hoàn kho cho sản phẩm ${item.productId}`, rollbackError);
        }
      }
    }

    return res.status(400).json({
      success: false,
      message: error.message || 'Lỗi xử lý đơn hàng',
    });
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
 * HỦY ĐƠN HÀNG (CÓ HOÀN KHO)
 */
export const cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const order = await Order.findOne({ _id: id, userId: req.user.id });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
    }

    if (['shipped', 'delivered', 'cancelled', 'completed'].includes(order.status)) {
      return res.status(400).json({ success: false, message: 'Không thể hủy đơn hàng ở trạng thái này' });
    }

    // 1. Cập nhật trạng thái hủy
    order.status = 'cancelled';
    order.cancelReason = reason || 'Người dùng hủy';
    await order.save();

    // 2. HOÀN KHO ATOMIC
    if (order.items && order.items.length > 0) {
      for (const item of order.items) {
        try {
          if (item.variant && item.variant.name) {
            await Product.updateOne(
              { _id: item.productId },
              {
                $inc: {
                  'variants.$[].options.$[opt].stock': item.quantity,
                  'variants.$[].options.$[opt].soldCount': -item.quantity,
                },
              },
              { arrayFilters: [{ 'opt.name': item.variant.name }] }
            );
          } else {
            await Product.updateOne(
              { _id: item.productId },
              { $inc: { stock: item.quantity, soldCount: -item.quantity } }
            );
          }
        } catch (restockError) {
          console.error(`Lỗi hoàn kho cho đơn ${order._id}:`, restockError);
        }
      }
    }

    if (global.io) {
      global.io.to('admin').emit('orderStatusUpdated', { orderId: order._id, status: 'cancelled' });
    }

    return res.json({ success: true, message: 'Hủy đơn hàng thành công', order });
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
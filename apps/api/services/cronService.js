import mongoose from 'mongoose';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Voucher from '../models/Voucher.js';

/**
 * Quét các đơn hàng online chưa thanh toán quá 30 phút để hủy đơn & hoàn kho.
 */
export const cleanupExpiredOrders = async () => {
  const expiryTime = new Date(Date.now() - 30 * 60 * 1000); // 30 phút trước

  try {
    // Tìm các đơn hàng thỏa mãn điều kiện
    const expiredOrders = await Order.find({
      paymentMethod: { $ne: 'cod' },
      status: 'pending',
      paymentStatus: 'unpaid',
      createdAt: { $lte: expiryTime }
    });

    if (expiredOrders.length === 0) {
      return;
    }

    console.log(`[Cron Job] Phát hiện ${expiredOrders.length} đơn hàng online hết hạn thanh toán. Đang tiến hành hủy & hoàn kho...`);

    for (const expiredOrder of expiredOrders) {
      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        const order = await Order.findById(expiredOrder._id).session(session);
        if (!order || order.status !== 'pending') {
          await session.abortTransaction();
          session.endSession();
          continue;
        }

        // 1. Hoàn trả tồn kho cho từng sản phẩm trong đơn hàng
        if (order.items && order.items.length > 0) {
          for (const item of order.items) {
            let filter, update, arrayFilters = [];

            if (item.variant && item.variant.name) {
              filter = { _id: item.productId };
              update = {
                $inc: {
                  'variants.$[var].options.$[opt].stock': item.quantity,
                  'variants.$[var].options.$[opt].soldCount': -item.quantity,
                  'soldCount': -item.quantity
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

        // 2. Hoàn lại lượt dùng voucher
        if (order.voucherCode) {
          await Voucher.findOneAndUpdate(
            { code: order.voucherCode.toUpperCase() },
            { $inc: { usedCount: -1 } },
            { session }
          );
        }

        // 3. Cập nhật trạng thái đơn hàng thành đã hủy
        order.status = 'cancelled';
        order.cancelledAt = new Date();
        order.cancelledBy = 'system';
        order.cancelReason = 'Hết hạn thời gian thanh toán online (Hệ thống tự động hủy)';

        await order.save({ session });
        await session.commitTransaction();
        session.endSession();

        console.log(`[Cron Job] Đã hủy thành công đơn hàng #${order.orderNumber || order._id}`);

        // 4. Bắn Socket thông báo realtime
        if (global.io) {
          const updateData = {
            orderId: order._id,
            status: 'cancelled',
            paymentStatus: 'unpaid'
          };
          global.io.to(`user:${order.userId}`).emit('orderStatusUpdated', {
            ...updateData,
            message: 'Đơn hàng của bạn đã bị hủy do hết hạn thanh toán online.'
          });
          global.io.to('admin').emit('orderStatusUpdated', {
            ...updateData,
            message: `Hệ thống tự động hủy đơn hàng #${order.orderNumber || order._id} do hết hạn thanh toán.`
          });
        }

      } catch (orderError) {
        await session.abortTransaction();
        session.endSession();
        console.error(`[Cron Job] Lỗi khi xử lý hủy đơn hàng #${order._id}:`, orderError.message);
      }
    }

  } catch (error) {
    console.error('[Cron Job] Lỗi chạy tiến trình dọn dẹp đơn hàng hết hạn:', error.message);
  }
};

/**
 * Khởi chạy Cron Job quét nền mỗi 15 phút.
 */
export const startCleanupJob = () => {
  console.log('⏰ Khởi động tiến trình quét nền dọn dẹp đơn hàng online hết hạn (15 phút/lần).');
  // Chạy lần đầu sau 10 giây khi khởi động server
  setTimeout(cleanupExpiredOrders, 10000);
  
  // Thiết lập interval chạy mỗi 15 phút
  setInterval(cleanupExpiredOrders, 15 * 60 * 1000);
};

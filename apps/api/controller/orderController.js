import Order from '../models/Order.js';
import Product from '../models/Product.js';
import { createNotification } from './adminController.js';
import { sendNewOrderEmail } from '../services/emailService.js';
import mongoose from 'mongoose';

// =============================================================================
// CRITICAL: CREATE ORDER (SECURE PRICE & ATOMIC STOCK)
// =============================================================================
  export const createOrder = async (req, res) => {
  const processedItems = []; // Track stock deductions for rollback

  try {
    const { items, ...orderInfo } = req.body;

    // 1. Validate Input
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Giỏ hàng trống' });
    }

    const trustedItems = [];
    let grandTotal = 0;

    // 2. PRICE VERIFICATION & DATA PREPARATION (Zero Trust)
    for (const item of items) {
      if (!item.productId) continue;

      const product = await Product.findById(item.productId);
      if (!product) {
        throw new Error(`Sản phẩm ID ${item.productId} không tồn tại.`);
      }

      let price = product.price;
      let variantName = null;

      // Handle Variants
      if (item.variant && item.variant.name) {
        let foundOption = null;

        if (product.variants && product.variants.length > 0) {
          for (const v of product.variants) {
            const opt = v.options.find(o => o.name === item.variant.name);
            if (opt) {
              foundOption = opt;
              break;
            }
          }
        }

        if (!foundOption) {
          throw new Error(`Biến thể "${item.variant.name}" của sản phẩm "${product.name}" không hợp lệ.`);
        }

        price = foundOption.price;
        variantName = item.variant.name;
      }

      const quantity = parseInt(item.quantity) || 1;
      grandTotal += price * quantity;

      trustedItems.push({
        productId: product._id,
        productName: product.name,
        productImage: product.image,
        price,
        quantity,
        variant: variantName ? { name: variantName } : undefined,
      });
    }

    // 3. ATOMIC STOCK DEDUCTION
    for (const item of trustedItems) {
      let updatedProduct;

      // Case A: Variant Stock
      if (item.variant && item.variant.name) {
        updatedProduct = await Product.findOneAndUpdate(
          {
            _id: item.productId,
            stock: { $gte: item.quantity },
            'variants.options': {
              $elemMatch: {
                name: item.variant.name,
                stock: { $gte: item.quantity },
              },
            },
          },
          {
            $inc: {
              stock: -item.quantity,
              'variants.$[].options.$[opt].stock': -item.quantity,
              soldCount: item.quantity, 
            },
          },
          {
            arrayFilters: [{ 'opt.name': item.variant.name }],
            new: true,
          }
        );
      }
      // Case B: Simple Product Stock
      else {
        updatedProduct = await Product.findOneAndUpdate(
          {
            _id: item.productId,
            stock: { $gte: item.quantity },
          },
          {
            $inc: { stock: -item.quantity, soldCount: item.quantity },
          },
          { new: true }
        );
      }

      if (!updatedProduct) {
        throw new Error(
          `Sản phẩm ${item.productName} (${item.variant?.name || 'Tiêu chuẩn'}) không đủ số lượng tồn kho.`
        );
      }

      processedItems.push({
        productId: item.productId,
        variantName: item.variant?.name,
        quantity: item.quantity,
      });
    }

    // 4. CREATE ORDER
    const finalOrderData = {
      ...orderInfo,
      userId: req.user ? req.user.id : null,
      items: trustedItems,
      totalAmount: grandTotal,
      status: 'pending',
      paymentStatus: 'unpaid',
    };

    const savedOrder = await Order.create(finalOrderData);

    // 5. POST-PROCESS (Async — không block response)
    if (typeof createNotification === 'function') {
      createNotification(
        'order',
        `Đơn hàng mới #${savedOrder._id.toString().slice(-6).toUpperCase()} - ${grandTotal.toLocaleString('vi-VN')}đ`,
        savedOrder._id,
        'Order'
      ).catch(err => console.error('Notification Error:', err));
    }

    sendNewOrderEmail(savedOrder).catch(err => console.error('Email Error:', err));

    if (global.io) {
      global.io.to('admin').emit('newOrder', savedOrder);
    }

    return res.status(201).json({
      success: true,
      message: 'Đặt hàng thành công',
      order: savedOrder,
    });

  } catch (error) {
    console.error('❌ Create Order Error:', error.message);

    // ⚠️ ROLLBACK STOCK (Compensating Transaction)
    if (processedItems.length > 0) {
      console.log('🔄 Rolling back stock for failed order...');
      for (const item of processedItems) {
        try {
          if (item.variantName) {
            await Product.updateOne(
              { _id: item.productId },
              {
                $inc: {
                  stock: item.quantity,
                  'variants.$[].options.$[opt].stock': item.quantity,
                  soldCount: -item.quantity,
                },
              },
              { arrayFilters: [{ 'opt.name': item.variantName }] }
            );
          } else {
            await Product.updateOne(
              { _id: item.productId },
              { $inc: { stock: item.quantity, soldCount: -item.quantity } }
            );
          }
        } catch (rollbackError) {
          console.error(`CRITICAL: Failed to rollback stock for product ${item.productId}`, rollbackError);
        }
      }
    }

    return res.status(400).json({
      success: false,
      message: error.message || 'Lỗi xử lý đơn hàng',
    });
  }
};

// =============================================================================
// GET USER ORDERS
// =============================================================================
// Khi admin cập nhật status → delivered
export const updateOrderStatus = async (req, res) => {
  try {
    const { status, paymentStatus } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Không tìm thấy đơn' });

    order.status = status;

    // ✅ Tự động mark paid khi giao hàng thành công (cho COD)
    if (status === 'delivered' && order.paymentStatus === 'unpaid') {
      order.paymentStatus = 'paid';
      order.isPaid = true;
      order.paidAt = new Date();
    }

    // Hoặc cho phép admin set paymentStatus thủ công
    if (paymentStatus) {
      order.paymentStatus = paymentStatus;
      if (paymentStatus === 'paid') {
        order.isPaid = true;
        order.paidAt = order.paidAt || new Date();
      }
    }

    await order.save();

    // ... socket emit, notification...

    return res.json({ success: true, order });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
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
    console.error('❌ Error fetching orders:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error: ' + error.message,
    });
  }
};

// =============================================================================
// GET ORDER BY ID
// =============================================================================
export const getOrderById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid order ID' });
    }

    const order = await Order.findById(req.params.id).populate('userId', 'name email');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // ✅ Security: Chỉ chủ đơn hoặc admin mới được xem
    if (req.user.role !== 'admin' && order.userId?._id.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    return res.json({ success: true, order });
  } catch (error) {
    console.error('❌ Error fetching order:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error: ' + error.message,
    });
  }
};

// =============================================================================
// CANCEL ORDER (WITH STOCK RESTORE)
// =============================================================================
export const cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    // ✅ FIX: Tìm theo cả _id và userId để đảm bảo chủ đơn mới được hủy
    const order = await Order.findOne({ _id: id, userId: req.user.id });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
    }

    if (['shipped', 'delivered', 'cancelled', 'completed'].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: 'Không thể hủy đơn hàng ở trạng thái này',
      });
    }

    // 1. Update Status
    order.status = 'cancelled';
    order.cancelReason = reason || 'Người dùng hủy';
    await order.save();

    // 2. RESTOCK INVENTORY
    if (order.items && order.items.length > 0) {
      console.log(`🔄 Restocking items for cancelled order ${order._id}`);

      for (const item of order.items) {
        try {
          if (item.variant && item.variant.name) {
            await Product.updateOne(
              { _id: item.productId },
              {
                $inc: {
                  stock: item.quantity,
                  'variants.$[].options.$[opt].stock': item.quantity,
                  soldCount: -item.quantity,
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
          console.error(`❌ Failed to restock product ${item.productId}`, restockError);
        }
      }
    }

    if (global.io) {
      global.io.to('admin').emit('orderStatusUpdated', {
        orderId: order._id,
        status: 'cancelled',
        order,
      });
    }

    return res.json({ success: true, message: 'Đã hủy đơn hàng thành công', order });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// =============================================================================
// MARK AS PAID
// =============================================================================
export const markOrderAsPaid = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid order ID' });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // ✅ Security: Chỉ chủ đơn hoặc admin
    if (order.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // ✅ Tránh cập nhật lại nếu đã thanh toán rồi
    if (order.paymentStatus === 'paid') {
      return res.status(400).json({ success: false, message: 'Đơn hàng đã được thanh toán trước đó' });
    }

    order.paymentStatus = 'paid';
    order.isPaid = true;
    order.paidAt = new Date();

    if (order.status === 'pending') {
      order.status = 'processing';
    }

    await order.save();

    if (global.io) {
      global.io.to(`user:${order.userId}`).emit('orderStatusUpdated', {
        orderId: order._id,
        status: order.status,
        paymentStatus: 'paid',
        order,
      });
    }

    return res.json({ success: true, message: 'Đơn hàng đã được thanh toán thành công', order });
  } catch (error) {
    console.error('❌ Error marking order as paid:', error);
    return res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
};
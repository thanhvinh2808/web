import Order from '../models/Order.js';
import Product from '../models/Product.js';
import { createNotification } from './adminController.js';
import { sendNewOrderEmail } from '../services/emailService.js';
import mongoose from 'mongoose';

// ✅ CREATE ORDER (ATOMIC & SAFE)
export const createOrder = async (req, res) => {
  const processedItems = []; // To track for rollback

  try {
    const orderData = req.body;
    
    // 1. Validate Basic Data
    if (!orderData.items || orderData.items.length === 0) {
      return res.status(400).json({ success: false, message: 'Giỏ hàng trống' });
    }

    // 2. Process Items & Deduct Stock (ATOMICALLY)
    for (const item of orderData.items) {
      let updatedProduct;

      // Case A: Product has Variant (Size/Color)
      if (item.variant && item.variant.name) {
        updatedProduct = await Product.findOneAndUpdate(
          {
            _id: item.productId,
            stock: { $gte: item.quantity }, // Check total stock
            "variants.options": {
              $elemMatch: { 
                name: item.variant.name, 
                stock: { $gte: item.quantity } // Check variant stock
              }
            }
          },
          {
            $inc: {
              stock: -item.quantity, // Deduct total
              "variants.$[].options.$[opt].stock": -item.quantity // Deduct variant
            }
          },
          {
            arrayFilters: [{ "opt.name": item.variant.name }],
            new: true
          }
        );
      } 
      // Case B: Simple Product (No Variant)
      else {
        updatedProduct = await Product.findOneAndUpdate(
          {
            _id: item.productId,
            stock: { $gte: item.quantity }
          },
          {
            $inc: { stock: -item.quantity }
          },
          { new: true }
        );
      }

      // If update failed, it means Out of Stock
      if (!updatedProduct) {
        throw new Error(`Sản phẩm ${item.productName} (${item.variant?.name || 'Tiêu chuẩn'}) không đủ số lượng tồn kho.`);
      }

      // Add to processed list for potential rollback
      processedItems.push({
        productId: item.productId,
        variantName: item.variant?.name,
        quantity: item.quantity
      });
    }

    // 3. Create Order if all stock deducted successfully
    const savedOrder = await Order.create(orderData);

    // 4. Send Notifications (Async - don't block response)
    // Notify Admin
    if (typeof createNotification === 'function') {
      createNotification('order', `Đơn hàng mới #${savedOrder._id.toString().slice(-6).toUpperCase()}`, savedOrder._id, 'Order')
        .catch(err => console.error('Notification Error:', err));
    }
    
    // Send Email
    sendNewOrderEmail(savedOrder).catch(err => console.error('Email Error:', err));

    // Realtime Socket
    if (global.io) {
      global.io.emit('newOrder', savedOrder);
    }

    res.status(201).json({ 
      success: true, 
      message: 'Đặt hàng thành công', 
      order: savedOrder 
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
                  "variants.$[].options.$[opt].stock": item.quantity
                }
              },
              { arrayFilters: [{ "opt.name": item.variantName }] }
            );
          } else {
            await Product.updateOne(
              { _id: item.productId },
              { $inc: { stock: item.quantity } }
            );
          }
        } catch (rollbackError) {
          console.error(`CRITICAL: Failed to rollback stock for product ${item.productId}`, rollbackError);
        }
      }
    }

    res.status(400).json({ 
      success: false, 
      message: error.message || 'Lỗi xử lý đơn hàng' 
    });
  }
};

// ✅ GET USER ORDERS
export const getUserOrders = async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .lean();
    
    res.json({
      success: true,
      data: orders,
      total: orders.length
    });
    
  } catch (error) {
    console.error('❌ Error fetching orders:', error);
    res.status(500).json({
      success: false,
      message: 'Server error: ' + error.message
    });
  }
};

// ✅ GET ORDER BY ID
export const getOrderById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID'
      });
    }
    
    const order = await Order.findById(req.params.id).populate('userId', 'name email');
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    res.json({
      success: true,
      order
    });
    
  } catch (error) {
    console.error('❌ Error fetching order:', error);
    res.status(500).json({
      success: false,
      message: 'Server error: ' + error.message
    });
  }
};

// ✅ CANCEL ORDER
export const cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { reason } = req.body; // Lý do hủy (optional)

    const order = await Order.findOne({ _id: id, userId });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
    }

    if (['shipped', 'delivered', 'cancelled', 'completed'].includes(order.status)) {
      return res.status(400).json({ success: false, message: 'Không thể hủy đơn hàng ở trạng thái này' });
    }

    order.status = 'cancelled';
    order.cancelReason = reason || 'Người dùng hủy';
    await order.save();

    // RESTOCK LẠI SỐ LƯỢNG (Nếu cần thiết - tùy nghiệp vụ)
    // Ở đây tôi giữ đơn giản là chỉ đổi status, Admin sẽ xử lý restock nếu cần, 
    // hoặc bạn có thể tự động restock tại đây.

    if (global.io) {
        global.io.to('admin').emit('orderStatusUpdated', {
            orderId: order._id,
            status: 'cancelled',
            order
        });
    }

    res.json({ success: true, message: 'Đã hủy đơn hàng thành công', order });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ MARK AS PAID (QR Code Payment Success)
export const markOrderAsPaid = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid order ID' });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Check ownership
    if (order.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    order.paymentStatus = 'paid';
    order.isPaid = true;
    order.paidAt = new Date();
    
    // Nếu đơn đang pending -> processing luôn
    if (order.status === 'pending') {
      order.status = 'processing';
    }

    await order.save();
    
    // Notify
    if (global.io) {
       global.io.to(`user:${order.userId}`).emit('orderStatusUpdated', {
          orderId: order._id,
          status: order.status,
          paymentStatus: 'paid',
          order
       });
    }

    res.json({ success: true, message: 'Order paid successfully', order });
  } catch (error) {
    console.error('❌ Error marking order as paid:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
};
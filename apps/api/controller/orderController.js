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
    // Loop through items to fetch REAL prices from DB
    for (const item of items) {
      if (!item.productId) continue;

      const product = await Product.findById(item.productId);
      if (!product) {
        throw new Error(`Sản phẩm ID ${item.productId} không tồn tại.`);
      }

      let price = product.price; // Default to base price
      let variantName = null;

      // Handle Variants
      if (item.variant && item.variant.name) {
        // Note: item.variant.name corresponds to Option Name (e.g. "XL", "Red")
        // We need to find the option in the product variants
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

      // Calculate Item Total
      const quantity = parseInt(item.quantity) || 1;
      const itemTotal = price * quantity;

      // Add to Trusted List
      trustedItems.push({
        productId: product._id,
        productName: product.name,
        productImage: product.image, // Or specific variant image if needed
        price: price, // TRUSTED PRICE FROM DB
        quantity: quantity,
        variant: variantName ? { name: variantName } : undefined,
        _id: item._id // Preserve if needed, or let DB generate
      });

      grandTotal += itemTotal;
    }

    // 3. ATOMIC STOCK DEDUCTION
    // Only proceed if all prices are verified
    for (const item of trustedItems) {
      let updatedProduct;

      // Case A: Variant Stock
      if (item.variant && item.variant.name) {
        updatedProduct = await Product.findOneAndUpdate(
          {
            _id: item.productId,
            stock: { $gte: item.quantity }, // Check total stock integrity
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
            },
            $inc: { soldCount: item.quantity } // Increment sold count
          },
          {
            arrayFilters: [{ "opt.name": item.variant.name }],
            new: true
          }
        );
      } 
      // Case B: Simple Product Stock
      else {
        updatedProduct = await Product.findOneAndUpdate(
          {
            _id: item.productId,
            stock: { $gte: item.quantity }
          },
          {
            $inc: { stock: -item.quantity, soldCount: item.quantity }
          },
          { new: true }
        );
      }

      // If update failed, it means Out of Stock
      if (!updatedProduct) {
        throw new Error(`Sản phẩm ${item.productName} (${item.variant?.name || 'Tiêu chuẩn'}) không đủ số lượng tồn kho.`);
      }

      // Log success for potential rollback
      processedItems.push({
        productId: item.productId,
        variantName: item.variant?.name,
        quantity: item.quantity
      });
    }

    // 4. CREATE ORDER
    // Override trusted data
    const finalOrderData = {
      ...orderInfo,
      userId: req.user ? req.user.id : null, // Ensure userId from Token
      items: trustedItems,
      totalAmount: grandTotal,
      status: 'pending',
      paymentStatus: 'pending' // Default
    };

    const savedOrder = await Order.create(finalOrderData);

    // 5. POST-PROCESS (Async)
    // Notify Admin
    if (typeof createNotification === 'function') {
      createNotification('order', `Đơn hàng mới #${savedOrder._id.toString().slice(-6).toUpperCase()} - ${grandTotal.toLocaleString('vi-VN')}đ`, savedOrder._id, 'Order')
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
                  "variants.$[].options.$[opt].stock": item.quantity,
                  soldCount: -item.quantity
                }
              },
              { arrayFilters: [{ "opt.name": item.variantName }] }
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

    res.status(400).json({ 
      success: false, 
      message: error.message || 'Lỗi xử lý đơn hàng' 
    });
  }
};

// =============================================================================
// GET USER ORDERS
// =============================================================================
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

// =============================================================================
// GET ORDER BY ID
// =============================================================================
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

    // Security check: Only owner or admin can view
    if (req.user.role !== 'admin' && order.userId?._id.toString() !== req.user.id) {
       return res.status(403).json({ success: false, message: 'Unauthorized' });
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

// =============================================================================
// CANCEL ORDER (WITH STOCK RESTORE)
// =============================================================================
export const cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { reason } = req.body;

    const order = await Order.findOne({ _id: id, userId });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
    }

    if (['shipped', 'delivered', 'cancelled', 'completed'].includes(order.status)) {
      return res.status(400).json({ success: false, message: 'Không thể hủy đơn hàng ở trạng thái này' });
    }

    // 1. Update Status
    order.status = 'cancelled';
    order.cancelReason = reason || 'Người dùng hủy';
    await order.save();

    // 2. RESTOCK INVENTORY (Fix Inventory Leak)
    if (order.items && order.items.length > 0) {
      console.log(`🔄 Restocking items for cancelled order ${order._id}`);
      
      for (const item of order.items) {
        try {
          if (item.variant && item.variant.name) {
             // Restock Variant
             await Product.updateOne(
                { _id: item.productId },
                {
                   $inc: {
                      stock: item.quantity,
                      "variants.$[].options.$[opt].stock": item.quantity,
                      soldCount: -item.quantity
                   }
                },
                { arrayFilters: [{ "opt.name": item.variant.name }] }
             );
          } else {
             // Restock Simple Product
             await Product.updateOne(
                { _id: item.productId },
                { 
                  $inc: { stock: item.quantity, soldCount: -item.quantity } 
                }
             );
          }
        } catch (restockError) {
          console.error(`❌ Failed to restock product ${item.productId}`, restockError);
          // Continue to next item even if one fails
        }
      }
    }

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

    // Check ownership
    if (order.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    order.paymentStatus = 'paid';
    order.isPaid = true;
    order.paidAt = new Date();
    
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
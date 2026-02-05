import Order from '../models/Order.js';
import Product from '../models/Product.js';
import { createNotification } from './adminController.js';
import { sendNewOrderEmail } from '../services/emailService.js';

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

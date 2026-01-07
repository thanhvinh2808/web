// backend/models/Order.js
import mongoose from 'mongoose';

// Schema cho item trong giỏ hàng
const OrderItemSchema = new mongoose.Schema({
  productId: { 
    type: String, // Giữ String vì bạn đang dùng slug làm ID
    required: true
  },
  productName: { type: String, required: true },
  productBrand: { type: String },
  productImage: { type: String },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
});

// Schema cho thông tin khách hàng
const CustomerInfoSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  address: { type: String, required: true },
  city: { type: String },
  district: { type: String },
  ward: { type: String },
  notes: { type: String }
});

// Schema chính cho Đơn hàng
const OrderSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true 
  },
  items: [OrderItemSchema],
  customerInfo: CustomerInfoSchema,
  paymentMethod: { 
    type: String, 
    enum: ['cod', 'banking', 'momo'],
    default: 'cod' 
  },
  totalAmount: { 
    type: Number, 
    required: true 
  },
  voucherCode: { 
    type: String, 
    default: null 
  },
  discountAmount: { 
    type: Number, 
    default: 0 
  },
  status: { 
    type: String,
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  },
  // ✅ ĐỔI TỪ isPaid SANG paymentStatus
  paymentStatus: {
    type: String,
    enum: ['unpaid', 'paid'],
    default: 'unpaid'
  },
  // ✅ THÔNG TIN HỦY ĐƠN HÀNG
  cancelledAt: {
    type: Date,
    default: null
  },
  cancelledBy: {
    type: String,
    enum: ['user', 'admin', 'system'],
    default: null
  },
  cancelReason: {
    type: String,
    default: null
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
}, {
  timestamps: true // Tự động tạo createdAt và updatedAt
});

// ✅ INDEX ĐỂ TỐI ƯU QUERY
OrderSchema.index({ userId: 1, createdAt: -1 });
OrderSchema.index({ status: 1 });
OrderSchema.index({ 'customerInfo.email': 1 });

// ✅ VIRTUAL FIELD: Kiểm tra có thể hủy không
OrderSchema.virtual('canCancel').get(function() {
  return ['pending', 'processing'].includes(this.status);
});

// ✅ VIRTUAL FIELD: Kiểm tra có thể hoàn tiền không
OrderSchema.virtual('canRefund').get(function() {
  return this.status === 'cancelled' && this.paymentStatus === 'paid';
});

// ✅ METHOD: Hủy đơn hàng
OrderSchema.methods.cancel = function(cancelledBy, reason = null) {
  if (!this.canCancel) {
    throw new Error(`Không thể hủy đơn hàng ở trạng thái "${this.status}"`);
  }
  
  this.status = 'cancelled';
  this.cancelledAt = new Date();
  this.cancelledBy = cancelledBy;
  if (reason) {
    this.cancelReason = reason;
  }
  
  return this.save();
};

// ✅ STATIC METHOD: Lấy đơn hàng có thể hủy của user
OrderSchema.statics.getCancellableOrders = function(userId) {
  return this.find({
    userId: userId,
    status: { $in: ['pending', 'processing'] }
  }).sort({ createdAt: -1 });
};

// ✅ PRE-SAVE HOOK: Validate logic
OrderSchema.pre('save', function(next) {
  // Nếu đơn hàng bị hủy, đảm bảo có thông tin hủy
  if (this.status === 'cancelled') {
    if (!this.cancelledAt) {
      this.cancelledAt = new Date();
    }
    if (!this.cancelledBy) {
      this.cancelledBy = 'system';
    }
  }
  
  // Nếu đã giao hàng, tự động chuyển sang đã thanh toán
  if (this.status === 'delivered' && this.paymentStatus === 'unpaid') {
    this.paymentStatus = 'paid';
  }
  
  next();
});

// ✅ ENABLE VIRTUALS IN JSON
OrderSchema.set('toJSON', { virtuals: true });
OrderSchema.set('toObject', { virtuals: true });

export default mongoose.models.Order || mongoose.model('Order', OrderSchema);
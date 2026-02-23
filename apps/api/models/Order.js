// backend/models/Order.js
import mongoose from 'mongoose';

// Schema cho item trong đơn hàng
const OrderItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId, // ✅ FIX: Dùng ObjectId thay vì String để query/populate được
    ref: 'Product',
    required: true,
  },
  productName: { type: String, required: true },
  productBrand: { type: String },
  productImage: { type: String },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  variant: {
    name: { type: String }, // VD: "42", "Red/Black"
  },
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
  notes: { type: String },
});

// Schema chính cho Đơn hàng
const OrderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    items: [OrderItemSchema],
    customerInfo: CustomerInfoSchema,
    paymentMethod: {
      type: String,
      enum: ['cod', 'banking', 'momo', 'card'],
      default: 'cod',
    },
    orderNumber: {
      type: String,
      unique: true,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    voucherCode: {
      type: String,
      default: null,
    },
    discountAmount: {
      type: Number,
      default: 0,
    },
    shippingFee: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
      default: 'pending',
    },
    paymentStatus: {
      type: String,
      enum: ['unpaid', 'paid'],
      default: 'unpaid',
    },
    // ✅ FIX: Thêm isPaid và paidAt — orderController gọi order.isPaid & order.paidAt nhưng schema thiếu
    isPaid: {
      type: Boolean,
      default: false,
    },
    paidAt: {
      type: Date,
      default: null,
    },
    // Thông tin hủy đơn
    cancelledAt: {
      type: Date,
      default: null,
    },
    cancelledBy: {
      type: String,
      enum: ['user', 'admin', 'system', null],
      default: null,
    },
    cancelReason: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// ===== INDEXES =====
OrderSchema.index({ userId: 1, createdAt: -1 });
OrderSchema.index({ status: 1 });
OrderSchema.index({ orderNumber: 1 });
OrderSchema.index({ 'customerInfo.email': 1 });

// ===== VIRTUALS =====
OrderSchema.virtual('canCancel').get(function () {
  return ['pending', 'processing'].includes(this.status);
});

OrderSchema.virtual('canRefund').get(function () {
  return this.status === 'cancelled' && this.paymentStatus === 'paid';
});

// ===== METHODS =====
OrderSchema.methods.cancel = function (cancelledBy, reason = null) {
  if (!this.canCancel) {
    throw new Error(`Không thể hủy đơn hàng ở trạng thái "${this.status}"`);
  }
  this.status = 'cancelled';
  this.cancelledAt = new Date();
  this.cancelledBy = cancelledBy;
  if (reason) this.cancelReason = reason;
  return this.save();
};

OrderSchema.statics.getCancellableOrders = function (userId) {
  return this.find({
    userId,
    status: { $in: ['pending', 'processing'] },
  }).sort({ createdAt: -1 });
};

// ===== PRE-SAVE HOOK =====
OrderSchema.pre('save', function (next) {
  // Đơn hàng hủy: đảm bảo có thông tin hủy
  if (this.status === 'cancelled') {
    if (!this.cancelledAt) this.cancelledAt = new Date();
    if (!this.cancelledBy) this.cancelledBy = 'system';
  }

  // Đã giao: tự động đánh dấu đã thanh toán
  if (this.status === 'delivered' && this.paymentStatus === 'unpaid') {
    this.paymentStatus = 'paid';
    this.isPaid = true;
    this.paidAt = this.paidAt || new Date();
  }

  // ✅ FIX: Dùng slice(-2) thay vì substr(-2) (bị deprecated)
  if (!this.orderNumber) {
    const date = new Date();
    const yy = date.getFullYear().toString().slice(-2);
    const mm = (date.getMonth() + 1).toString().padStart(2, '0');
    const dd = date.getDate().toString().padStart(2, '0');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    this.orderNumber = `FM${yy}${mm}${dd}-${randomSuffix}`;
  }

  next();
});

// Cho phép virtual trong JSON output
OrderSchema.set('toJSON', { virtuals: true });
OrderSchema.set('toObject', { virtuals: true });

export default mongoose.models.Order || mongoose.model('Order', OrderSchema);
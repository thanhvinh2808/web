// backend/models/Order.js
import mongoose from 'mongoose';

// Schema cho item trong đơn hàng
const OrderItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Product',
    required: true,
  },
  productName: { type: String, required: true },
  productBrand: { type: String },
  productImage: { 
    type: String,
    get: function(val) {
      if (!val) return val;
      if (val.startsWith('http')) return val;
      const baseUrl = process.env.API_URL || 'http://localhost:5000';
      // Nếu đã có /uploads/ ở đầu
      if (val.startsWith('/uploads')) return `${baseUrl}${val}`;
      // Nếu chỉ có tên file
      return `${baseUrl}/uploads/products/${val}`;
    }
  },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  variant: {
    name: { type: String }, // VD: "42", "Red/Black"
  },
}, { toJSON: { getters: true }, toObject: { getters: true } });

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

// Schema cho Dòng thời gian trạng thái đơn hàng
const StatusTimelineSchema = new mongoose.Schema({
  status: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  updatedAt: { type: Date, default: Date.now }
}, { _id: false });

// Schema chính cho Đơn hàng
const OrderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      // Gỡ bỏ required để hỗ trợ đơn hàng đã ẩn danh (khi xóa User)
    },
    items: [OrderItemSchema],
    customerInfo: CustomerInfoSchema,
    paymentMethod: {
      type: String,
      enum: ['cod', 'banking', 'momo', 'card', 'vnpay'],
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
      enum: ['pending', 'processing', 'shipped', 'delivered', 'completed', 'cancelled', 'cancellation_requested', 'refunded'],
      default: 'pending',
    },
    paymentStatus: {
      type: String,
      enum: ['unpaid', 'paid'],
      default: 'unpaid',
    },
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
    vnpayTransactionId: {
      type: String,
      default: null,
    },
    // 🕐 Dòng thời gian trạng thái đơn hàng (Order Timeline)
    statusTimeline: {
      type: [StatusTimelineSchema],
      default: []
    },
  },
  {
    timestamps: true,
  }
);

// ===== INDEXES =====
OrderSchema.index({ userId: 1, createdAt: -1 });
OrderSchema.index({ status: 1 });
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
  const statusLabels = {
    pending: 'Chờ xác nhận',
    processing: 'Đang xử lý',
    shipped: 'Đang giao hàng',
    delivered: 'Hoàn thành',
    cancelled: 'Đã hủy'
  };
  if (!this.canCancel) {
    const label = statusLabels[this.status] || this.status;
    throw new Error(`Không thể hủy đơn hàng ở trạng thái "${label}"`);
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
  if (this.status === 'cancelled') {
    if (!this.cancelledAt) this.cancelledAt = new Date();
    if (!this.cancelledBy) this.cancelledBy = 'system';
  }

  if (!this.orderNumber) {
    const date = new Date();
    const yy = date.getFullYear().toString().slice(-2);
    const mm = (date.getMonth() + 1).toString().padStart(2, '0');
    const dd = date.getDate().toString().padStart(2, '0');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    this.orderNumber = `FM${yy}${mm}${dd}-${randomSuffix}`;
  }

  // 🕐 AUTO TIMELINE: Ghi lại lịch sử khi trạng thái thay đổi
  const STATUS_LABELS = {
    pending:                 { title: 'Đặt hàng thành công',        description: 'Đơn hàng của bạn đã được tiếp nhận và đang chờ xác nhận.' },
    processing:              { title: 'Đang xử lý',                  description: 'Shop đã xác nhận đơn và đang chuẩn bị hàng cho bạn.' },
    shipped:                 { title: 'Đang vận chuyển',             description: 'Đơn hàng đã được bàn giao cho đơn vị vận chuyển.' },
    delivered:               { title: 'Đã giao hàng',               description: 'Đơn hàng đã được giao tới địa chỉ của bạn. Vui lòng kiểm tra và xác nhận.' },
    completed:               { title: 'Hoàn thành',                  description: 'Giao dịch hoàn tất. Cảm ơn bạn đã mua sắm tại FootMark!' },
    cancelled:               { title: 'Đã hủy đơn hàng',            description: 'Đơn hàng đã bị hủy.' },
    cancellation_requested:  { title: 'Yêu cầu hủy đơn',            description: 'Yêu cầu hủy đơn của bạn đang chờ Admin xem xét.' },
    refunded:                { title: 'Đã hoàn tiền',               description: 'Đơn hàng đã được hủy và tiền sẽ được hoàn lại trong 3-5 ngày làm việc.' },
  };

  if (this.isModified('status')) {
    const label = STATUS_LABELS[this.status];
    if (label) {
      if (!Array.isArray(this.statusTimeline)) this.statusTimeline = [];
      this.statusTimeline.push({
        status: this.status,
        title: label.title,
        description: label.description,
        updatedAt: new Date()
      });
    }
  }

  next();
});

OrderSchema.set('toJSON', { virtuals: true });
OrderSchema.set('toObject', { virtuals: true });

export default mongoose.models.Order || mongoose.model('Order', OrderSchema);
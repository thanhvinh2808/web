import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId, // Sử dụng ObjectId để populate dễ dàng
    ref: 'Product',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  images: [{
    type: String // URL ảnh review
  }],
  isPurchased: {
    type: Boolean,
    default: false // Đánh dấu "Đã mua hàng" để tăng uy tín
  },
  reply: {
    content: String,
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    repliedAt: Date
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true
});

// Mỗi user chỉ được review 1 sản phẩm 1 lần (tránh spam)
reviewSchema.index({ userId: 1, productId: 1 }, { unique: true });

export default mongoose.model('Review', reviewSchema);

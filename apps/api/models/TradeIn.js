import mongoose from 'mongoose';

const tradeInSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  productName: {
    type: String,
    required: true,
    trim: true
  },
  brand: {
    type: String,
    required: true,
    trim: true
  },
  condition: {
    type: String, // VD: "95%", "Like New", "Cũ nát"
    required: true
  },
  description: {
    type: String, // Mô tả chi tiết lỗi, trầy xước...
    default: ''
  },
  images: [{
    type: String, // Ảnh chụp tình trạng giày
    required: true
  }],
  expectedPrice: {
    type: Number, // Giá khách mong muốn bán
    required: true
  },
  finalPrice: {
    type: Number, // Giá Admin chốt sau khi kiểm định
    default: 0
  },
  status: {
    type: String,
    enum: ['pending', 'evaluating', 'approved', 'rejected', 'completed'],
    default: 'pending'
  },
  adminNote: {
    type: String, // Ghi chú của Admin cho khách (Lý do từ chối/ép giá)
    default: ''
  },
  contactInfo: { // Thông tin liên hệ nếu khác profile
    phone: String,
    address: String
  }
}, {
  timestamps: true
});

export default mongoose.model('TradeIn', tradeInSchema);

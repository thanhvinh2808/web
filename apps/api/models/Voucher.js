import mongoose from 'mongoose';

const voucherSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  description: { type: String, required: true },
  discountType: {
    type: String,
    enum: ['fixed', 'percent'], // Giảm tiền mặt hoặc phần trăm
    required: true
  },
  discountValue: { type: Number, required: true }, // Số tiền hoặc số %
  maxDiscount: { type: Number, default: 0 }, // Giảm tối đa (cho loại %)
  minOrderValue: { type: Number, default: 0 }, // Đơn tối thiểu
  startDate: { type: Date, default: Date.now },
  endDate: { type: Date, required: true },
  usageLimit: { type: Number, default: 100 }, // Tổng số lần dùng
  usedCount: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true
});

const Voucher = mongoose.model('Voucher', voucherSchema);
export default Voucher;
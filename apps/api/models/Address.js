import mongoose from 'mongoose';

const addressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: { // Tên người nhận
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  city: {
    type: String,
    required: true
  },
  district: {
    type: String,
    required: true
  },
  ward: {
    type: String,
    required: true
  },
  specificAddress: { // Số nhà, tên đường
    type: String,
    required: true
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  type: { // Nhà riêng / Văn phòng
    type: String,
    enum: ['Home', 'Office'],
    default: 'Home'
  }
}, {
  timestamps: true
});

// Middleware: Nếu set default=true, bỏ default các địa chỉ khác của user đó
addressSchema.pre('save', async function(next) {
  if (this.isDefault) {
    await this.constructor.updateMany(
      { userId: this.userId, _id: { $ne: this._id } },
      { isDefault: false }
    );
  }
  next();
});

export default mongoose.model('Address', addressSchema);

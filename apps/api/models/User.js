// backend/models/User.js
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Tên là bắt buộc'],
    trim: true,
    minlength: [2, 'Tên phải có ít nhất 2 ký tự']
  },
  email: {
    type: String,
    required: [true, 'Email là bắt buộc'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Email không hợp lệ']
  },
  password: {
    type: String,
    required: [true, 'Mật khẩu là bắt buộc'],
    minlength: [6, 'Mật khẩu phải có ít nhất 6 ký tự']
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  
  // ✅ THÊM CÁC FIELD MỚI CHO PROFILE
  phone: {
    type: String,
    default: '',
    trim: true
  },
  address: {
    type: String,
    default: '',
    trim: true
  },
  dateOfBirth: {
    type: String,
    default: ''
  },
  gender: {
    type: String,
    enum: ['', 'male', 'female', 'other'],
    default: ''
  },
  city: {
    type: String,
    default: '',
    trim: true
  },
  district: {
    type: String,
    default: '',
    trim: true
  },
  ward: {
    type: String,
    default: '',
    trim: true
  },
  // ✅ DANH SÁCH ĐỊA CHỈ (SHOPEE STYLE)
  addresses: [{
    name: String,
    phone: String,
    city: String,
    district: String,
    ward: String,
    address: String, // Địa chỉ cụ thể
    isDefault: { type: Boolean, default: false }
  }],
  // ✅ TÀI KHOẢN NGÂN HÀNG
  bankAccounts: [{
    bankName: String,
    accountNumber: String,
    accountName: String, // Tên chủ tài khoản
    branch: String,
    isDefault: { type: Boolean, default: false }
  }],
  avatar: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Index để tìm kiếm nhanh
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });

const User = mongoose.model('User', userSchema);

export default User;
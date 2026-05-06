// models/Contact.js
import mongoose from 'mongoose';

const contactSchema = new mongoose.Schema({
  fullname: { 
    type: String, 
    required: [true, 'Vui lòng nhập họ tên'],
    trim: true 
  },
  email: { 
    type: String, 
    required: [true, 'Vui lòng nhập email'],
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Email không hợp lệ']
  },
  phone: {
    type: String,
    trim: true
  },
  subject: {
    type: String,
    trim: true
  },
  message: { 
    type: String, 
    required: [true, 'Vui lòng nhập nội dung'],
    trim: true 
  },
  status: {
    type: String,
    enum: ['pending', 'replied', 'closed'],
    default: 'pending'
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, {
  timestamps: true
});

export default mongoose.models.Contact || mongoose.model('Contact', contactSchema);

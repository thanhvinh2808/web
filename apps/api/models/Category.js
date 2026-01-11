import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true,
    trim: true
  },
  slug: { 
    type: String, 
    required: true,
    unique: true,
    lowercase: true
  },
  description: {
    type: String,
    default: ''
  },
  icon: {
    type: String,
    default: ''
  }
}, { 
  timestamps: true 
});

// ✅ Helper function để tạo slug
function generateSlug(text) {
  return text
    .toLowerCase()
    .normalize('NFD')                    // Chuẩn hóa Unicode
    .replace(/[\u0300-\u036f]/g, '')     // Bỏ dấu
    .replace(/[đĐ]/g, 'd')               // Đổi đ thành d
    .replace(/[^a-z0-9\s-]/g, '')        // Bỏ ký tự đặc biệt
    .replace(/\s+/g, '-')                // Khoảng trắng thành -
    .replace(/-+/g, '-')                 // Nhiều - thành 1 -
    .trim();
}

// ✅ Middleware cho .save() và .create()
categorySchema.pre('save', function(next) {
  if (this.isModified('name') || !this.slug) {
    this.slug = generateSlug(this.name);
  }
  next();
});

// ✅ Middleware cho .findOneAndUpdate()
categorySchema.pre('findOneAndUpdate', function(next) {
  const update = this.getUpdate();
  if (update.name) {
    update.slug = generateSlug(update.name);
  }
  next();
});

export default mongoose.model('Category', categorySchema);
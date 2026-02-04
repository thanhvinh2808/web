import mongoose from 'mongoose';

const sizeGuideSchema = new mongoose.Schema({
  brandId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Brand',
    required: true
  },
  type: {
    type: String,
    enum: ['Footwear', 'Apparel', 'Accessories'],
    default: 'Footwear'
  },
  gender: {
    type: String,
    enum: ['Men', 'Women', 'Kids', 'Unisex'],
    required: true
  },
  // Lưu bảng size dưới dạng mảng các object
  // VD: [{ us: 7, uk: 6, eu: 40, cm: 25 }]
  sizes: [{
    us: Number,
    uk: Number,
    eu: Number,
    cm: Number,
    inch: Number
  }],
  // Hoặc dùng ảnh nếu lười nhập liệu
  imageUrl: {
    type: String
  }
}, {
  timestamps: true
});

// Index để tìm nhanh size chart cho Brand + Gender
sizeGuideSchema.index({ brandId: 1, gender: 1 });

export default mongoose.model('SizeGuide', sizeGuideSchema);

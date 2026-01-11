// backend/models/Product.js
import mongoose from 'mongoose';

// Schema cho biến thể sản phẩm
const variantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true // VD: "Màu sắc", "Dung lượng", "Kích thước"
  },
  options: [{
    name: {
      type: String,
      required: true,
      trim: true // VD: "Đỏ", "128GB", "XL"
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    stock: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    sku: String, // Mã SKU riêng cho variant
    image: String // URL ảnh riêng cho variant
  }]
});

const productSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true,
    trim: true
  },
  brand: {
    type: String,
    trim: true
  },
  slug: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true,
    lowercase: true
  },
  
  // ===== GIÁ CƠ BẢN =====
  price: { 
    type: Number, 
    required: true,
    min: 0
  },
  originalPrice: {
    type: Number,
    min: 0
  },
  
  // ===== HÌNH ẢNH =====
  // Giữ lại field cũ để backward compatible
  image: String,
  
  // Mảng hình ảnh mới
  images: [{
    url: {
      type: String,
      required: true
    },
    alt: {
      type: String,
      default: ''
    },
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],
  
  // ===== BIẾN THỂ SẢN PHẨM =====
  variants: [variantSchema],
  
  // ===== THÔNG TIN KHÁC =====
  description: {
    type: String,
    trim: true
  },
  categorySlug: {
    type: String,
    trim: true
  },
  
  // Thông số kỹ thuật
  specs: {
    screen: String,
    chip: String,
    ram: String,
    storage: String,
    camera: String,
    battery: String
  },
  
  // Đánh giá
  rating: { 
    type: Number, 
    default: 5,
    min: 0,
    max: 5
  },
  reviewCount: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Kho hàng
  stock: { 
    type: Number, 
    default: 0,
    min: 0
  },
  soldCount: { 
    type: Number, 
    default: 0,
    min: 0
  },
  
  // Trạng thái
  featured: { 
    type: Boolean, 
    default: false 
  },
  isNew: { 
    type: Boolean, 
    default: false 
  },
  hasPromotion: { 
    type: Boolean, 
    default: false 
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'out_of_stock'],
    default: 'active'
  }
}, { 
  timestamps: true,
  suppressReservedKeysWarning: true // ✅ Tắt cảnh báo về field 'isNew'
});

// ===== INDEXES =====
productSchema.index({ categorySlug: 1 });
productSchema.index({ name: 'text', description: 'text' });

// ===== VIRTUAL FIELDS =====
// Tổng tồn kho (bao gồm cả variants)
productSchema.virtual('totalStock').get(function() {
  if (this.variants && this.variants.length > 0) {
    return this.variants.reduce((total, variant) => {
      return total + variant.options.reduce((sum, opt) => sum + opt.stock, 0);
    }, 0);
  }
  return this.stock;
});

// Giá thấp nhất (nếu có variants)
productSchema.virtual('minPrice').get(function() {
  if (this.variants && this.variants.length > 0) {
    const prices = this.variants.flatMap(v => v.options.map(o => o.price));
    return Math.min(...prices, this.price);
  }
  return this.price;
});

// Giá cao nhất (nếu có variants)
productSchema.virtual('maxPrice').get(function() {
  if (this.variants && this.variants.length > 0) {
    const prices = this.variants.flatMap(v => v.options.map(o => o.price));
    return Math.max(...prices, this.price);
  }
  return this.price;
});

// ===== MIDDLEWARE =====
// Tự động set image từ images[0] nếu chưa có
productSchema.pre('save', function(next) {
  // Set image chính từ mảng images
  if (!this.image && this.images && this.images.length > 0) {
    this.image = this.images[0].url;
  }
  
  // Đảm bảo có ít nhất 1 ảnh là primary
  if (this.images && this.images.length > 0) {
    const hasPrimary = this.images.some(img => img.isPrimary);
    if (!hasPrimary) {
      this.images[0].isPrimary = true;
    }
  }
  
  // Convert single image thành array nếu cần
  if (this.image && (!this.images || this.images.length === 0)) {
    this.images = [{
      url: this.image,
      alt: this.name,
      isPrimary: true
    }];
  }
  
  next();
});

// ===== METHODS =====
// Kiểm tra có biến thể không
productSchema.methods.hasVariants = function() {
  return this.variants && this.variants.length > 0;
};

// Kiểm tra còn hàng
productSchema.methods.isInStock = function() {
  if (this.hasVariants()) {
    return this.variants.some(variant => 
      variant.options.some(opt => opt.stock > 0)
    );
  }
  return this.stock > 0;
};

// Lấy giá theo variant
productSchema.methods.getVariantPrice = function(variantName, optionName) {
  if (!this.hasVariants()) return this.price;
  
  const variant = this.variants.find(v => v.name === variantName);
  if (!variant) return this.price;
  
  const option = variant.options.find(o => o.name === optionName);
  return option ? option.price : this.price;
};

export default mongoose.model('Product', productSchema);
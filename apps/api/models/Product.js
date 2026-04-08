import mongoose from 'mongoose';

/**
 * Variant Schema - Định nghĩa các thuộc tính tùy chọn (Size, Color, etc.)
 * Giá (price) ở đây được hiểu là PHỤ PHÍ (Surcharge) cộng thêm vào giá gốc.
 */
const variantSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  options: [{
    name:      { type: String, required: true, trim: true },
    price:     { type: Number, required: true, min: 0, default: 0 }, // Surcharge
    stock:     { type: Number, required: true, min: 0, default: 0 },
    soldCount: { type: Number, default: 0, min: 0 },
    sku:       { type: String, trim: true },
    image:     { type: String },
    isDefault: { type: Boolean, default: false }
  }]
});

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  
  price: { type: Number, required: true, min: 0 },
  
  originalPrice: { type: Number, min: 0, default: 0 },

  // Thương hiệu
  brandId: { type: mongoose.Schema.Types.ObjectId, ref: 'Brand' },
  brand:   { type: String, trim: true },

  slug: { type: String, required: true, unique: true, trim: true, lowercase: true },

  image:  String, // Ảnh đại diện chính
  images: [{
    url:       { type: String, required: true },
    alt:       { type: String, default: '' },
    isPrimary: { type: Boolean, default: false }
  }],

  variants: [variantSchema],

  description:  { type: String, trim: true },
  tags:         [{ type: String, trim: true, lowercase: true }],
  categorySlug: { type: String, trim: true },

  specs: {
    condition:   { type: String, default: 'New' },
    accessories: { type: String, default: 'Fullbox' },
    material:    String,
    styleCode:   String,
    colorway:    String,
    releaseDate: Date
  },

  metaTitle:       { type: String, trim: true },
  metaDescription: { type: String, trim: true },
  rating:          { type: Number, default: 5, min: 0, max: 5 },
  reviewCount:     { type: Number, default: 0, min: 0 },

  stock:     { type: Number, default: 0, min: 0 },
  soldCount: { type: Number, default: 0, min: 0 },

  // Trạng thái hiển thị
  featured:     { type: Boolean, default: false },
  isNew:        { type: Boolean, default: false },
  hasPromotion: { type: Boolean, default: false },
  status: {
    type:    String,
    enum:    ['active', 'inactive', 'out_of_stock'],
    default: 'active'
  }
}, {
  timestamps: true,
  toJSON:  { virtuals: true },
  toObject: { virtuals: true },
  suppressReservedKeysWarning: true
});

// ===== INDEXES =====
productSchema.index({ categorySlug: 1 });
productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ "variants.options.sku": 1 }, { sparse: true }); // Tối ưu tìm kiếm theo SKU

// ===== VIRTUALS =====

// Tổng stock thực tế - gộp từ tất cả variants hoặc lấy stock gốc
productSchema.virtual('totalStock').get(function () {
  if (this.variants?.length > 0) {
    return this.variants.reduce((total, v) =>
      total + v.options.reduce((sum, opt) => sum + (opt.stock || 0), 0), 0);
  }
  return this.stock;
});

// Tổng soldCount thực tế
productSchema.virtual('totalSoldCount').get(function () {
  if (this.variants?.length > 0) {
    return this.variants.reduce((total, v) =>
      total + v.options.reduce((sum, opt) => sum + (opt.soldCount || 0), 0), 0);
  }
  return this.soldCount;
});

// Giá thấp nhất có thể (Base + Min Surcharges)
productSchema.virtual('minPrice').get(function () {
  if (!this.variants?.length) return this.price || 0;
  let surcharge = 0;
  this.variants.forEach(v => {
    if (v.options?.length) {
      const prices = v.options.map(o => o.price || 0);
      surcharge += Math.min(...prices);
    }
  });
  return (this.price || 0) + surcharge;
});

// Giá cao nhất có thể (Base + Max Surcharges)
productSchema.virtual('maxPrice').get(function () {
  if (!this.variants?.length) return this.price || 0;
  let surcharge = 0;
  this.variants.forEach(v => {
    if (v.options?.length) {
      const prices = v.options.map(o => o.price || 0);
      surcharge += Math.max(...prices);
    }
  });
  return (this.price || 0) + surcharge;
});

// Giá mặc định (Dựa trên các option isDefault)
productSchema.virtual('defaultPrice').get(function () {
  if (!this.variants?.length) return this.price || 0;
  let surcharge = 0;
  this.variants.forEach(v => {
    const opt = v.options.find(o => o.isDefault) || v.options[0];
    if (opt) surcharge += (opt.price || 0);
  });
  return (this.price || 0) + surcharge;
});

// ===== MIDDLEWARE =====

productSchema.pre('save', async function (next) {
  // 1. Đảm bảo mỗi variant có đúng 1 option mặc định
  if (this.variants?.length) {
    this.variants.forEach(v => {
      if (v.options?.length && !v.options.some(o => o.isDefault)) {
        v.options[0].isDefault = true;
      }
    });
  }

  // 2. Tự động đồng bộ tag 'new'/'2hand' dựa trên condition
  if (this.specs?.condition) {
    const condition = this.specs.condition.trim().toLowerCase();
    if (!this.tags) this.tags = [];
    const isActuallyNew = ['100%', 'new', 'brand new'].includes(condition);
    const tagToAdd    = isActuallyNew ? 'new' : '2hand';
    const tagToRemove = isActuallyNew ? '2hand' : 'new';
    
    this.tags = this.tags.filter(t => t !== tagToRemove);
    if (!this.tags.includes(tagToAdd)) this.tags.push(tagToAdd);
    this.isNew = isActuallyNew;
  }

  // 3. Đồng bộ hình ảnh
  if (this.images?.length) {
    if (!this.images.some(i => i.isPrimary)) this.images[0].isPrimary = true;
    const primaryImg = this.images.find(i => i.isPrimary) || this.images[0];
    this.image = primaryImg.url;
  } else if (this.image) {
    this.images = [{ url: this.image, alt: this.name, isPrimary: true }];
  }

  // 4. Đồng bộ tên Brand nếu có brandId (Tránh mâu thuẫn dữ liệu)
  if (this.isModified('brandId') && this.brandId) {
    const Brand = mongoose.model('Brand');
    const brandDoc = await Brand.findById(this.brandId);
    if (brandDoc) this.brand = brandDoc.name;
  }

  // 5. Cập nhật tồn kho tổng vật lý (để API lean() vẫn lấy được dữ liệu chính xác)
  if (this.variants && this.variants.length > 0) {
    this.stock = this.variants.reduce((total, v) => 
      total + v.options.reduce((sum, opt) => sum + (Number(opt.stock) || 0), 0), 0);
  }

  // 6. Cập nhật trạng thái dựa trên stock
  this.status = this.stock === 0 ? 'out_of_stock' : (this.status === 'out_of_stock' ? 'active' : this.status);

  next();
});

// ===== INSTANCE METHODS =====

productSchema.methods.hasVariants = function () {
  return !!(this.variants?.length > 0);
};

/**
 * Kiểm tra còn hàng cho một cấu hình cụ thể hoặc tổng thể
 * @param {Object} selectedOptions - { "Size": "42" }
 */
productSchema.methods.isInStock = function (selectedOptions = {}) {
  if (this.hasVariants()) {
    // Nếu có chọn cấu hình cụ thể
    if (Object.keys(selectedOptions).length > 0) {
      return this.variants.every(v => {
        const optName = selectedOptions[v.name];
        const opt = v.options.find(o => o.name === optName);
        return opt ? opt.stock > 0 : false;
      });
    }
    // Nếu kiểm tra tổng quát: ít nhất một cấu hình phải còn hàng
    return this.totalStock > 0;
  }
  return this.stock > 0;
};

/**
 * Tính giá cuối theo option được chọn
 */
productSchema.methods.calculatePrice = function (selectedOptions = {}) {
  let surcharge = 0;
  if (this.variants?.length) {
    this.variants.forEach(v => {
      const opt = v.options.find(o => o.name === selectedOptions[v.name])
               || v.options.find(o => o.isDefault)
               || v.options[0];
      if (opt) surcharge += (opt.price || 0);
    });
  }
  return (this.price || 0) + surcharge;
};

/**
 * Xử lý bán hàng nguyên tử (Atomic) - Khuyến khích dùng findOneAndUpdate ở Controller
 * Nhưng method này cung cấp logic chuẩn để tham chiếu
 */
productSchema.methods.getSaleUpdateQuery = function (selectedOptions = {}, quantity = 1) {
  const update = { $inc: {} };
  const filter = { _id: this._id };

  if (this.hasVariants()) {
    this.variants.forEach((v, vIdx) => {
      const optIdx = v.options.findIndex(o => o.name === selectedOptions[v.name]);
      if (optIdx > -1) {
        update.$inc[`variants.${vIdx}.options.${optIdx}.stock`] = -quantity;
        update.$inc[`variants.${vIdx}.options.${optIdx}.soldCount`] = quantity;
        filter[`variants.${vIdx}.options.${optIdx}.stock`] = { $gte: quantity };
      }
    });
  } else {
    update.$inc.stock = -quantity;
    update.$inc.soldCount = quantity;
    filter.stock = { $gte: quantity };
  }
  
  return { filter, update };
};

export default mongoose.model('Product', productSchema);
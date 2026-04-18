import Brand from '../models/Brand.js';

/**
 * Lấy danh sách thương hiệu
 * GET /api/admin/brands (Admin) hoặc /api/brands (Public)
 */
export const getBrands = async (req, res) => {
  try {
    const brands = await Brand.find().sort({ name: 1 }).lean();
    res.status(200).json({ 
      success: true, 
      brands 
    });
  } catch (error) {
    console.error('❌ Error fetching brands:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ nội bộ' });
  }
};

/**
 * Lấy chi tiết thương hiệu
 */
export const getBrandBySlug = async (req, res) => {
  try {
    const brand = await Brand.findOne({ slug: req.params.slug }).lean();
    if (!brand) return res.status(404).json({ success: false, message: 'Không tìm thấy thương hiệu' });
    res.status(200).json({ success: true, brand });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Helper: Tạo slug chuẩn tiếng Việt
 */
const createSlug = (text) => {
  return text.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
};

/**
 * Tạo thương hiệu mới (Admin)
 */
export const createBrand = async (req, res) => {
  try {
    const { name, logo, description, origin, website } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Tên thương hiệu là bắt buộc' });
    }

    const existing = await Brand.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Thương hiệu này đã tồn tại' });
    }

    const brand = await Brand.create({
      name: name.trim(),
      slug: createSlug(name),
      logo: logo || '',
      description: description || '',
      origin: origin || '',
      website: website || ''
    });

    res.status(201).json({ success: true, brand });
  } catch (error) {
    console.error('❌ Error creating brand:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Cập nhật thương hiệu (Admin)
 */
export const updateBrand = async (req, res) => {
  try {
    const { name, logo, description, origin, website } = req.body;
    const { id } = req.params;

    const brand = await Brand.findById(id);
    if (!brand) return res.status(404).json({ success: false, message: 'Không tìm thấy thương hiệu' });

    // Cập nhật các trường
    if (name) brand.name = name.trim();
    if (logo !== undefined) brand.logo = logo;
    if (description !== undefined) brand.description = description;
    if (origin !== undefined) brand.origin = origin;
    if (website !== undefined) brand.website = website;

    await brand.save();

    res.status(200).json({ success: true, brand });
  } catch (error) {
    console.error('❌ Error updating brand:', error);
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Tên thương hiệu đã bị trùng' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Xóa thương hiệu (Admin)
 */
export const deleteBrand = async (req, res) => {
  try {
    const brand = await Brand.findByIdAndDelete(req.params.id);
    if (!brand) return res.status(404).json({ success: false, message: 'Không tìm thấy thương hiệu' });
    
    res.status(200).json({ success: true, message: 'Đã xóa thương hiệu thành công' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

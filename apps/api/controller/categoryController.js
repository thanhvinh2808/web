import Category from '../models/Category.js';

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
const getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.json(categories);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Create category (Admin)
const createCategory = async (req, res) => {
  try {
    const { name, description, icon, slug } = req.body;
    
    // Kiểm tra trùng lặp
    const existing = await Category.findOne({ $or: [{ name }, { slug }] });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Tên danh mục hoặc slug đã tồn tại' });
    }

    const category = await Category.create({ name, description, icon, slug });
    res.status(201).json({ success: true, data: category });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update category (Admin)
const updateCategory = async (req, res) => {
  try {
    const { name, description, icon, slug } = req.body;
    const category = await Category.findOneAndUpdate(
      { slug: req.params.slug },
      { name, description, icon, slug },
      { new: true }
    );

    if (!category) return res.status(404).json({ success: false, message: 'Không tìm thấy danh mục' });
    res.json({ success: true, data: category });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete category (Admin)
const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findOneAndDelete({ slug: req.params.slug });
    if (!category) return res.status(404).json({ success: false, message: 'Không tìm thấy danh mục' });
    res.json({ success: true, message: 'Đã xóa danh mục' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export { getAllCategories, createCategory, updateCategory, deleteCategory };

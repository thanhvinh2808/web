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
    res.status(500).send('Server Error');
  }
};

export { getAllCategories };
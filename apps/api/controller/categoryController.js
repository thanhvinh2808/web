<<<<<<< HEAD
const Category = require('../models/Category');
=======
import Category from '../models/Category.js';
>>>>>>> 9520cf96838d6006a1127e0ed95989833b5aa1c4

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

<<<<<<< HEAD
module.exports = {
  getAllCategories,
};
=======
export { getAllCategories };
>>>>>>> 9520cf96838d6006a1127e0ed95989833b5aa1c4

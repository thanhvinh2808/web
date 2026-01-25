import express from 'express';
const router = express.Router();
import { getBlogs, getBlogBySlug } from '../controller/blogController.js';

// @route   /api/blogs
router.route('/').get(getBlogs);

// @route   /api/blogs/:slug
router.route('/:slug').get(getBlogBySlug);

export default router;

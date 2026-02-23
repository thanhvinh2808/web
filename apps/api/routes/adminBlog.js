import express from 'express';
import {
  getBlogs,
  getBlogById,
  createBlog,
  updateBlog,
  deleteBlog,
} from '../controller/adminBlogController.js';

const router = express.Router();


router.route('/').get(getBlogs).post(createBlog);

router.route('/:id').get(getBlogById).put(updateBlog).delete(deleteBlog);

export default router;
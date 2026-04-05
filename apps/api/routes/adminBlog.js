import express from 'express';
import {
  getBlogs,
  getBlogById,
  createBlog,
  updateBlog,
  deleteBlog,
} from '../controller/adminBlogController.js';
import { uploadSingle, handleUploadError } from '../middleware/upload.js';

const router = express.Router();


router.route('/')
  .get(getBlogs)
  .post(uploadSingle, handleUploadError, createBlog);

router.route('/:id')
  .get(getBlogById)
  .put(uploadSingle, handleUploadError, updateBlog)
  .delete(deleteBlog);

export default router;
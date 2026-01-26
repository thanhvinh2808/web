import express from 'express';
const router = express.Router();
import {
    getBlogs,
    getBlogById,
    createBlog,
    updateBlog,
    deleteBlog
} from '../controller/adminBlogController.js';
import { authenticateToken } from '../middleware/auth.js';
import { isAdmin } from '../middleware/isAdmin.js'; // Import isAdmin middleware

// All routes here are prefixed with /api/admin/blogs
// They are all protected by admin middleware

router.route('/')
    .get(authenticateToken, isAdmin, getBlogs)
    .post(authenticateToken, isAdmin, createBlog);

router.route('/:id')
    .get(authenticateToken, isAdmin, getBlogById)
    .put(authenticateToken, isAdmin, updateBlog)
    .delete(authenticateToken, isAdmin, deleteBlog);

export default router;

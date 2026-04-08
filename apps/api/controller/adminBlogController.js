import Blog from '../models/Blog.js';
import mongoose from 'mongoose';
import { deleteFile } from '../middleware/upload.js';

// Utility to create a slug from a title
const createSlug = (title) => {
    return title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .replace(/-+/g, `-`);
};

// @desc    Get all blogs for admin (paginated)
// @route   GET /api/admin/blogs
// @access  Admin
const getBlogs = async (req, res) => {
    const pageSize = 10;
    const page = Number(req.query.pageNumber) || 1;
    const search = req.query.search || '';

    const keyword = search
        ? {
            title: {
                $regex: search,
                $options: 'i', // Case-insensitive
            },
        }
        : {};

    try {
        const count = await Blog.countDocuments({ ...keyword });
        const blogs = await Blog.find({ ...keyword })
            .sort({ createdAt: -1 })
            .limit(pageSize)
            .skip(pageSize * (page - 1));

        res.json({
            blogs,
            page,
            pages: Math.ceil(count / pageSize),
            total: count
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get a single blog by ID
// @route   GET /api/admin/blogs/:id
// @access  Admin
const getBlogById = async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ message: 'Invalid blog ID' });
    }
    try {
        const blog = await Blog.findById(req.params.id);
        if (blog) {
            res.json(blog);
        } else {
            res.status(404).json({ message: 'Blog not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Create a new blog
// @route   POST /api/admin/blogs
// @access  Admin
const createBlog = async (req, res) => {
    const { title, content, excerpt, category, tags, published } = req.body;
    
    // Get image from file upload (Cloudinary or Local) or fallback to URL in body
    let image = req.file ? (req.file.path || req.file.secure_url) : req.body.image;

    if (!title || !content) {
        return res.status(400).json({ message: 'Title and content are required' });
    }

    try {
        let slug = createSlug(title);
        const slugExists = await Blog.findOne({ slug });
        if (slugExists) {
            slug = `${slug}-${Date.now()}`;
        }
        
        const blog = new Blog({
            title,
            slug,
            content,
            excerpt: excerpt || content.substring(0, 150).replace(/<[^>]*>/g, ''),
            category,
            tags: tags ? (Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim())) : [],
            image: image || '',
            published: published === 'true' || published === true,
            author: {
                name: req.user.name || 'Admin',
            }
        });

        const createdBlog = await blog.save();
        res.status(201).json(createdBlog);
    } catch (error) {
        // Cleanup uploaded file if DB save fails
        if (req.file) await deleteFile(req.file.path || req.file.secure_url);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Update a blog
// @route   PUT /api/admin/blogs/:id
// @access  Admin
const updateBlog = async (req, res) => {
     if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ message: 'Invalid blog ID' });
    }

    const { title, content, excerpt, category, tags, published, slug } = req.body;
    let newImage = req.file ? (req.file.path || req.file.secure_url) : req.body.image;

    try {
        const blog = await Blog.findById(req.params.id);

        if (!blog) {
            if (req.file) await deleteFile(req.file.path || req.file.secure_url);
            return res.status(404).json({ message: 'Blog not found' });
        }

        // Handle slug change
        if (slug && slug !== blog.slug) {
            const slugExists = await Blog.findOne({ slug });
            if (slugExists) {
                if (req.file) await deleteFile(req.file.path || req.file.secure_url);
                return res.status(400).json({ message: 'Slug is already in use' });
            }
            blog.slug = slug;
        }

        // Delete old image if a new file was uploaded
        if (req.file && blog.image) {
            await deleteFile(blog.image);
        }

        if (published !== undefined) {
             const isPublished = published === 'true' || published === true;
             if (isPublished && !blog.published) blog.publishedAt = Date.now();
             blog.published = isPublished;
        }

        blog.title = title || blog.title;
        blog.content = content || blog.content;
        
        if (content && !excerpt) {
             blog.excerpt = content.substring(0, 150).replace(/<[^>]*>/g, '');
        } else if (excerpt !== undefined) {
             blog.excerpt = excerpt;
        }

        blog.category = category || blog.category;
        
        if (tags !== undefined) {
             blog.tags = Array.isArray(tags) ? tags : (typeof tags === 'string' ? tags.split(',').map(t => t.trim()) : tags);
        }

        if (newImage !== undefined) {
             blog.image = newImage;
        }
        
        const updatedBlog = await blog.save();
        res.json(updatedBlog);
    } catch (error) {
        if (req.file) await deleteFile(req.file.path || req.file.secure_url);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Delete a blog
// @route   DELETE /api/admin/blogs/:id
// @access  Admin
const deleteBlog = async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ message: 'Invalid blog ID' });
    }
    
    try {
        const blog = await Blog.findById(req.params.id);

        if (blog) {
            // Delete image from storage
            if (blog.image) await deleteFile(blog.image);
            
            await blog.deleteOne();
            res.json({ message: 'Blog removed' });
        } else {
            res.status(404).json({ message: 'Blog not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

export { getBlogs, getBlogById, createBlog, updateBlog, deleteBlog };
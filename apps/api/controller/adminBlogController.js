import Blog from '../models/Blog.js';
import mongoose from 'mongoose';

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
    const { title, content, excerpt, category, tags, image, published } = req.body;

    if (!title || !content) {
        return res.status(400).json({ message: 'Title and content are required' });
    }

    try {
        let slug = createSlug(title);
        const slugExists = await Blog.findOne({ slug });
        if (slugExists) {
            // Append a timestamp to make the slug unique
            slug = `${slug}-${Date.now()}`;
        }
        
        const blog = new Blog({
            title,
            slug,
            content,
            excerpt: excerpt || content.substring(0, 150),
            category,
            tags,
            image,
            published,
            author: {
                name: req.user.name || 'Admin', // Assuming req.user is populated by auth middleware
            }
        });

        const createdBlog = await blog.save();
        res.status(201).json(createdBlog);
    } catch (error) {
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

    const { title, content, excerpt, category, tags, image, published, slug } = req.body;

    try {
        const blog = await Blog.findById(req.params.id);

        if (!blog) {
            return res.status(404).json({ message: 'Blog not found' });
        }

        // Check if the new slug is unique if it's being changed
        if (slug && slug !== blog.slug) {
            const slugExists = await Blog.findOne({ slug: slug });
            if (slugExists) {
                return res.status(400).json({ message: 'Slug is already in use' });
            }
            blog.slug = slug;
        }

        blog.title = title || blog.title;
        blog.content = content || blog.content;
        blog.excerpt = excerpt || blog.excerpt;
        blog.category = category || blog.category;
        blog.tags = tags || blog.tags;
        blog.image = image !== undefined ? image : blog.image;
        blog.published = published !== undefined ? published : blog.published;
        
        const updatedBlog = await blog.save();
        res.json(updatedBlog);
    } catch (error) {
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

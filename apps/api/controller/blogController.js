import Blog from '../models/Blog.js';

// @desc    Fetch all PUBLISHED blogs with optional filtering
// @route   GET /api/blogs
// @access  Public
const getBlogs = async (req, res) => {
  try {
    const { category, featured, limit } = req.query;
    
    const query = { published: true };
    if (category) query.category = category;
    if (featured === 'true') query.featured = true;

    const blogs = await Blog.find(query)
      .sort({ publishedAt: -1 })
      .limit(limit ? parseInt(limit) : 0);
      
    res.json(blogs);
  } catch (error) {
    console.error('Error fetching blogs:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Fetch a single blog by slug
// @route   GET /api/blogs/:slug
// @access  Public
const getBlogBySlug = async (req, res) => {
  try {
    // Find the blog, ensure it's published, and increment view count atomically
    const blog = await Blog.findOneAndUpdate(
      { slug: req.params.slug, published: true },
      { $inc: { views: 1 } },
      { new: true } // Returns the updated document
    );

    if (blog) {
      res.json(blog);
    } else {
      // Use a generic message for public-facing 404
      res.status(404).json({ message: 'Blog not found' });
    }
  } catch (error) {
    console.error('Error fetching blog by slug:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

export { getBlogs, getBlogBySlug };

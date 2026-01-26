import Blog from '../models/Blog.js';

// @desc    Fetch all PUBLISHED blogs
// @route   GET /api/blogs
// @access  Public
const getBlogs = async (req, res) => {
  try {
    const query = { published: true };
    console.log('Fetching public blogs with query:', query); // Log the query
    const blogs = await Blog.find(query).sort({ publishedAt: -1 });
    console.log(`Found ${blogs.length} public blogs.`); // Log the count
    res.json(blogs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Fetch a single blog by slug
// @route   GET /api/blogs/:slug
// @access  Public
const getBlogBySlug = async (req, res) => {
  try {
    // Find the blog and ensure it's published
    const blog = await Blog.findOne({ slug: req.params.slug, published: true });

    if (blog) {
      // Increment view count
      blog.views = (blog.views || 0) + 1;
      await blog.save();
      res.json(blog);
    } else {
      // Use a generic message for public-facing 404
      res.status(404).json({ message: 'Blog not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

export { getBlogs, getBlogBySlug };

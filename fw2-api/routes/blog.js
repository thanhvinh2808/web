app.get('/api/blog', (req, res) => {
  try {
    const blogs = readJSON('blogs.json');
    res.json(blogs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load blogs' });
  }
});

app.get('/api/blog/:id', (req, res) => {
  try {
    const blogs = readJSON('blogs.json');
    const blog = blogs.find(b => b.id === parseInt(req.params.id));
    
    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }
    
    res.json(blog);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load blog' });
  }
});
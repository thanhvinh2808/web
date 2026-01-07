app.get('/', (req, res) => {
  res.json({ 
    message: 'TechStore API Server',
    version: '1.0.0',
    endpoints: [
      'GET /api/home',
      'GET /api/products',
      'GET /api/products/:id',
      'GET /api/categories',
      'GET /api/products/category/:slug',
      'GET /api/about',
      'POST /api/contact',
      'GET /api/blog',
      'GET /api/blog/:id',
      'POST /api/login',
      'POST /api/register',
      'GET /api/faqs'
    ]
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
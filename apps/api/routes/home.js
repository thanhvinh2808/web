app.get('/api/home', (req, res) => {
  res.json({
    title: 'Chào mừng đến TechStore',
    subtitle: 'Cửa hàng công nghệ hàng đầu Việt Nam',
    featured: readJSON('products.json').slice(0, 4)
  });
});
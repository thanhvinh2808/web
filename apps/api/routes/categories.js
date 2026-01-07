app.get('/api/categories', (req, res) => {
  try {
    const categories = readJSON('categories.json');
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load categories' });
  }
});

app.get('/api/products/categories/:slug', (req, res) => {
  try {
    const products = readJSON('products.json');
    const filtered = products.filter(p => p.category === req.params.slug);
    res.json(filtered);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load products' });
  }
});
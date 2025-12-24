app.get('/api/products', (req, res) => {
  try {
    const products = readJSON('products.json');
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load products' });
  }
});

app.get('/api/products/:slug', (req, res) => {
  try {
    const products = readJSON('products.json');
    const product = products.find(p => p.slug === parseInt(req.params.slug));
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load product' });
  }
});
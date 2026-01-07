app.get('/api/about', (req, res) => {
  res.json({
    title: 'Về TechStore',
    description: 'TechStore là cửa hàng công nghệ uy tín với hơn 10 năm kinh nghiệm trong ngành. Chúng tôi cung cấp các sản phẩm chất lượng cao với giá cả hợp lý.',
    mission: 'Mang đến những sản phẩm công nghệ tốt nhất cho người tiêu dùng Việt Nam',
    vision: 'Trở thành chuỗi cửa hàng công nghệ hàng đầu Đông Nam Á',
    stats: {
      customers: '50,000+',
      products: '10,000+',
      stores: '20+',
      years: '10+'
    }
  });
});
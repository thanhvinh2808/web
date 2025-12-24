app.post('/api/contact', (req, res) => {
  const { name, email, message } = req.body;
  console.log('Contact form:', { name, email, message });
  res.json({ success: true, message: 'Cảm ơn bạn đã liên hệ! Chúng tôi sẽ phản hồi sớm.' });
});
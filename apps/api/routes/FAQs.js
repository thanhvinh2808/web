app.get('/api/faqs', (req, res) => {
  res.json([
    {
      id: 1,
      question: 'Thời gian giao hàng là bao lâu?',
      answer: 'Thời gian giao hàng từ 2-5 ngày làm việc tùy theo khu vực.'
    },
    {
      id: 2,
      question: 'Tôi có thể đổi trả hàng không?',
      answer: 'Có, bạn có thể đổi trả trong vòng 7 ngày nếu sản phẩm còn nguyên tem, chưa qua sử dụng.'
    },
    {
      id: 3,
      question: 'Các hình thức thanh toán?',
      answer: 'Chúng tôi hỗ trợ thanh toán COD, chuyển khoản, thẻ tín dụng và ví điện tử.'
    },
    {
      id: 4,
      question: 'Có bảo hành sản phẩm không?',
      answer: 'Tất cả sản phẩm đều có bảo hành từ 6-24 tháng tùy loại sản phẩm.'
    }
  ]);
});

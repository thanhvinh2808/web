import { Router } from 'express';
const router = Router();

// Database giả lập
let orders = [];

// Tạo đơn hàng
router.post('/', (req, res) => {
  const { userId, items, total, shippingAddress } = req.body;

  const newOrder = {
    id: orders.length + 1,
    userId,
    items,
    total,
    shippingAddress,
    status: 'pending',
    createdAt: new Date().toISOString()
  };

  orders.push(newOrder);
  res.status(201).json({ message: 'Đặt hàng thành công', order: newOrder });
});

// Lấy đơn hàng của user
router.get('/user/:userId', (req, res) => {
  const { userId } = req.params;
  const userOrders = orders.filter(o => o.userId === parseInt(userId));
  res.json(userOrders);
});

// Lấy chi tiết đơn hàng
router.get('/:id', (req, res) => {
  const order = orders.find(o => o.id === parseInt(req.params.id));

  if (!order) {
    return res.status(404).json({ message: 'Đơn hàng không tồn tại' });
  }

  res.json(order);
});

// Cập nhật trạng thái đơn hàng
router.put('/:id/status', (req, res) => {
  const { status } = req.body;
  const order = orders.find(o => o.id === parseInt(req.params.id));

  if (!order) {
    return res.status(404).json({ message: 'Đơn hàng không tồn tại' });
  }

  order.status = status;
  res.json({ message: 'Đã cập nhật trạng thái', order });
});

export default router;